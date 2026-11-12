# Turning on real AdMob ads in Spike Rally (V4)

The game already has every reward button wired up. Until the AdMob plugin is
installed, a built-in **test ad** (5-second countdown) stands in, so you can try
everything now. When you're ready for real ads:

1. **Create the app and the ad unit in AdMob**
   - AdMob console > Apps > Add app > Android, package `buzz.spikerally.game`.
   - Add one **Rewarded** ad unit. Copy the **App ID** (`ca-app-pub-...~...`) and the
     **ad unit ID** (`ca-app-pub-.../...`).

2. **Install the plugin** (in the `Volleyball V4` folder)
   ```
   npm install @capacitor-community/admob
   npx cap sync android
   ```
   Use the plugin version that supports Capacitor 8 (see the plugin's README).

3. **Add your App ID to Android**: in `android/app/src/main/AndroidManifest.xml`,
   inside `<application>`:
   ```xml
   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
              android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
   ```
   Without this line the app closes on start once the plugin is installed.

4. **Put your ad unit in the game**: in `www/js/ads.js` set
   - `rewardedId:` your rewarded ad unit ID
   - `testing: false` (keep `true` while you test on your own phone)

5. **Update the Play Store listing**
   - App content > Ads: **Yes, my app contains ads**.
   - Data safety: AdMob collects the **device or other IDs** (advertising ID) and
     app interactions, shared for advertising. Answer per Google's AdMob guide.
   - Privacy policy: the in-app policy is updated. Copy the same "Ads" section into
     `store/privacy-policy.html` and the public web page.
   - Optional: publish `app-ads.txt` on your developer website.

Where the ads appear:
- After every match: **Collect** or **2x rewards** (watch an ad, get the diamonds
  and coins again; XP is not doubled).
- After losing a tournament match: **Rematch** (watch an ad, replay that round;
  once per round).
- A reward is only paid when the ad is watched to the end.
