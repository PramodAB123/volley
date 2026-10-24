// Online play settings. The defaults work without any account: PeerJS's free
// public server introduces the two players, then the game data flows directly
// between their browsers.
//
// Some mobile and office networks block direct connections; the game then
// switches to the backup relays listed below on its own. For the smoothest
// play on those networks the game also asks the site's /api/turn for TURN
// servers (set up in api/turn.js). A fixed TURN server can instead be pasted
// into iceServers below, like:
//   { urls: 'turn:YOUR-HOST:443', username: 'USER', credential: 'PASS' }
window.SR = window.SR || {};
SR.NET_CONFIG = {
  // Leave host empty to use the public PeerJS server (0.peerjs.com).
  host: '',
  port: 443,
  path: '/',
  secure: true,
  // Where to fetch TURN servers (api/turn.js at the repo root). It needs a free
  // Cloudflare or Metered TURN key set in Vercel; see the notes in that file.
  turn: '/api/turn',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  // Backup relay servers (free public MQTT brokers over secure WebSockets).
  // Used automatically when the two players can't connect directly.
  relays: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ]
};
