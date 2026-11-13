# Spike Rally V4 – Google Play guide

V4 is the Android app version of Spike Rally. It is the V1 game with every mode kept (Quick match, Career, League, Tournament, Shop, Daily rewards, Stats, How to play demo) and these parts removed: online play (rooms, invite links, emoji reactions, ping badge), website ads, the CrazyGames button, the home page under the game, website analytics and SEO tags. It plays fully offline and asks for no permissions.

Package name: **buzz.spikerally.game** (cannot be changed after the first upload)
Version: **1.0.0** (version code 1) · Target Android 16 (API 36) · Minimum Android 7 (API 24)

## What is in this folder

| Folder / file | What it is |
|---|---|
| `www/` | The game itself. **Edit the game here.** |
| `android/` | The Android Studio project (Capacitor 8). |
| `capacitor.config.json` | App id, name, full screen, dark background. |
| `package.json` | The tools needed to build (installed with `npm install`). |
| `store/` | Everything for the Play Console: 512 icon, feature graphic, screenshots, privacy policy page. |

## Easiest way: build in the cloud with GitHub (no Android Studio)

The `volley` repository has a GitHub Actions workflow (`.github/workflows/android-v4.yml`) that builds the signed AAB on GitHub's computers. You only use the GitHub website and your normal git push.

**One time:**
1. Put the workflow in place: in File Explorer open `Desktop\volley`, create a folder `.github`, inside it a folder `workflows`, and move `Volleyball V4\cloud-build\android-v4.yml` into it, so it ends up at `volley\.github\workflows\android-v4.yml`.
2. Push: in VS Code (or GitHub Desktop) commit `volleyball/Volleyball V4` and `.github/workflows/android-v4.yml`, then push to `main`.
3. On github.com open the `volley` repository > **Settings > Secrets and variables > Actions > New repository secret**. Add the four secrets listed in `KEY-INFO.txt` (from the signing key files Claude gave you): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. Keep the key files (`spike-rally-upload.jks`, `KEY-INFO.txt`) somewhere safe **outside** the repository. Never commit them.

**Every build:**
1. Open the repository's **Actions** tab > **Build V4 Android (Play Store)** > **Run workflow** (it also runs by itself after each push that changes V4).
2. Wait about 5 minutes for the green tick, open the run, and download **spike-rally-aab** under *Artifacts*. Unzip it: `app-release.aab` is the file for Play Console (go to Part 4).

Parts 1–3 below are only needed if you want to build on your own PC instead.

---

## Part 1 – One-time setup on your PC (about 30 minutes)

1. **Install Node.js** (LTS version) from https://nodejs.org. Keep the default options.
2. **Install Android Studio** (latest stable) from https://developer.android.com/studio. It includes the Java (JDK 21) it needs.
3. Open Android Studio once and let it finish the first-run setup. Then open **More Actions > SDK Manager** and make sure **Android 16 (API 36)** under *SDK Platforms* and **Android SDK Build-Tools 36** under *SDK Tools* are ticked. Click Apply.

## Part 2 – Build and try it on your phone

1. Open the `Volleyball V4` folder in File Explorer, click the address bar, type `cmd` and press Enter. A black window opens in this folder.
2. Type these one at a time and press Enter after each:
   ```
   npm install
   npx cap sync android
   npx cap open android
   ```
   Android Studio opens the project. Wait until the bar at the bottom stops saying "Gradle sync" (the first time takes several minutes; it downloads parts from Google).
3. Try it on your phone: on the phone open **Settings > About phone** and tap **Build number** 7 times, then in **Developer options** turn on **USB debugging**. Plug the phone in with USB, allow the prompt on the phone, pick it at the top of Android Studio and press the green **Run ▶** button.
4. Check: the game opens full screen, the Back button pauses a match, Back on the main menu shows "Press Back again to exit", and the game works with Wi-Fi and mobile data off.

## Part 3 – Make the signed AAB file for Play

1. In Android Studio: **Build > Generate Signed App Bundle or APK…** > choose **Android App Bundle** > Next.
2. Click **Create new…** under *Key store path*:
   - Save it somewhere safe **outside** this folder, for example `C:\Users\pramo\Documents\keys\spike-rally-upload.jks`.
   - Make a password, Alias `upload`, Validity 25 years or more, and your name in *First and Last Name*.
3. Click Next, choose **release**, click **Create**.
4. The file appears at `android\app\release\app-release.aab`. That is the file you upload.

> **Back up the .jks key file and both passwords** (for example on a USB stick and in a password manager). Every future update must be signed with this same upload key. If you lose it, Google can reset it, but it takes days.

Google keeps the real app signing key for you (**Play App Signing**, on by default). Just accept it when Play Console asks.

## Part 4 – Play Console

### 4.1 Create the app
- Go to https://play.google.com/console > **Create app**.
- App name: **Spike Rally: Volleyball** · Default language: English (United States) · **Game** · **Free**. Tick the declarations.

> **Important for new developer accounts:** personal accounts made after 13 November 2023 must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before Google lets you publish to Production. So the first release goes to *Testing > Closed testing*, not Production. Ask 12+ friends for their Gmail addresses (they must use an Android phone), add them as a testers list, and send them the opt-in link. After 14 days, press **Apply for production** on the Dashboard.

### 4.2 App content (Policy > App content)

