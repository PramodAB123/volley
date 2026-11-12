// Online play settings (Android app, 2026-11-12).
// No Cloudflare and no server of our own: the free public PeerJS server
// (0.peerjs.com) only introduces the two phones, then the match data flows
// directly between them (WebRTC, found with Google's public STUN servers).
// When a network blocks direct links, the same messages go through free
// public MQTT brokers instead ("backup server"). No TURN relay is used.
window.SR = window.SR || {};
SR.NET_CONFIG = {
  // Empty host = the public PeerJS server.
  host: '',
  port: 443,
  path: '/',
  secure: true,
  // No TURN servers (no Cloudflare).
  turn: '',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  // Backup servers (free public MQTT brokers over secure WebSockets).
  relays: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ],
  // In the app a friend joins by typing the code (no web invite link).
  codeOnly: true,
  // Coin stakes a host can choose (0 = friendly match, no coins).
  stakes: [0, 50, 100, 250, 500, 1000]
};
// Test builds can point at local servers (never set in the release).
(function () {
  var t = window.SR_NET_TEST;
  if (t && typeof t === 'object') for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) SR.NET_CONFIG[k] = t[k];
})();
