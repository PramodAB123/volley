# Spike Rally V2: CrazyGames build

This folder is the CrazyGames upload build. Zip the *contents* of this folder
(index.html at the top level of the zip) and upload it in the CrazyGames
developer portal. It is not set up for Vercel: no vercel.json, no Vercel
analytics, no SEO tags, sitemap, robots.txt or web manifest.

## What the SDK does here (js/crazy.js)

- Loads `https://sdk.crazygames.com/crazygames-sdk-v3.js` in `<head>` and calls
  `SDK.init()` before the game boots (5 s timeout, so the game never hangs).
- `loadingStart` / `loadingStop` around boot.
- `gameplayStart` / `gameplayStop` whenever a real match is running or not
  (menus, pause, result screen and ads stop it; the demo match behind the menu
  does not count).
- Midgame ads at natural breaks: between sets and at the end of a match, before
  the result screen. Not during play, not on menu buttons, never online between
  sets. The SDK spaces them (about 3 minutes) and the game just carries on when
  no ad plays.
- Rewarded ad in the Shop: "Watch a video: +2 stars", with a video icon, once
  every 5 minutes. Stars are only given when the ad finishes. Hidden during
  Basic Launch (ads disabled) and replaced by a note when an ad blocker is on.
- During an ad the game is paused, input is blocked, and sound is muted from
  `adStarted` until `adFinished` / `adError`.
- `settings.muteAudio` is honoured and overrides the in-game sound toggle.
- Progress is saved with the SDK data module (follows the CrazyGames account);
  existing localStorage saves are copied over once. Reloads on sign-in.
- `happytime()` on winning a league title or a tournament.
- Online: invite links from `SDK.game.inviteLink`, `?room=` read with
  `getInviteParam`, `updateRoom` / `leftRoom` so CrazyGames' Join and Invite
  buttons work, a join-room listener, and Instant Multiplayer opens a room
  straight away. CrazyGames usernames are shown to the other player.
- First-time players land straight in a quick match.
- Languages: English, Spanish, Portuguese, French, German, Turkish (js/i18n.js).
  Picked from Settings > Language, else the CrazyGames locale, else the
  browser language, else English. Test with `?lang=de` etc. The online lobby
  screens are still English only (online is switched off for launch).

Outside CrazyGames (other domains) the SDK reports `disabled` and every call is
skipped, so the game still runs normally.

## Release status

Single-player first: `online: false` in js/net-config.js, so "Play online" is
hidden and invites are ignored. Submit as a single-player game (no lobby
size). Flip it to `true` in a later update once a reliable relay is in place.

## On submission

- Tick the **Data module** option, or cloud saves are disabled.
- Online play uses PeerJS (0.peerjs.com), Cloudflare STUN (Google STUN removed)
  and free public MQTT test brokers as a backup relay; declare it as
  multiplayer and give the lobby size (2). To ship single-player first, set
  `online: false` in js/net-config.js (hides Play online, ignores invites).
- Test in the CrazyGames Preview tool, or on localhost (the SDK shows fake ads
  there; add `?useLocalSdk=true` on other hosts).

## Not done yet

- Rematch in the same room after an online match (CrazyGames "rooms across
  rounds" for Full Launch). Today both players go back to the menu.
