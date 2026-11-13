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

  // ---- encryption for the public brokers ------------------------------------
  // Anyone can read a public broker, so every relay message is sealed with a
  // key made from the room code (only the two players know it) and topics use
  // a hash of the code instead of the code itself. SHA-256 keystream + HMAC
  // tag (encrypt-then-MAC); messages that fail the tag check are dropped.
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var W = new Array(64);
  function sha256(m) {
    var l = m.length, n = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(n), i, j;
    b.set(m); b[l] = 0x80;
    var bits = l * 8;
    b[n - 4] = (bits >>> 24) & 255; b[n - 3] = (bits >>> 16) & 255; b[n - 2] = (bits >>> 8) & 255; b[n - 1] = bits & 255;
    b[n - 5] = Math.floor(l / 0x20000000) & 255;
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (j = 0; j < n; j += 64) {
      for (i = 0; i < 16; i++) W[i] = (b[j + i * 4] << 24) | (b[j + i * 4 + 1] << 16) | (b[j + i * 4 + 2] << 8) | b[j + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var x = W[i - 15], y = W[i - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      var a = h0, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7, bb = h1;
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + bb) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    var out = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (i = 0; i < 8; i++) { out[i * 4] = hs[i] >>> 24; out[i * 4 + 1] = (hs[i] >>> 16) & 255; out[i * 4 + 2] = (hs[i] >>> 8) & 255; out[i * 4 + 3] = hs[i] & 255; }
    return out;
  }
  function hmac(key, msg) {
    var ip = new Uint8Array(64), op = new Uint8Array(64), i;
    for (i = 0; i < 64; i++) { ip[i] = (key[i] || 0) ^ 0x36; op[i] = (key[i] || 0) ^ 0x5c; }
    return sha256(cat([op, sha256(cat([ip, msg]))]));
  }
  function hex(b) { var s = '', i; for (i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16); return s; }
  function b64(b) { var s = '', i; for (i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function unb64(s) { var r = atob(s), b = new Uint8Array(r.length), i; for (i = 0; i < r.length; i++) b[i] = r.charCodeAt(i); return b; }
  function rand(n) {
    var b = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }
  function xorStream(key, nonce, data) {
    var out = new Uint8Array(data.length), ctr = new Uint8Array(4), blk, i, k;
    for (i = 0, k = 0; i < data.length; i += 32, k++) {
      ctr[0] = k >>> 24; ctr[1] = (k >>> 16) & 255; ctr[2] = (k >>> 8) & 255; ctr[3] = k & 255;
      blk = sha256(cat([key, nonce, ctr]));
      for (var j = 0; j < 32 && i + j < data.length; j++) out[i + j] = data[i + j] ^ blk[j];
    }
    return out;
  }
  var cipherCache = {};
  // Slow on purpose (20k rounds, about 30 ms once per room) so guessing room
  // codes from a topic name is expensive.
  function Cipher(code) {
    if (cipherCache[code]) return cipherCache[code];
    var m = sha256(enc.encode('spikerally-app4|' + code)), i;
    for (i = 0; i < 20000; i++) m = sha256(m);
    var ek = sha256(cat([m, new Uint8Array([101])])), mk = sha256(cat([m, new Uint8Array([109])]));
    var c = {
      tag: hex(sha256(cat([m, new Uint8Array([116])]))).slice(0, 24),
      seal: function (text) {
        var nonce = rand(12), ct = xorStream(ek, nonce, enc.encode(text));
        var t = hmac(mk, cat([nonce, ct])).subarray(0, 16);
        return 'v1.' + b64(cat([nonce, ct, t]));
      },
      open: function (text) {
        if (typeof text !== 'string' || text.slice(0, 3) !== 'v1.' || text.length > 200000) return null;
        var b;
        try { b = unb64(text.slice(3)); } catch (e) { return null; }
        if (b.length < 28) return null;
        var nonce = b.subarray(0, 12), ct = b.subarray(12, b.length - 16), t = b.subarray(b.length - 16);
        var want = hmac(mk, cat([nonce, ct])), diff = 0;
        for (var j = 0; j < 16; j++) diff |= want[j] ^ t[j];
        if (diff) return null;
        try { return dec.decode(xorStream(ek, nonce, ct)); } catch (e2) { return null; }
      }
    };
    cipherCache[code] = c;
    return c;
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
    if (this.cipher && text !== '') text = this.cipher.seal(text);
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
        var text = dec.decode(body.subarray(off));
        // Unsealed or tampered messages are dropped; an empty retained message
        // (the "room closed" mark) is the only plain one.
        if (this.cipher && text !== '') text = this.cipher.open(text);
        if (text !== null && this.onmessage) this.onmessage(topic, text);
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
    this.cipher = (opts && opts.cipher) || null;
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
    c.cipher = this.cipher;
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

  SR.relay = { Hub: Hub, Link: Link, Cipher: Cipher, sha256: sha256, hmac: hmac };
})();
