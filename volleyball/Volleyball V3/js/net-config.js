// Online play settings.
//
// server: the address of your Spike Rally online server (the Cloudflare Worker
// in the "Spike Rally Server" folder), without https://, for example
//   server: 'spike-rally-net.yourname.workers.dev'
// It introduces the two players, hands out TURN logins so phones on mobile
// data can still connect directly, and relays the match if they can't.
//
// Left empty, the game falls back to the free public test servers (PeerJS's
// 0.peerjs.com and public MQTT brokers). Those work for testing but are slow
// and sometimes down, so set your own server before uploading to CrazyGames.
window.SR = window.SR || {};
SR.NET_CONFIG = {
  // false hides "Play online" and ignores invites (a single-player release).
  online: true,
  server: '',
  // Used only when server is empty.
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  relays: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ]
};

// With your own server, everything goes through it.
(function (c) {
  if (!c.server) return;
  var host = String(c.server).replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '');
  var local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  var port = host.indexOf(':') > 0 ? +host.split(':')[1] : (local ? 80 : 443);
  c.host = host.split(':')[0];
  c.port = port;
  c.path = '/';
  c.secure = !local;
  c.turn = (local ? 'http://' : 'https://') + host + '/turn';
  c.relays = [(local ? 'ws://' : 'wss://') + host + '/relay/{room}'];
})(SR.NET_CONFIG);
