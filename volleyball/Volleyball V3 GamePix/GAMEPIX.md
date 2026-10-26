# Spike Rally V3: GamePix build

Upload build for GamePix (my.gamepix.com). Zip the *contents* of this folder
(index.html at the top level of the zip, not inside a "Volleyball V3" folder).
Made from V2; V2 stays the CrazyGames build.

## Differences from V2

- GamePix SDK v3 instead of the CrazyGames SDK. GamePix allows only its own
  SDK (and Xsolla), so the CrazyGames script is gone.
  `window.GamePixConfig = { lifecycle: 'manual' }` and
  `https://integration.gamepix.com/sdk/v3/gamepix.sdk.js` are the first
  scripts in `<head>`, before any game or storage code.
- js/gamepix.js replaces js/crazy.js. The rest of the game calls it through
  `SR.portal` (was `SR.cg`), same functions:
  - `lifecycle.loading(10/50/100)` during boot, then `await lifecycle.loaded()`.
  - `lifecycle.gameStart()` once, when the first real match starts.
  - `events.on('pause'/'resume')`: pauses the match, blocks input, mutes
    sound; resume restores. Both are safe to call repeatedly.
  - `ads.interstitial()` between sets and before the result screen only (never
    during a rally, never on a timer), at most once every 90 s.
  - `ads.reward()` for "Watch a video: +2 stars" in the Shop; stars only when
    `success === true`. 5 minute cooldown as before.
  - `happyMoment('league_title' / 'cup_title')`.
  - `GamePix.lang()` picks the language when it's one the game has
    (de, fr, pt); otherwise browser language, then English.
  - Saves stay in localStorage (GamePix syncs it); key `spikeRally.v1`.
- Sound is muted while the tab is hidden (calls, app switch).
- Removed: Vercel Speed Insights script, online play files (net.js,
  net-config.js, relay.js, vendor/peerjs.min.js), so the build makes no
  external calls besides the GamePix SDK.
- Viewport has `user-scalable=no`; body has `touch-action: none` (menus
  still scroll).
- Page title is just "Spike Rally". No "CrazyGames" text anywhere.
- Opening screen (every launch): "Demo play" starts the guided How to play
  demo (js/demo.js), "Skip" goes to the menu. `?demo=1` / `?demo=watch` jump
  straight into the demo. The demo never calls gameStart, ads or saves.

## Testing locally

Open index.html from `localhost` (e.g. `npx serve`): outside GamePix the SDK
simulates the Player. Useful URL options: `?gpx_ad=nofill`,
`?gpx_reward=cancel`, `?gpx_inspector=1`. Use the my.gamepix.com test kit
before submitting.
