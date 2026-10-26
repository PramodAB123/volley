# Spike Rally V3: CrazyGames build with online play with friends

This folder is the CrazyGames upload build. Zip the *contents* of this folder
(index.html at the top level of the zip) and upload it in the CrazyGames
developer portal. It is not set up for Vercel: no vercel.json, no Vercel
analytics, no SEO tags, sitemap, robots.txt or web manifest.

## What the SDK does here (js/crazy.js)

- Loads `https://sdk.crazygames.com/crazygames-sdk-v3.js` in `<head>` and calls
  `SDK.init()` before the game boots (5 s timeout, so the game never hangs).
- `loadingStart` / `loadingStop` around boot.
- `gameplayStart` / `gameplayStop` whenever a real match is running or not
  (menus, pause, result screen and ads stop it).
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
- The game opens on the main menu (no auto-start); players pick teams and match length themselves.
- Menus show the CrazyGames portrait cover (img/menu-bg.jpg, 75 KB) instead of a match running behind them.
- Languages: English, Spanish, Portuguese, French, German, Turkish (js/i18n.js).
  Picked from Settings > Language, else the CrazyGames locale, else the
  browser language, else English. Test with `?lang=de` etc. The online lobby
  screens are still English only.

Outside CrazyGames (other domains) the SDK reports `disabled` and every call is
skipped, so the game still runs normally.

## Online with friends (V3)

V3 is V2 (single player, How to play demo, translations) plus online play
with a friend, following the CrazyGames multiplayer requirements:

- **Your own server.** Online play goes through the Spike Rally online server
  (the Cloudflare Worker in `Spike Rally Server/`, see its README). Set its
  address in `js/net-config.js` (`server: '...workers.dev'`). With `server`
  empty the game falls back to the free public test servers, which are slow
  and unreliable: fine for a quick test, not for release.
- **Rooms on CrazyGames.** `updateRoom({ roomId, isJoinable, inviteParams: { room } })`
  when a room opens (joinable), when a friend joins (not joinable), and again
  if they drop out of the lobby; `leftRoom()` when the room closes. So the
  CrazyGames Join and Invite buttons and friend notifications work.
- **Invite links** come from `SDK.game.inviteLink({ room })` ("Copy invite
  link", and Share on phones). A friend opening one lands straight in the room
  (`getInviteParam('room')`), and the join-room listener handles a Join click
  while the game is already open (no reload; any match or demo is stopped).
- **Instant Multiplayer**: when `isInstantMultiplayer` is true the game opens a
  private room at once with the player's saved team and match length, joinable
  immediately.
- **Usernames**: CrazyGames usernames are shown in the room, in the lobby
  ("Ghanu plays ..."), on the scoreboard during the match, and on the result.
- **Rematch in the same room**: after a match both players see Rematch and
  Leave room. When both press Rematch a new match starts with the same teams;
  if one leaves, the other is told.
- **Emoji reactions** during online matches (4 fixed emojis, no free text).
  Hidden when CrazyGames' `disableChat` setting is on.
- **Ads**: no ads during an online match or between its sets; a midgame ad
  may play at the end of a match, before the result screen. gameplayStart /
  gameplayStop follow the online match too.
- Joining needs no onboarding: a friend picks a team and the match starts.
- Connection: direct WebRTC with Cloudflare TURN, backup relay through the
  server, 30-second rejoin window if a phone drops out, and a ping badge.

Online lobby messages (connecting, room not found, etc.) are still English;
the new rematch strings are translated.

## On submission (online update)

- Upload: zip the *contents* of this folder (index.html at the top level).
- Set `server` in js/net-config.js first (see Spike Rally Server/README.md).
- Declare it as multiplayer with **Online with friends**, lobby size **2**
  (min 2, max 2). Keep the single-player modes described too.
- Tick the **Data module** option (cloud saves).
- Covers: the landscape cover that says "Play a friend online" is in
  `promo/crazygames/cover-landscape-online-1920x1080.png`.
- Tags: Sports, Volleyball, Multiplayer, 2 Player, Strategy, Casual.
- Test in the CrazyGames Preview tool with two browsers (or one normal window
  and one private window): Create a room, send the invite link, join, play,
  then Rematch.

## Release status

V2 (single player) is the build under review. Upload V3 as an update of the
same Spike Rally game once V2 is through review (or swap the pending build),
not as a separate game.
