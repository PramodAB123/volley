# Real AdMob ads in Spike Rally (V4)

## Already done in the game (12 November 2026)

- AdMob plugin `@capacitor-community/admob` 8.2.1 added to `package.json` and
  `package-lock.json`. The cloud build installs it by itself (`npm ci` + `npx cap sync`).
- App ID `ca-app-pub-1426010855335025~7211404354` is in
  `android/app/src/main/AndroidManifest.xml`.
- Rewarded ad unit `ca-app-pub-1426010855335025/7295678184` is in `www/js/ads.js`,
  with test mode off.
- The 5-second stand-in "test ad" is removed. If no ad can load (offline, or AdMob
  has none yet), the player sees "No ad available right now" and keeps the normal
  reward. In a desktop browser the ad buttons are hidden.
- EU/UK consent: the app shows Google's consent form when the law requires it,
  and Settings gets an "Ad privacy choices" row for those players.
- The privacy policy (in the app and `store/privacy-policy.html`) has an Ads section.
- `Volleyball V1/app-ads.txt` is ready for the website.
- Banner: an adaptive banner (unit `ca-app-pub-1426010855335025/9583910110`, "Result banner") shows at the bottom of the result screen only. It is removed during matches, on other screens and while a reward video plays, and the screen keeps its space free.
- Interstitial: a full-screen ad (unit `ca-app-pub-1426010855335025/8764818313`) after every 3rd finished match. It plays when the player taps Play again / Continue / Menu on the result screen, never during a match, at most once a minute, and not right after a reward video.

## Your steps

1. **Build:** push the V4 folder to GitHub as usual. The workflow builds the new
   AAB and APK.
2. **Never tap your own real ads.** To test on your phone safely, go to
   AdMob > Settings > Test devices > Add test device, pick Android, and enter
   your phone's advertising ID (phone Settings > Google > Ads). Your phone then
   gets test ads even from the real ad unit.
3. **Consent message:** AdMob > Privacy & messaging > European regulations >
   Create message. Pick the Spike Rally app, add your privacy policy URL, then
   Publish. Without it, players in Europe may get no ads.
4. **Website:** upload `app-ads.txt` with the V1 site so it opens at
   https://spikerally.buzz/app-ads.txt. In Play Console, use spikerally.buzz as
   the developer website.
5. **Play Console** (App content):
   - Ads: **Yes, my app contains ads**.
   - Data safety: data is collected and shared: **Device or other IDs**
     (advertising ID), **App interactions**, **Approximate location**
     (from the IP address), **Diagnostics**. The purposes are Advertising or
     marketing, Analytics and Fraud prevention. The data is encrypted in transit,
     and users can't ask for it to be deleted from the game itself.
   - Advertising ID declaration: **Yes**, used for Advertising.
   - Privacy policy URL: put the updated `store/privacy-policy.html` online.
6. **After launch:** in AdMob, open Apps > Spike Rally > App settings and link
   it to the Play Store listing (buzz.spikerally.game). AdMob reviews the app,
   and then real ads start.

Where ads appear:
- After every match: **Collect** or **2x rewards** (diamonds and coins again; XP
  is not doubled).
- After losing a tournament match: **Rematch** (replay that round, once per round).
- A reward is only paid when the ad is watched to the end.