**Privacy policy** – a public web address is required. The ready page is `store/privacy-policy.html`. Put your contact email in it (replace both `CONTACT-EMAIL`), then put it online, for example as `https://spikerally.buzz/app-privacy`. Paste that address here.

**Ads** – *No, my app does not contain ads.*

**App access** – *All functionality is available without any access restrictions.*

**Content rating** (IARC questionnaire)
- Email: oddoragames@gmail.com. Category: **Game**.
- Violence, blood, fear, sexuality, nudity, bad language, drugs, alcohol, tobacco, gambling, simulated gambling: **No** to all.
- Does the game let users interact or exchange content (chat, online play)? **No**.
- Does it share the user's location with others? **No**.
- Can users buy digital goods? **No**.
- Expected result: Everyone / PEGI 3 / USK 0.

**Target audience and content**
- Choose **13–15, 16–17 and 18 and over**. Do **not** tick ages under 13. Ticking under-13 puts the app under the stricter Families policy and its extra reviews.
- "Could your store listing unintentionally appeal to children?" Answer honestly. The suggested listing text below is written for teens and adults (sports, coaching, leagues), not for young children.

**Data safety**
- Does your app collect or share any of the required user data types? **No**.
  (The game's save stays only on the device. Data that never leaves the device does not count as "collected".)
- Then the form asks nothing more; submit. The listing will show "No data collected" and "No data shared".

**Advertising ID** – *No* (the app does not use it; there is no AD_ID permission).

**Government app** – No. **Financial features** – None. **Health** – No. **News app** – No.

### 4.3 Store listing (Grow > Store presence > Main store listing)

**App name** (max 30): `Spike Rally: Volleyball`

**Short description** (max 80):
`Coach a 6v6 volleyball team: call the serve, set and spike. Plays offline.`

**Full description** (max 4000):
```
Spike Rally is a fast 6v6 volleyball game where you are the coach on the court. Your players run, pass and jump by themselves. You make the four calls that win or lose every rally.

SERVE – aim anywhere on their court and serve while the power bar swings. Hit the seams between two passers.
SET – pick which front-row hitter gets the ball.
SPIKE – choose the exact spot and your hitter smashes it there. Aim away from the block, but not too close to the lines.
BLOCK – stack your blockers left, middle or right, or read the play and react.

GAME MODES
• Career – 21 island courts to win, one after another, each with its own venue.
• League – a five-round season. Finish top of the table to lift the Shield.
• Tournament – knockout bracket from quarter-final to the final for the Cup.
• Quick match – any two teams, 5, 11 or 15 points, 1, 3 or 5 sets.
• Guided demo – learn every call step by step with a real rally.

UNLOCK AND COLLECT
Win matches to earn stars and spend them in the Shop on new balls and courts. Come back every day for daily rewards, new jerseys and a Mega chest on day 7.

MADE FOR PHONES
• Plays fully offline, no account, no sign-in
• No ads and no in-app purchases
• Portrait and landscape, phones and tablets
• Easy, Normal and Hard opponents
• Rally scoring, rotations and sets won by two, like the real sport

Serve, set, spike. Can you win the whole career?
```

**App icon**: `store/icon-512.png` (512 × 512)
**Feature graphic**: `store/feature-graphic-1024x500.png`
**Phone screenshots** (2 to 8): `store/screenshots/phone-landscape/` (1920 × 1080) and/or `store/screenshots/phone-portrait/` (1080 × 1920). Landscape shots are what Google prefers for games.
**7-inch and 10-inch tablet screenshots**: `store/screenshots/tablet-landscape/` (2560 × 1440).
**Category**: Game > **Sports**. Tags: Sports, Volleyball, Casual, Offline, Single player.
**Contact details**: oddoragames@gmail.com (required, shown publicly). Website: `https://spikerally.buzz` (optional).

Store listing rules to keep: no "free", "#1", "best" or "new" in the app name or icon, no fake reviews or rankings in images, screenshots must show the real game (they do).

### 4.4 Upload the release
1. **Testing > Closed testing > Create track** (or use "Alpha") > **Create new release**.
2. Upload `app-release.aab`. Release name: `1.0.0 (1)`. Release notes:
   ```
   <en-US>
   First release of Spike Rally: Career, League, Tournament, Quick match, daily rewards and a guided demo.
   </en-US>
   ```
3. **Countries/regions**: add all, or the ones you want.
4. **Review release > Start rollout**. The first review usually takes a few days.

## Part 5 – Updating the game later
1. Change the game files in `www/` (not in `android/`).
2. In `android/app/build.gradle` raise **versionCode** by 1 (2, 3, 4…) and set **versionName** (for example `1.0.1`). Play refuses an AAB with a version code it has seen before.
3. In the cmd window in this folder: `npx cap sync android`, then in Android Studio make a new signed bundle with the **same key**.
4. Upload it as a new release.

## Notes
- Each year Google raises the required target API level (new apps and updates must target a recent Android version, usually from 31 August). V4 targets API 36 (Android 16), which is current. When Play Console warns about it later, update Capacitor (`npm install @capacitor/core@latest @capacitor/android@latest @capacitor/cli@latest @capacitor/app@latest`, then `npx cap sync android`) and raise `targetSdkVersion` in `android/variables.gradle`.
- Progress saves on the phone and is included in the player's own Android backup, so it comes back on a new phone.
- If you later add ads, online play or analytics, the Data safety form, the Ads answer, the content rating and the privacy policy must all be updated **before** that release.
