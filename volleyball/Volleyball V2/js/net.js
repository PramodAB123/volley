// Online play. One player creates a room and shares its code; a friend joins
// with it. PeerJS introduces the two browsers, then they talk directly over
// WebRTC. The host's browser runs the match (team 0 = host, team 1 = friend);
// the friend sends their calls and receives the game state ~30 times a second,
// drawn from their own end of the court. If a direct link can't be made, the
// same messages go through a public relay server instead (see relay.js).
(function () {
  var PREFIX = 'spikerally-v1-';
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var SNAP_MS = 33, FAST_ID = 7, PING_MS = 1000, LOST_MS = 6000, REJOIN_MS = 30000, JOIN_TIMEOUT_MS = 20000, P2P_WAIT_MS = 6000, ROOM_CHECK_MS = 3500;
  var C = SR.COURT;
  var $ = function (id) { return document.getElementById(id); };

  function now() { return Date.now(); }
  function r3(v) { return Math.round((v || 0) * 1000) / 1000; }
  function r2(v) { return Math.round((v || 0) * 100) / 100; }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function mx(x) { return C.L - x; }
  function my(y) { return C.W - y; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function lerpAngle(a, b, k) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * k; }

  function makeCode() {
    var s = '';
    var buf = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < 6; i++) s += ALPHABET[buf[i] % ALPHABET.length];
    return s;
  }

  function cleanCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }

  // On CrazyGames the invite link comes from the SDK (the game runs in an
  // iframe, so its own address isn't a link anyone can open).
  function inviteLink(code) {
    var cgLink = SR.cg.inviteLink({ room: code });
    if (cgLink) return cgLink;
    var u = window.location.href.split('#')[0].split('?')[0];
    return u + '?room=' + code;
  }

  // Keep CrazyGames' Join / Invite buttons in step with the room.
  function roomInfo(joinable) {
    if (!N.code) return;
    SR.cg.updateRoom({ roomId: N.code, isJoinable: !!joinable, inviteParams: { room: N.code } });
  }

  var N = {
    role: null,      // 'host' | 'guest'
    phase: 'idle',   // idle | waiting | lobby | playing | rejoining | over
    peer: null,
    conn: null,
    code: null,
    token: null,
    myTeam: null,
    oppTeam: null,
    format: 'standard',
    lastRecv: 0,
    lastSnap: 0,
    lastAim: 0,
    fast: null,      // unreliable, unordered channel for snapshots
    events: [],
    timers: {},
    lostAt: 0,
    idTries: 0,
    hub: null,       // relay connections (backup path)
    links: {},       // host: relay links by guest id
    relayRoom: null, // guest: does the relay say the room exists? (null = not known yet)
    p2pDown: false,  // guest: the direct path has failed
    via: null        // 'p2p' | 'relay' once connected
  };
  SR.net = N;

  // ---- small UI helpers ----------------------------------------------------

  function status(text, kind) {
    var el = $('on-status');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function banner(text) {
    var el = $('net-banner');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('hidden', !text);
  }

  function view(which) {
    ['on-home', 'on-teams', 'on-room'].forEach(function (id) { $(id).classList.toggle('hidden', id !== which); });
  }

  function clearTimer(name) {
    if (N.timers[name]) { clearTimeout(N.timers[name]); clearInterval(N.timers[name]); N.timers[name] = null; }
  }

  // ---- connection plumbing -------------------------------------------------

  function makePeer(id) {
    if (typeof window.Peer === 'undefined') throw new Error('nopeer');
    var c = SR.NET_CONFIG || {};
    var opts = { debug: 0, config: { iceServers: c.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] } };
    if (c.host) { opts.host = c.host; opts.port = c.port; opts.path = c.path || '/'; opts.secure = c.secure !== false; }
    return id ? new window.Peer(id, opts) : new window.Peer(opts);
  }

  // ---- relay (backup path) --------------------------------------------------

  function topic(rest) { return 'spikerally/v1/' + N.code + '/' + rest; }
  function relayUrls() {
    var c = SR.NET_CONFIG || {};
    return c.relays || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  }
  function closeHub() {
    var h = N.hub;
    N.hub = null;
    if (!h) return;
    try { h.close(h.roomTopic || null); } catch (e) { /* ignore */ }
  }
  function relayLive() { return !!(N.hub && N.hub.live().length); }

  function startRelayHost() {
    closeHub();
    if (!SR.relay || !relayUrls().length) return;
    var h = N.hub = new SR.relay.Hub(relayUrls(), { topic: topic('room'), payload: '', retain: true });
    var code = N.code;
    h.roomTopic = topic('room');
    h.subscribe(topic('h'));
    h.publishAll(topic('room'), '1', true);
    h.onopen = function () { if (N.hub === h) roomReady(); };
    h.onclose = function () {
      if (N.hub !== h || !h.dead()) return;
      if (N.phase === 'waiting' && (!N.peer || !N.peer.open)) abort('Could not reach the online servers. Check your internet connection and try again.');
    };
    h.onmessage = function (t, text, client) {
      if (N.hub !== h || N.code !== code || t !== topic('h')) return;
      var w;
      try { w = JSON.parse(text); } catch (e) { return; }
      if (!w || typeof w.f !== 'string' || !w.m || typeof w.m !== 'object') return;
      var gid = w.f, m = w.m, cur = N.conn;
      if (m.t === 'hello') {
        // The same hello can arrive through several brokers: keep the first.
        if (cur && cur.relay && cur.gid === gid && cur.open) return;
        var link = new SR.relay.Link(client, topic('g/' + gid), 'h', { token: m.token || null });
        link.gid = gid;
        N.links[gid] = link;
        onHostConnection(link);
        link.start();
        return;
      }
      var l = N.links[gid];
      if (l && N.conn === l) l.deliver(m);
    };
  }

  function startRelayGuest() {
    closeHub();
    N.relayRoom = null;
    if (!SR.relay || !relayUrls().length) return;
    var h = N.hub = new SR.relay.Hub(relayUrls(), null), code = N.code, first = true;
    var inbox = 'g/' + h.id;
    h.subscribe(topic(inbox));
    h.subscribe(topic('room'));
    h.onopen = function () {
      if (N.hub !== h || !first) return;
      first = false;
      // A retained message says whether the host's room is open.
      N.timers.roomcheck = setTimeout(function () {
        if (N.hub !== h || N.relayRoom !== null) return;
        N.relayRoom = false;
        guestDecide();
      }, ROOM_CHECK_MS);
    };
    h.onclose = function () { if (N.hub === h && h.dead()) guestDecide(); };
    h.onmessage = function (t, text, client) {
      if (N.hub !== h || N.code !== code) return;
      if (t === topic('room')) { N.relayRoom = text === '1'; guestDecide(); return; }
      if (t !== topic(inbox)) return;
      var w;
      try { w = JSON.parse(text); } catch (e) { return; }
      var l = N.conn;
      if (!w || w.f !== 'h' || !w.m || !l || !l.relay) return;
      if (!l.open) { l.client = client; l.start(); }
      if (l.client === client) l.deliver(w.m);
    };
  }

  // Guest: send a hello through every broker; the host answers on one of them.
  function relayHello() {
    var h = N.hub;
    if (!h || !h.live().length) return false;
    if (!(N.conn && N.conn.relay && !N.conn.open)) {
      // Going through the relay: stop the direct attempt so the host never sees two of us.
      if (N.peer) { try { N.peer.destroy(); } catch (e) { /* ignore */ } N.peer = null; }
      dropConn();
      attach(new SR.relay.Link(null, topic('h'), h.id, {}));
    }
    var msg = JSON.stringify({ f: h.id, m: { t: 'hello', token: N.token } });
    h.live().forEach(function (c) { c.publish(topic('h'), msg); });
    return true;
  }

  // Guest: pick the path once we know enough. Called whenever something changes.
  function guestDecide() {
    if (N.role !== 'guest' || N.phase !== 'waiting') return;
    if (N.conn && N.conn.open) return;
    var relayOk = relayLive();
    if (N.relayRoom === true && (N.p2pDown || N.joinT && now() - N.joinT > P2P_WAIT_MS)) {
      if (!(N.conn && N.conn.relay)) { status('Connecting to room ' + N.code + ' through the backup server…'); relayHello(); }
      return;
    }
    if (N.p2pDown === 'notfound' && (N.relayRoom === false || !relayOk && (!N.hub || N.hub.dead()))) {
      abort('Room ' + N.code + ' was not found. Check the code, or ask your friend to create a new room.');
      return;
    }
    if (N.p2pDown && N.relayRoom === false) {
      abort('Room ' + N.code + ' was not found. Check the code, or ask your friend to create a new room.');
      return;
    }
    if (N.p2pDown && (!N.hub || N.hub.dead())) {
      abort('Could not reach the online servers. Check your internet connection and try again.');
    }
  }

  function send(msg) {
    var c = N.conn;
    if (!c || !c.open) return false;
    try { c.send(msg); return true; } catch (e) { return false; }
  }

  function dropConn() {
    var c = N.conn, f = N.fast;
    N.conn = null;
    N.fast = null;
    if (f) { try { f.close(); } catch (e) { /* already closed */ } }
    if (c) { try { c.close(); } catch (e) { /* already closed */ } }
  }

  // Tear everything down. Safe to call more than once.
  function cleanup() {
    Object.keys(N.timers).forEach(clearTimer);
    dropConn();
    if (N.peer) { try { N.peer.destroy(); } catch (e) { /* ignore */ } }
    N.peer = null;
    closeHub();
    N.links = {};
    N.via = null;
    N.role = null;
    N.phase = 'idle';
    N.events = [];
    N.oppName = null;
    SR.cg.leftRoom();
    banner('');
  }

  // Back to the online screen with a message, ending any online match.
  function abort(msg) {
    var wasPlaying = SR.game && SR.game.cfg.online;
    cleanup();
    if (wasPlaying) SR.ui.startDemo();
    openLobby();
    status(msg, 'error');
  }

  // Snapshots go over a second data channel on the same connection that never
  // retransmits or waits for order: a lost update is simply replaced by the next
  // one instead of holding up everything behind it. Both sides create it with
  // the same id, so no extra signalling is needed.
  function openFast(c) {
    try {
      var dc = c.peerConnection.createDataChannel('snap', { negotiated: true, id: FAST_ID, ordered: false, maxRetransmits: 0 });
      dc.onmessage = function (e) {
        if (N.conn !== c) return;
        N.lastRecv = now();
        var msg;
        try { msg = JSON.parse(e.data); } catch (err) { return; }
        if (msg && typeof msg === 'object') onData(msg);
      };
      N.fast = dc;
    } catch (e) { N.fast = null; }
  }

  function attach(c) {
    N.conn = c;
    c.on('open', function () {
      if (N.conn !== c) return;
      N.lastRecv = now();
      N.via = c.relay ? 'relay' : 'p2p';
      if (!c.relay) openFast(c);
      onOpen(c);
    });
    c.on('data', function (msg) {
      if (N.conn !== c || !msg || typeof msg !== 'object') return;
      N.lastRecv = now();
      onData(msg);
    });
    c.on('close', function () { if (N.conn === c) lost(); });
    c.on('error', function () { if (N.conn === c) lost(); });
  }

  function heartbeat() {
    clearTimer('beat');
    N.timers.beat = setInterval(function () {
      if (N.conn && N.conn.open) send({ t: 'ping' });
      if (N.conn && N.conn.open && (N.phase === 'lobby' || N.phase === 'playing') && now() - N.lastRecv > LOST_MS) lost();
      if (N.phase === 'rejoining') {
        var left = Math.max(0, Math.ceil((REJOIN_MS - (now() - N.lostAt)) / 1000));
        if (left <= 0) {
          abort(N.role === 'host' ? 'Your friend did not come back, so the match ended.' : 'Could not reconnect to your friend. The match ended.');
          return;
        }
        banner(N.role === 'host' ? 'Your friend lost connection. Waiting for them to come back… ' + left + 's'
          : 'Connection lost. Reconnecting… ' + left + 's');
      }
      // A peer that lost the signalling server reconnects on its own.
      if (N.peer && !N.peer.destroyed && N.peer.disconnected) { try { N.peer.reconnect(); } catch (e) { /* retry next beat */ } }
    }, PING_MS);
  }

  function onPeerError(err) {
    var type = err && err.type;
    if (type === 'unavailable-id' && N.role === 'host' && N.phase === 'waiting' && N.idTries < 4) {
      // Code already taken: pick another.
      N.idTries++;
      startHostPeer();
      return;
    }
    if (type === 'peer-unavailable') {
      if (N.phase === 'rejoining') return; // keep trying until the window closes
      if (N.role === 'guest') { N.p2pDown = 'notfound'; guestDecide(); return; }
      abort('Room ' + N.code + ' was not found. Check the code, or ask your friend to create a new room.');
      return;
    }
    if (type === 'browser-incompatible') { abort('This browser cannot play online. Try the latest Chrome, Safari, Edge or Firefox.'); return; }
    if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed' || type === 'disconnected') {
      if (N.phase === 'playing' || N.phase === 'rejoining') return; // the heartbeat reconnects
      // The PeerJS server is unreachable: carry on over the relay if it works.
      if (N.role === 'guest') { N.p2pDown = N.p2pDown || 'down'; guestDecide(); return; }
      if (N.role === 'host' && (relayLive() || (N.hub && !N.hub.dead()))) return;
      abort('Could not reach the online servers. Check your internet connection and try again.');
      return;
    }
    if (N.phase === 'playing' || N.phase === 'rejoining') return;
    abort('Connection problem (' + (type || 'unknown') + '). Please try again.');
  }

  // The link to the other player dropped.
  function lost() {
    if (N.phase === 'over' || N.phase === 'idle') return;
    dropConn();
    if (N.role === 'host') {
      if (N.phase === 'lobby' || N.phase === 'waiting') {
        N.phase = 'waiting';
        status('Your friend disconnected. Waiting for them to join again…');
        view('on-room');
        roomInfo(true);
        return;
      }
      if (N.phase === 'playing') {
        N.phase = 'rejoining';
        N.lostAt = now();
        if (SR.game) SR.game.paused = true;
        banner('Your friend lost connection. Waiting for them to come back…');
      }
      return;
    }
    // Guest
    if (N.phase === 'playing') {
      N.phase = 'rejoining';
      N.lostAt = now();
      banner('Connection lost. Reconnecting…');
      tryRejoin();
      return;
    }
    if (N.phase === 'waiting') { N.p2pDown = N.p2pDown || 'blocked'; guestDecide(); return; }
    if (N.phase !== 'rejoining') abort('Lost the connection to the room. Please try joining again.');
  }

  function tryRejoin() {
    clearTimer('rejoin');
    if (N.phase !== 'rejoining') return;
    // Came in through the relay, or the direct path isn't coming back: use the relay.
    if (N.via === 'relay' || now() - N.lostAt > P2P_WAIT_MS) {
      if (!N.hub || N.hub.dead()) startRelayGuest();
      relayHello();
      N.timers.rejoin = setTimeout(tryRejoin, 3000);
      return;
    }
    try {
      if (!N.peer || N.peer.destroyed) {
        N.peer = makePeer();
        N.peer.on('open', function () { connectToHost(true); });
        N.peer.on('error', onPeerError);
      } else if (N.peer.disconnected) {
        N.peer.reconnect();
      } else {
        connectToHost(true);
      }
    } catch (e) { /* try again shortly */ }
    N.timers.rejoin = setTimeout(tryRejoin, 3000);
  }

  // ---- host ----------------------------------------------------------------

  function host(team) {
    cleanup();
    N.role = 'host';
    N.myTeam = team;
    N.token = makeCode() + makeCode();
    N.format = SR.save.data.settings.format || 'standard';
    N.idTries = 0;
    view('on-room');
    $('on-code-big').textContent = '······';
    status('Creating your room…');
    startHostPeer();
    heartbeat();
  }

  function startHostPeer() {
    if (N.peer) { try { N.peer.destroy(); } catch (e) { /* ignore */ } }
    N.code = makeCode();
    N.phase = 'waiting';
    try { N.peer = makePeer(PREFIX + N.code); } catch (e) { N.peer = null; }
    if (!N.peer) { startRelayHost(); if (!N.hub) abort('Online play could not load. Check your connection and reload the page.'); return; }
    N.peer.on('open', roomReady);
    N.peer.on('connection', onHostConnection);
    N.peer.on('error', onPeerError);
    startRelayHost();
  }

  function roomReady() {
    if (N.role !== 'host' || N.phase !== 'waiting' || $('on-code-big').textContent === N.code) return;
    $('on-code-big').textContent = N.code;
    status('Waiting for your friend to join. Send them the code or the invite link.');
    roomInfo(true);
  }

  function playerName(v) { return typeof v === 'string' && v ? v.slice(0, 24) : null; }

  function onHostConnection(c) {
    var meta = c.metadata || {};
    if (N.phase === 'waiting' && playerName(meta.name)) N.oppName = playerName(meta.name);
    var busy = N.conn && N.conn.open;
    var rejoin = N.phase === 'rejoining' && meta.token === N.token;
    if ((busy && !rejoin) || (N.phase !== 'waiting' && !rejoin)) {
      c.on('open', function () { try { c.send({ t: 'full' }); } catch (e) { /* ignore */ } setTimeout(function () { c.close(); }, 400); });
      return;
    }
    dropConn();
    attach(c);
  }

  function onOpen() {
    if (N.role === 'host') {
      if (N.phase === 'rejoining') {
        N.phase = 'playing';
        if (SR.game) SR.game.paused = false;
        banner('');
        send({ t: 'start', resume: true, home: N.myTeam.id, away: N.oppTeam.id, format: N.format });
      } else {
        N.phase = 'lobby';
        status((N.oppName || 'Your friend') + ' is here and is choosing a team…');
        send({ t: 'lobby', team: N.myTeam.id, format: N.format, token: N.token, name: SR.cg.username });
        roomInfo(false);
      }
    } else {
      clearTimer('join');
      if (N.phase === 'rejoining') return; // wait for the host's start message
      status('Connected! Choose your team.');
    }
  }

  function startHostMatch(guestTeam) {
    N.oppTeam = guestTeam;
    N.phase = 'playing';
    N.events = [];
    SR.ui.show(null);
    SR.game = new SR.Game({ home: N.myTeam, away: guestTeam, format: N.format, difficulty: 'normal', human: 'both', online: 'host', onEnd: hostEnd });
    send({ t: 'start', home: N.myTeam.id, away: guestTeam.id, format: N.format });
  }

  function hostEnd(game) {
    var m = game.match;
    N.phase = 'over';
    send({ t: 'end', sets: m.sets, history: m.history, stats: m.stats });
    var hist = m.history.map(function (s) { return [s[0], s[1]]; });
    finishOnline({ me: m.teams[0], opp: m.teams[1], oppName: N.oppName, mySets: m.sets[0], oppSets: m.sets[1], history: hist, stats: m.stats[0] });
  }

  function finishOnline(r) {
    // Leave the link open a moment so the last message gets through.
    var peer = N.peer;
    setTimeout(function () { if (N.peer === peer && N.phase === 'over') cleanup(); }, 1500);
    banner('');
    SR.ui.onlineResult(r);
  }

  // Apply a friend's call to team 1.
  function applyCmd(msg) {
    var g = SR.game, r = g && g.rally;
    if (!r || !g.cfg.online) return;
    var pt = num(msg.x) && num(msg.y) ? { x: msg.x, y: msg.y } : null;
    switch (msg.c) {
      case 'aim': if (pt) r.setAim(pt, 1); break;
      case 'serve': if (pt) r.setAim(pt, 1); r.humanServe(1, num(msg.pw) ? msg.pw : undefined); break;
      case 'hitter': if (num(msg.i) && r.players[1][msg.i]) r.pickHitter(r.players[1][msg.i], 1); break;
      case 'shot': if (typeof msg.id === 'string') r.pickShot(msg.id, 1); break;
      case 'block': if (typeof msg.id === 'string') r.pickBlock(msg.id, 1); break;
      case 'target': if (pt) r.pickTarget(pt, !!msg.tip, 1); break;
    }
  }

  function snapshot(g) {
    var r = g.rally, m = g.match, u = r.uis[1];
    var pi = function (p) { return p ? p.team * 6 + p.idx : -1; };
    var ps = r.all().map(function (p) {
      var cp = p.contactPt;
      return [r2(p.x), r2(p.y), r2(p.z), r2(p.yaw), r2(p.vx), r2(p.vy), r2(p.phase),
        p.act ? p.act.type : 0, p.act ? r3(p.act.t) : 0, p.act ? r3(p.act.dur) : 0,
        r3(p.jumpAt), p.jumpKind || 0, r3(p.contactAt), p.contactKind || 0,
        cp ? [r3(cp.x), r3(cp.y), r3(cp.z)] : 0, p.lock ? 1 : 0, p.shotKind || 0];
    });
    var bn = r.banner;
    var out = {
      t: 's', T: r3(r.t), w: now(), st: r.state, sT: r3(r.stateT), ts: r.timeScale,
      b: [r3(r.ball.x), r3(r.ball.y), r3(r.ball.z)],
      // Current ball flight, so the friend can draw its path and landing spot.
      f: r.flight && r.state === 'rally' ? [r3(r.flight.p0.x), r3(r.flight.p0.y), r3(r.flight.p0.z), r3(r.flight.v.x), r3(r.flight.v.y), r3(r.flight.v.z), r3(r.t - r.flight.t), r3(r.flight.landT)] : 0,
      sv: pi(r.server), se: pi(r.setter), lt: r.lastTouch,
      bn: bn ? [bn.text, bn.sub, bn.color, r3(bn.t), bn.dur] : 0,
      p: ps,
      m: [m.score, m.sets, m.setNo, m.rot, m.server, m.target(), m.history],
      u: [u.prompt, r3(u.aim.x), r3(u.aim.y), r3(u.power), u.hitters.map(function (h) { return h.p.idx; }),
        u.hitterChoice ? u.hitterChoice.idx : -1, u.attackTarget ? [r3(u.attackTarget.x), r3(u.attackTarget.y)] : 0,
        u.tip ? 1 : 0, u.shot, u.blockCall || 'read', (u.blockThreats || []).map(function (p) { return p.idx; })]
    };
    return out;
  }

  // Sounds and effects on the host are queued with the match time, so the
  // friend sees them in step with the action.
  function hookEffects() {
    var fxEmit = SR.fx.emit, play = SR.audio.play;
    SR.fx.emit = function (name, d) {
      fxEmit.call(SR.fx, name, d);
      if (N.role === 'host' && N.phase === 'playing' && SR.game && SR.game.cfg.online) N.events.push([r3(SR.game.rally.t), 'f', name, d || null]);
    };
    SR.audio.play = function (name) {
      play.apply(SR.audio, arguments);
      if (name !== 'click' && N.role === 'host' && N.phase === 'playing' && SR.game && SR.game.cfg.online) N.events.push([r3(SR.game.rally.t), 'a', name]);
    };
  }

  // ---- guest ---------------------------------------------------------------

  function join(code) {
    code = cleanCode(code);
    if (code.length !== 6) { status('Room codes have 6 letters and numbers.', 'error'); return; }
    cleanup();
    N.role = 'guest';
    N.code = code;
    N.phase = 'waiting';
    N.token = null;
    N.p2pDown = false;
    N.joinT = now();
    status('Connecting to room ' + code + '…');
    startRelayGuest();
    try { N.peer = makePeer(); } catch (e) { N.peer = null; N.p2pDown = 'down'; }
    if (N.peer) {
      N.peer.on('open', function () { connectToHost(false); });
      N.peer.on('error', onPeerError);
    }
    // If the direct link isn't up after a few seconds, try the relay.
    N.timers.p2pwait = setTimeout(guestDecide, P2P_WAIT_MS + 50);
    N.timers.join = setTimeout(function () {
      if (N.role === 'guest' && N.phase === 'waiting') abort('Could not connect to room ' + code + '. Make sure your friend\'s room is still open, then try again.');
    }, JOIN_TIMEOUT_MS);
    heartbeat();
  }

  function connectToHost(rejoin) {
    if (!N.peer || N.peer.destroyed) return;
    if (rejoin && N.conn && N.conn.open) return;
    dropConn();
    var c = N.peer.connect(PREFIX + N.code, { reliable: true, serialization: 'json', metadata: { token: rejoin ? N.token : null, v: 1, name: SR.cg.username } });
    if (c) attach(c);
  }

  function onData(msg) {
    if (msg.t === 'ping') return;
    if (msg.t === 'bye') {
      if (N.phase === 'over') return;
      if (N.role === 'host' && N.phase !== 'playing' && N.phase !== 'rejoining') { lost(); return; }
      abort(N.role === 'host' ? 'Your friend left the match.' : 'Your friend closed the room.');
      return;
    }
    if (N.role === 'host') {
      if (msg.t === 'pick' && N.phase === 'lobby') {
        if (playerName(msg.name)) N.oppName = playerName(msg.name);
        var t = SR.teamById(msg.team);
        if (t.id === N.myTeam.id) t = SR.TEAMS.find(function (x) { return x.id !== N.myTeam.id; });
        startHostMatch(t);
      } else if (msg.t === 'cmd' && N.phase === 'playing') applyCmd(msg);
      return;
    }
    // Guest
    if (msg.t === 'full') { abort('That room already has two players.'); return; }
    if (msg.t === 'lobby') {
      N.phase = 'lobby';
      N.token = msg.token;
      N.format = msg.format;
      N.oppTeam = SR.teamById(msg.team);
      N.oppName = playerName(msg.name);
      $('on-teams-title').textContent = (N.oppName || 'Your friend') + ' plays ' + N.oppTeam.name + '. Choose your team';
      roomInfo(false);
      // The host sets the rules; the friend just sees them.
      $('on-rules').innerHTML = '<p class="rules-fixed">Match: <b>' + SR.formatOf(N.format).label + '</b></p>';
      SR.ui.teamCards($('on-team-grid'), N.oppTeam.id, function (t) {
        N.myTeam = t;
        send({ t: 'pick', team: t.id, name: SR.cg.username });
        status('Starting the match…');
      });
      view('on-teams');
      return;
    }
    if (msg.t === 'start') {
      var resume = msg.resume && SR.game && SR.game.cfg.online === 'guest';
      N.phase = 'playing';
      banner('');
      if (resume) { SR.game.rally.reset(); return; }
      N.myTeam = SR.teamById(msg.away);
      N.oppTeam = SR.teamById(msg.home);
      N.format = msg.format;
      SR.ui.show(null);
      SR.game = new GuestGame(N.myTeam, N.oppTeam, N.format);
      return;
    }
    if (msg.t === 's' && SR.game && SR.game.cfg.online === 'guest') { SR.game.rally.push(msg); return; }
    if (msg.t === 'ev' && SR.game && SR.game.cfg.online === 'guest') { SR.game.rally.addEvents(msg.e || []); return; }
    if (msg.t === 'end') {
      N.phase = 'over';
      var hist = (msg.history || []).map(function (s) { return [s[1], s[0]]; });
      var st = (msg.stats && msg.stats[1]) || { aces: 0, kills: 0, blocks: 0, errors: 0 };
      finishOnline({ me: N.myTeam, opp: N.oppTeam, oppName: N.oppName, mySets: msg.sets[1], oppSets: msg.sets[0], history: hist, stats: st });
    }
  }

  // The friend's view of the match: built from the host's snapshots, mirrored
  // so their own team is always the near side (team 0 here).
  function GuestGame(me, opp, format) {
    this.cfg = { human: 0, online: 'guest' };
    this.paused = false;
    this.hover = null;
    this.shift = false;
    var fmt = SR.formatOf(format);
    this.match = {
      teams: [me, opp], score: [0, 0], sets: [0, 0], setNo: 1, rot: [0, 0], server: 0, history: [],
      _tg: fmt.points, target: function () { return this._tg; }
    };
    this.rally = new GuestRally(this.match);
  }

  function GuestRally(match) {
    this.m = match;
    this.loopScale = 1;
    this.timeScale = 1;
    this.t = 0;
    this.state = 'idle';
    this.stateT = 0;
    this.ball = { x: 9, y: 4.5, z: 1 };
    this.flight = null;
    this.banner = null;
    this.server = null;
    this.setter = null;
    this.lastTouch = 0;
    this.ui = { prompt: null, aim: { x: 13.5, y: 4.5 }, power: 0, hitters: [], hitterChoice: null, attackTarget: null, tip: false, shot: 'power', blockThreats: [], blockCall: 'read' };
    this.holds = {};
    this.players = [[], []];
    for (var team = 0; team < 2; team++) {
      for (var i = 0; i < 6; i++) {
        this.players[team].push({ team: team, idx: i, role: SR.ROLES[i], num: SR.NUMBERS[i], x: 0, y: 0, z: 0, yaw: 0, vx: 0, vy: 0, phase: 0, act: null, jumpAt: -9, jumpKind: null, contactAt: 0, contactKind: null, contactPt: null, lock: false });
      }
    }
    this.reset();
  }

  var G = GuestRally.prototype;

  G.reset = function () { this.buf = []; this.ph = null; this.pending = []; this.jit = 0.01; this.lastArr = 0; };
  G.all = function () { return this.players[0].concat(this.players[1]); };

  G.push = function (s) {
    var b = this.buf, last = b[b.length - 1], t = now();
    if (last && s.T < last.T - 1) { this.reset(); b = this.buf; last = null; } // host clock jumped (new match)
    if (last && s.T <= last.T) return; // late or duplicate: a newer one is already here
    // Network jitter estimate: how unevenly snapshots arrive compared with how they were sent.
    if (last && this.lastArr) {
      var j = Math.abs((t - this.lastArr) - (s.w - last.w)) / 1000;
      this.jit += (Math.min(0.3, j) - this.jit) * 0.08;
    }
    this.lastArr = t;
    b.push(s);
    if (b.length > 40) b.shift();
    if (this.ph === null) this.ph = s.T - 0.08;
  };

  G.addEvents = function (list) {
    var pend = this.pending;
    list.forEach(function (e) { pend.push(e); });
  };

  // Guest player for a host player index (team swapped).
  G.byHost = function (hi) {
    if (hi < 0) return null;
    var team = Math.floor(hi / 6), idx = hi % 6;
    return this.players[1 - team][idx];
  };

  G.hold = function (field, value) { this.ui[field] = value; this.holds[field] = now() + 400; };
  G.held = function (field) { return this.holds[field] && this.holds[field] > now(); };

  G.update = function (dt) {
    var b = this.buf;
    if (!b.length) return;
    var newest = b[b.length - 1], ts = newest.ts || 1;
    // Play a little behind the host: just enough to cover jitter (50-200 ms).
    // The playback clock speeds up or slows down slightly to hold that gap, so
    // hiccups never build up into a growing delay.
    // Over the relay, updates come less often and less evenly: keep a bigger cushion.
    var relay = N.via === 'relay';
    var delay = Math.max(relay ? 0.09 : 0.05, Math.min(relay ? 0.3 : 0.2, (relay ? 0.06 : 0.035) + this.jit * 2.5)) * ts;
    var since = Math.min(0.25, (now() - this.lastArr) / 1000) * ts;
    var target = newest.T + since - delay;
    var err = target - this.ph;
    if (Math.abs(err) > 0.35) this.ph = target;
    else this.ph += dt * this.timeScale * (1 + Math.max(-0.3, Math.min(0.3, err * 3)));
    // Never run too far past the newest data.
    var ahead = (relay ? 0.2 : 0.12) * ts;
    if (this.ph > newest.T + ahead) this.ph = newest.T + ahead;
    var i = 0;
    while (i < b.length - 2 && b[i + 1].T <= this.ph) i++;
    var s0 = b[i], s1 = b[Math.min(i + 1, b.length - 1)];
    // Past the newest snapshot we keep moving along the last known motion.
    var k = s1.T > s0.T ? Math.max(0, Math.min(1.6, (this.ph - s0.T) / (s1.T - s0.T))) : 1;
    this.apply(s0, s1, k);
    // Fire effects whose time has come.
    var ph = this.ph, keep = [];
    this.pending.forEach(function (e) {
      if (e[0] > ph + 0.001) { keep.push(e); return; }
      if (e[1] === 'a') SR.audio.play(e[2]);
      else if (e[1] === 'f') SR.fx.emit(e[2], mirrorFx(e[3]));
    });
    this.pending = keep;
  };

  function mirrorFx(d) {
    if (!d) return d;
    var o = {};
    Object.keys(d).forEach(function (k) { o[k] = d[k]; });
    if (d.pos) o.pos = { x: mx(d.pos.x), y: my(d.pos.y), z: d.pos.z };
    return o;
  }

  G.apply = function (s0, s1, k) {
    var self = this;
    this.t = lerp(s0.T, s1.T, k);
    this.state = s0.st;
    this.stateT = lerp(s0.sT, s1.sT, s0.st === s1.st ? k : 0);
    this.timeScale = s0.ts || 1;
    this.ball = { x: mx(lerp(s0.b[0], s1.b[0], k)), y: my(lerp(s0.b[1], s1.b[1], k)), z: Math.max(0.11, lerp(s0.b[2], s1.b[2], k)) };
    var F = s0.f;
    this.flight = F ? { p0: { x: mx(F[0]), y: my(F[1]), z: F[2] }, v: { x: -F[3], y: -F[4], z: F[5] }, t: Math.max(0, this.t - F[6]), landT: F[7] } : null;
    this.server = this.byHost(s0.sv);
    this.setter = this.byHost(s0.se);
    this.lastTouch = 1 - s0.lt;
    this.banner = s0.bn ? { text: s0.bn[0], sub: s0.bn[1], color: s0.bn[2], t: s0.bn[3], dur: s0.bn[4] } : null;
    for (var hi = 0; hi < 12; hi++) {
      var a = s0.p[hi], c = s1.p[hi], p = this.byHost(hi);
      if (!a || !c) continue;
      p.x = mx(lerp(a[0], c[0], k)); p.y = my(lerp(a[1], c[1], k)); p.z = Math.max(0, lerp(a[2], c[2], k));
      p.yaw = lerpAngle(a[3], c[3], k) + Math.PI;
      p.vx = -lerp(a[4], c[4], k); p.vy = -lerp(a[5], c[5], k);
      p.phase = lerp(a[6], c[6], k);
      p.act = a[7] ? { type: a[7], t: a[8], dur: a[9] } : null;
      p.jumpAt = a[10]; p.jumpKind = a[11] || null;
      p.contactAt = a[12]; p.contactKind = a[13] || null;
      p.contactPt = a[14] ? { x: mx(a[14][0]), y: my(a[14][1]), z: a[14][2] } : null;
      p.lock = !!a[15];
      p.shotKind = a[16] || null;
    }
    var M = s0.m, m = this.m;
    m.score = [M[0][1], M[0][0]]; m.sets = [M[1][1], M[1][0]]; m.setNo = M[2]; m.rot = [M[3][1], M[3][0]];
    m.server = 1 - M[4]; m._tg = M[5];
    m.history = (M[6] || []).map(function (h) { return [h[1], h[0]]; });
    var U = s0.u, u = this.ui;
    if (!this.held('prompt')) u.prompt = U[0];
    if (!this.held('aim')) u.aim = { x: mx(U[1]), y: my(U[2]) };
    u.power = Math.max(0, Math.min(1, lerp(U[3], s1.u[3], Math.min(1, k))));
    u.hitters = U[4].map(function (i) { return { p: self.players[0][i] }; });
    if (!this.held('hitterChoice')) u.hitterChoice = U[5] >= 0 ? this.players[0][U[5]] : null;
    if (!this.held('attackTarget')) { u.attackTarget = U[6] ? { x: mx(U[6][0]), y: my(U[6][1]) } : null; u.tip = !!U[7]; }
    if (!this.held('shot')) u.shot = U[8] || 'power';
    if (!this.held('blockCall')) u.blockCall = U[9] || 'read';
    u.blockThreats = (U[10] || []).map(function (i) { return self.players[1][i]; });
  };

  // Input from this player, sent to the host in the host's coordinates.
  G.setAim = function (pt) {
    if (this.ui.prompt !== 'serve') return;
    var a = { x: Math.max(C.NET_X + 0.3, Math.min(C.L + 1, pt.x)), y: Math.max(-1, Math.min(C.W + 1, pt.y)) };
    this.hold('aim', a);
    if (now() - N.lastAim > 60) { N.lastAim = now(); send({ t: 'cmd', c: 'aim', x: mx(a.x), y: my(a.y) }); }
  };
  G.humanServe = function () {
    if (this.ui.prompt !== 'serve') return;
    var a = this.ui.aim;
    send({ t: 'cmd', c: 'serve', x: mx(a.x), y: my(a.y), pw: this.ui.power });
    this.hold('prompt', null); // the meter goes away at once instead of after the round trip
  };
  G.pickHitter = function (p) {
    if (this.ui.prompt !== 'hitter' || !this.ui.hitters.some(function (h) { return h.p === p; })) return;
    this.hold('hitterChoice', p);
    SR.audio.play('click');
    send({ t: 'cmd', c: 'hitter', i: p.idx });
  };
  G.pickHitterIndex = function (i) { var h = this.ui.hitters[i]; if (h) this.pickHitter(h.p); };
  G.pickShot = function (id) {
    if (this.ui.prompt !== 'target' || !SR.SHOTS[id]) return;
    this.hold('shot', id);
    SR.audio.play('click');
    send({ t: 'cmd', c: 'shot', id: id });
  };
  G.pickBlock = function (id) {
    if (this.ui.prompt !== 'block') return;
    this.hold('blockCall', id);
    SR.audio.play('click');
    send({ t: 'cmd', c: 'block', id: id });
  };
  G.pickTarget = function (pt, tip) {
    if (this.ui.prompt !== 'target') return;
    this.hold('attackTarget', { x: pt.x, y: pt.y });
    this.ui.tip = !!tip;
    SR.audio.play('click');
    send({ t: 'cmd', c: 'target', x: mx(pt.x), y: my(pt.y), tip: !!tip });
  };

  // ---- lobby screen --------------------------------------------------------

  function openLobby() {
    if (N.phase === 'idle') { view('on-home'); status(''); }
    SR.ui.show('scr-online');
  }

  function leave() {
    if (N.phase !== 'idle') send({ t: 'bye' });
    var wasPlaying = SR.game && SR.game.cfg.online;
    // Give the goodbye a moment to leave before closing.
    var peer = N.peer, conn = N.conn;
    N.peer = null; N.conn = null;
    cleanup();
    setTimeout(function () {
      if (conn) { try { conn.close(); } catch (e) { /* ignore */ } }
      if (peer) { try { peer.destroy(); } catch (e) { /* ignore */ } }
    }, 300);
    if (wasPlaying) SR.ui.startDemo();
    SR.ui.show('scr-menu');
  }

  N.openLobby = openLobby;
  N.leave = leave;
  N.host = host;
  N.join = join;

  // Called every frame: the host streams snapshots.
  N.tick = function () {
    if (N.role !== 'host' || N.phase !== 'playing') return;
    var g = SR.game;
    if (!g || g.cfg.online !== 'host' || !N.conn || !N.conn.open) return;
    if (N.events.length) { send({ t: 'ev', e: N.events }); N.events = []; }
    if (now() - N.lastSnap < (N.conn.relay ? 50 : SNAP_MS)) return;
    N.lastSnap = now();
    var f = N.fast, msg = snapshot(g);
    if (f && f.readyState === 'open') {
      // Skip a beat rather than queue snapshots behind a slow network.
      if (f.bufferedAmount < 8000) { try { f.send(JSON.stringify(msg)); } catch (e) { /* next one */ } }
      return;
    }
    var dc = N.conn.dataChannel;
    if ((!dc || dc.bufferedAmount < 8000) && !N.conn.bufferSize) send(msg);
  };

  N.init = function (query) {
    hookEffects();
    $('btn-on-create').addEventListener('click', function () {
      SR.audio.play('click');
      $('on-teams-title').textContent = 'Choose your team';
      SR.ui.rulesPicker($('on-rules'));
      SR.ui.teamCards($('on-team-grid'), null, function (t) { host(t); });
      view('on-teams');
      status('');
    });
    $('btn-on-join').addEventListener('click', function () { SR.audio.play('click'); join($('on-code').value); });
    $('on-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') join($('on-code').value); });
    $('on-code').addEventListener('input', function (e) { var v = cleanCode(e.target.value); if (v !== e.target.value) e.target.value = v; });
    $('btn-on-copy').addEventListener('click', function () {
      var link = inviteLink(N.code), btn = $('btn-on-copy');
      var done = function () { btn.textContent = 'Link copied!'; setTimeout(function () { btn.textContent = 'Copy invite link'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { window.prompt('Copy this link', link); });
      else window.prompt('Copy this link', link);
    });
    var share = $('btn-on-share');
    if (navigator.share) {
      share.addEventListener('click', function () {
        navigator.share({ title: 'Spike Rally', text: 'Play volleyball with me! Room code ' + N.code, url: inviteLink(N.code) }).catch(function () { /* cancelled */ });
      });
    } else share.classList.add('hidden');
    $('btn-on-back').addEventListener('click', function () {
      SR.audio.play('click');
      if (N.phase !== 'idle') leave(); else SR.ui.show('scr-menu');
    });
    window.addEventListener('beforeunload', function () { if (N.phase !== 'idle') send({ t: 'bye' }); });
    // A friend clicked Join on CrazyGames while this game was already open.
    SR.cg.onJoinRoom(function (params) {
      var code = cleanCode(params && params.room);
      if (code.length !== 6) return;
      if (SR.game && SR.game.cfg.human !== -1 && !SR.game.cfg.online) SR.ui.startDemo();
      $('on-code').value = code;
      openLobby();
      join(code);
    });
    var room = cleanCode(SR.cg.inviteParam('room') || (query && query.get('room')));
    if (room.length === 6) {
      $('on-code').value = room;
      openLobby();
      join(room);
    } else if (SR.cg.instantMultiplayer) {
      // Started from CrazyGames' multiplayer page: open a room right away
      // with the saved team and rules so friends can join immediately.
      openLobby();
      host(SR.teamById(SR.save.data.settings.team) || SR.TEAMS[0]);
    }
  };
})();
