# Spike Rally V4: Play Store testing launch checklist (12 November 2026)

## Checked by Claude (all passed)

- App: buzz.spikerally.game, version **1.1.0 (versionCode 3)**. It was 1.0.1 (code 2). The bump makes sure Play accepts the new upload, even if code 2 was already sent.
- Android: minSdk 24 (Android 7), target and compile SDK 36 (meets Google Play's current target rule). Portrait only. Release signing comes from the cloud-build secrets.
- Permissions: only INTERNET, plus ACCESS_NETWORK_STATE and AD_ID from AdMob. None of them shows a pop-up to the player.
- AdMob: the real App ID is in the manifest, and the real rewarded, banner and interstitial units are in ads.js. Test mode is off.
- Plugins installed by the cloud build (`npm ci` + `npx cap sync`): App, AdMob 8.2.1, Share 8.0.3 (new).
- Game tests on a phone-sized browser with the Android bridge mocked:
  - Career, League, Tournament, Quick match and Daily Challenge: 3 matches each to the result screen.
  - The save comes back the same after a reload.
  - Broken saves load safely.
  - 90 s of random tapping, Back presses and background/resume: no JS errors and no freezes.
  - Every script parses as ES5, so it runs on old Android WebViews.
- Online 1 v 1 on two phones, against local stand-in servers:
  - a stake match pays the winner both stakes;
  - a player who leaves loses the stake;
  - "not enough coins" is refused;
  - the backup server works when the direct link is blocked.
- Privacy policy and terms (in the app and `store/privacy-policy.html`, copied to `Volleyball V1/app-privacy.html`) cover online play, ads and coins.

## Not checkable from here (please do these)

1. **Build:** push the repo. Then check that the "Build V4 Android (Play Store)" run is green and download `spike-rally-aab` and `spike-rally-apk`.
2. **Real phone test with the APK.** First add your phone as an AdMob test device (AdMob > Settings > Test devices). Never tap your own live ads. Then check:
   - the app opens with the Oddora loader;
   - Back works on every screen;
   - a reward ad shows a test ad;
   - Multiplayer on two phones (one on Wi-Fi, one on mobile data): create a room, Share the code to WhatsApp, join, play to the end, and check the coins.
3. **Website:** deploy V1 so that these open in a browser:
   - https://spikerally.buzz/app-privacy.html
   - https://spikerally.buzz/app-ads.txt
4. **AdMob:** Privacy & messaging > European regulations > create and publish the consent message.

## Play Console answers (App content)

- **Privacy policy URL:** https://spikerally.buzz/app-privacy.html
- **Developer contact email (shown on the store page):** oddoragames@gmail.com
- **Ads:** Yes, the app contains ads.
- **App access:** All functionality is available without special access.
- **Target audience:** 13 and over only. Not designed for children, so don't opt into Families.
- **Content rating (IARC):**
  - Violence, fear, sex, language, drugs: No.
  - Gambling with real money: No. Simulated gambling: No. Coin stakes are on the result of a skill match between two friends, with game coins that can't be bought or cashed out.
  - **Users can interact: Yes.** Online play with invited friends; only 4 preset emoji reactions, no chat.
  - Shares location: No. Digital purchases: No.
- **Data safety:**
  - Collected: Yes. Shared: Yes. Encrypted in transit: Yes. Users can't ask for deletion from us; we store no data.
  - Device or other IDs (advertising ID): collected and shared with Google AdMob, for Advertising and Fraud prevention.
  - Approximate location (from the IP address, by AdMob): Advertising.
  - App interactions: collected by AdMob for Analytics and Advertising. In Multiplayer, game moves go to the other player and are processed ephemerally.
  - Personal info > Name (player name): sent to the friend during a match, processed ephemerally, App functionality, optional.
  - Diagnostics (AdMob): Analytics.
- **Advertising ID declaration:** Yes, Advertising.
- **Government apps, financial features, health, news:** No.

## Store listing (updated text)

**Short description** (80 max):
Coach a 6v6 volleyball team. Play Career offline or a friend online, 1 v 1.

**Full description:**
Spike Rally is a fast 6v6 volleyball game where you coach the whole team: call the serve, pick the setter's target and aim every spike.

• Career: conquer 21 islands, one court at a time
• League and Tournament: 5 leagues and 6 cups with their own trophies
• Multiplayer: play a friend 1 v 1 on two phones with a room code, and put coins on the match if you dare
• Daily Challenge and daily rewards
• Shop: balls, courts, jerseys, skills and special smashes
• Build and upgrade your own custom team
• Short tutorial, quick to learn, hard to master
• Career, League and Tournament also play offline. No account needed.

Contains ads (optional reward videos double your rewards). Coins and diamonds are earned by playing; there are no in-app purchases.

**Tags:** Sports, Volleyball, Casual, Multiplayer.

**Screenshots:** use the new portrait set in `store/screenshots-portrait-2026-11-12` (8 images, 1080x2160). The old landscape and tablet sets show the old game, so delete them from the listing. The app is portrait only, so tablet screenshots are optional.

## Closed testing (new personal developer accounts)

Google requires a closed test with **at least 12 testers opted in for 14 days in a row** before you can apply for production.

1. Testing > Closed testing > Create track.
2. Upload the AAB.
3. Add the testers' Gmail addresses (an email list or a Google Group).
4. Send them the opt-in link.

Keep 12 or more opted in for the full 14 days, then use "Apply for production". Internal testing (up to 100 people, no review wait) is a good first step, to check the build on your own phones.
