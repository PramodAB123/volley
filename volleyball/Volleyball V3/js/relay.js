// Backup link for online play. When the two browsers can't connect directly
// (strict Wi-Fi, mobile data, or the PeerJS server is down), messages go
// through a free public MQTT broker over a secure WebSocket instead. This is a
// minimal MQTT 3.1.1 client: connect, subscribe, publish (QoS 0), retained
// messages and a last will, which is all the game needs.
(function () {
  var enc = new TextEncoder(), dec = new TextDecoder();

  function str(s) {
    var b = enc.encode(s), out = new Uint8Array(b.length + 2);
    out[0] = b.length >> 8; out[1] = b.length & 255; out.set(b, 2);
    return out;
  }
  function cat(parts) {
    var n = 0, i, o = 0;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n);
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  function packet(type, body) {
    var len = body.length, hdr = [type];
    do { var d = len % 128; len = Math.floor(len / 128); hdr.push(len > 0 ? d | 128 : d); } while (len > 0);
    return cat([new Uint8Array(hdr), body]);
  }

  // One broker connection. Events: onopen(), onclose(), onmessage(topic, text).
  function Client(url, clientId, will) {
    var self = this;
    this.url = url;
    this.open = false;
    this.closed = false;
    this.pid = 1;
    this.buf = new Uint8Array(0);
    try { this.ws = new WebSocket(url, ['mqtt']); } catch (e) { this.ws = null; setTimeout(function () { self.fail(); }, 0); return; }
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = function () {
      var flags = 0x02, payload = [str(clientId)];
      if (will) { flags |= 0x04 | (will.retain ? 0x20 : 0); payload.push(str(will.topic), str(will.payload || '')); }
      self.raw(packet(0x10, cat([str('MQTT'), new Uint8Array([4, flags, 0, 30])].concat(payload))));
    };
    this.ws.onmessage = function (e) { self.feed(new Uint8Array(e.data)); };
    this.ws.onclose = this.ws.onerror = function () { self.fail(); };
    this.pinger = setInterval(function () { if (self.open) self.raw(new Uint8Array([0xC0, 0])); }, 20000);
  }
  Client.prototype.raw = function (bytes) {
    if (this.ws && this.ws.readyState === 1) { try { this.ws.send(bytes); } catch (e) { /* closing */ } }
  };
  Client.prototype.fail = function () {
    if (this.closed) return;
    this.closed = true;
    var was = this.open;
    this.open = false;
    clearInterval(this.pinger);
    try { if (this.ws) this.ws.close(); } catch (e) { /* ignore */ }
    if (this.onclose) this.onclose(was);
  };
  Client.prototype.close = function () {
    if (this.closed) return;
    this.raw(new Uint8Array([0xE0, 0]));
    this.onclose = null;
    this.fail();
  };
  Client.prototype.subscribe = function (topic) {
    var id = this.pid++ & 0xffff || 1;
    this.raw(packet(0x82, cat([new Uint8Array([id >> 8, id & 255]), str(topic), new Uint8Array([0])])));
  };
  Client.prototype.publish = function (topic, text, retain) {
    this.raw(packet(0x30 | (retain ? 1 : 0), cat([str(topic), enc.encode(text)])));
  };
  Client.prototype.bufferedAmount = function () { return this.ws ? this.ws.bufferedAmount : 0; };
  Client.prototype.feed = function (chunk) {
    var b = this.buf.length ? cat([this.buf, chunk]) : chunk;
    for (;;) {
      if (b.length < 2) break;
      var mult = 1, len = 0, i = 1, d;
      do { if (i >= b.length) { i = -1; break; } d = b[i++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
      if (i < 0 || b.length < i + len) break;
      var first = b[0], type = first & 0xF0, body = b.subarray(i, i + len);
      b = b.subarray(i + len);
      if (type === 0x20) {
        if (body[1] === 0) { this.open = true; if (this.onopen) this.onopen(); }
        else { this.fail(); return; }
      } else if (type === 0x30) {
        var tl = (body[0] << 8) | body[1], topic = dec.decode(body.subarray(2, 2 + tl));
        var off = 2 + tl + (((first >> 1) & 3) ? 2 : 0);
        if (this.onmessage) this.onmessage(topic, dec.decode(body.subarray(off)));
      }
    }
    this.buf = b.length ? new Uint8Array(b) : new Uint8Array(0);
  };

  // Connect to every broker in the list at once; the room works over whichever
  // ones are reachable, so a single broker outage doesn't break play.
  // With opts.keep, a dropped broker is dialled again (phones cut sockets while
  // the game is in the background, e.g. while the player shares the invite).
  function Hub(urls, will, opts) {
    var self = this;
    this.urls = urls;
    this.will = will;
    this.keep = !!(opts && opts.keep);
    this.ended = false;
    this.clients = [];
    this.subs = [];
    this.retained = [];
    this.n = 0;
    this.id = 'sr' + Math.random().toString(36).slice(2, 12);
    urls.forEach(function (u, i) { self.clients[i] = self.dial(u, i, 0); });
  }
  Hub.prototype.dial = function (u, i, tries) {
    var self = this, c = new Client(u, this.id + '_' + (this.n++), this.will);
    c.tries = tries;
    c.onopen = function () {
      c.tries = 0;
      self.subs.forEach(function (t) { c.subscribe(t); });
      self.retained.forEach(function (r) { c.publish(r[0], r[1], true); });
      if (self.onopen) self.onopen(c);
    };
    c.onmessage = function (t, m) { if (self.onmessage) self.onmessage(t, m, c); };
    c.onclose = function () {
      if (self.keep && !self.ended) {
        clearTimeout(c.retry);
        c.retry = setTimeout(function () { self.redial(i); }, Math.min(15000, 1000 * Math.pow(2, c.tries)));
      }
      if (self.onclose) self.onclose(c);
    };
    return c;
  };
  Hub.prototype.redial = function (i) {
    var old = this.clients[i];
    if (this.ended || !old || !old.closed) return;
    clearTimeout(old.retry);
    this.clients[i] = this.dial(this.urls[i], i, (old.tries || 0) + 1);
  };
  // Dial every dropped broker again right now (e.g. when the page comes back).
  Hub.prototype.revive = function () {
    for (var i = 0; i < this.clients.length; i++) {
      var c = this.clients[i];
      if (c && c.closed) { c.tries = 0; this.redial(i); }
    }
  };
  Hub.prototype.live = function () { return this.clients.filter(function (c) { return c.open; }); };
  Hub.prototype.dead = function () { return this.clients.every(function (c) { return c.closed; }); };
  Hub.prototype.subscribe = function (t) { this.subs.push(t); this.live().forEach(function (c) { c.subscribe(t); }); };
  Hub.prototype.publishAll = function (t, m, retain) {
    if (retain) this.retained.push([t, m]);
    this.live().forEach(function (c) { c.publish(t, m, retain); });
  };
  Hub.prototype.close = function (clearTopic) {
    this.ended = true;
    this.clients.forEach(function (c) {
      clearTimeout(c.retry);
      if (clearTopic && c.open) c.publish(clearTopic, '', true);
      c.onopen = c.onmessage = null;
      c.close();
    });
    this.clients = [];
  };

  // A link to the other player over one broker, shaped like a PeerJS
  // DataConnection (open, send, close, on) so the game code treats both alike.
  function Link(client, outTopic, me, metadata) {
    this.client = client;
    this.out = outTopic;
    this.me = me;
    this.metadata = metadata || {};
    this.open = false;
    this.handlers = {};
    this.relay = true;
  }
  Link.prototype.on = function (ev, fn) { this.handlers[ev] = fn; };
  Link.prototype.emit = function (ev, a) { if (this.handlers[ev]) this.handlers[ev](a); };
  Link.prototype.send = function (msg) {
    if (!this.open || !this.client.open) throw new Error('closed');
    this.client.publish(this.out, JSON.stringify({ f: this.me, m: msg }));
  };
  Link.prototype.start = function () { if (!this.open) { this.open = true; this.emit('open'); } };
  Link.prototype.deliver = function (msg) { if (this.open) this.emit('data', msg); };
  Link.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.emit('close');
  };
  Object.defineProperty(Link.prototype, 'bufferSize', { get: function () { return this.client && this.client.bufferedAmount() > 32000 ? 1 : 0; } });

  SR.relay = { Hub: Hub, Link: Link };
})();
