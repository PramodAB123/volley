// Online play settings. The defaults work without any account: PeerJS's free
// public server introduces the two players, then the game data flows directly
// between their browsers.
//
// Some mobile and office networks block direct connections; the game then
// switches to the backup relays listed below on its own. For the smoothest
// play on those networks you can also add a free TURN server (for example at metered.ca, Open Relay
// free plan) and paste its details into iceServers below, like:
//   { urls: 'turn:YOUR-HOST:443', username: 'USER', credential: 'PASS' }
window.SR = window.SR || {};
SR.NET_CONFIG = {
  // false hides "Play online" and ignores invites (a single-player release).
  online: false,
  // Leave host empty to use the public PeerJS server (0.peerjs.com).
  host: '',
  port: 443,
  path: '/',
  secure: true,
  // No Google servers: some game portals (Poki) block them.
  iceServers: [
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
