// Short-lived TURN credentials for online play (GET /api/turn).
// TURN relays the match when two players' networks (mobile data, strict Wi-Fi)
// can't connect directly. Set ONE of these in Vercel > Project > Settings >
// Environment Variables, then redeploy:
//   Cloudflare (free up to 1,000 GB a month):
//     CF_TURN_KEY_ID      the TURN key ID
//     CF_TURN_API_TOKEN   the key's API token
//   or Metered.ca (free 20 GB a month, ~500 matches):
//     METERED_DOMAIN      e.g. yourapp.metered.live
//     METERED_API_KEY     the app's API key
// With neither set it answers with an empty list and the game uses its
// backup relay as before.
//
// Keeping the keys secret: they are read from the environment here, on the
// server, and are only ever sent to Cloudflare or Metered. The browser gets
// nothing but the TURN addresses and a temporary username/password (copied
// field by field below, so nothing else from the provider's reply slips
// through). Errors are never echoed back or logged. Never put the keys in the
// game's JS files or commit a .env file (.gitignore blocks those).
const ALLOWED = /^(https?:\/\/)?((www\.)?spikerally\.buzz|[a-z0-9-]+\.vercel\.app|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)(\/|$)/i;

async function cloudflare(id, token) {
  const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + encodeURIComponent(id) + '/credentials/generate-ice-servers', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl: 8 * 3600 }) // the TURN password expires after 8 hours
  });
  if (!r.ok) throw new Error('cloudflare ' + r.status);
  const j = await r.json();
  const list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
  // Browsers time out on port 53, which slows the connection down: drop those.
  return list.map(s => {
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter(u => !/:53(\?|$)/.test(u));
    return Object.assign({}, s, { urls });
  }).filter(s => s.urls.length);
}

async function metered(domain, key) {
  // Only ever send the key to a real Metered address.
  if (!/^[a-z0-9-]+\.metered\.live$/i.test(domain)) throw new Error('bad domain');
  const r = await fetch('https://' + domain + '/api/v1/turn/credentials?apiKey=' + encodeURIComponent(key));
  if (!r.ok) throw new Error('metered ' + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

// Only the fields a browser needs to use the TURN server.
function clean(list) {
  return list.filter(s => s && s.urls).map(s => {
    const out = { urls: s.urls };
    if (typeof s.username === 'string') out.username = s.username;
    if (typeof s.credential === 'string') out.credential = s.credential;
    return out;
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method && req.method !== 'GET') { res.status(405).json({ iceServers: [] }); return; }
  const from = req.headers.origin || req.headers.referer || '';
  if (from && !ALLOWED.test(from)) { res.status(403).json({ iceServers: [] }); return; }
  const env = process.env;
  try {
    let iceServers = [];
    if (env.CF_TURN_KEY_ID && env.CF_TURN_API_TOKEN) iceServers = await cloudflare(env.CF_TURN_KEY_ID, env.CF_TURN_API_TOKEN);
    else if (env.METERED_DOMAIN && env.METERED_API_KEY) iceServers = await metered(env.METERED_DOMAIN, env.METERED_API_KEY);
    res.status(200).json({ iceServers: clean(iceServers) });
  } catch (e) {
    res.status(200).json({ iceServers: [] });
  }
};
