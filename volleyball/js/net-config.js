// Online play settings. The defaults work without any account: PeerJS's free
// public server introduces the two players, then the game data flows directly
// between their browsers.
//
// Some mobile and office networks block direct connections. To make those
// work too, create a free TURN server (for example at metered.ca, Open Relay
// free plan) and paste its details into iceServers below, like:
//   { urls: 'turn:YOUR-HOST:443', username: 'USER', credential: 'PASS' }
window.SR = window.SR || {};
SR.NET_CONFIG = {
  // Leave host empty to use the public PeerJS server (0.peerjs.com).
  host: '',
  port: 443,
  path: '/',
  secure: true,
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};
