# Publishing SizeRight to Google Play and the App Store

Both apps are built in the cloud by GitHub Actions (`.github/workflows/`), so no Mac or Android Studio is needed.

| | Google Play | Apple App Store |
|---|---|---|
| Account cost | $25 once | **$99 every year** |
| You keep per $0.99 sale | ~$0.84 | ~$0.84 (Small Business Program, 15%) |
| Sales to cover the fee | ~30 once | ~118 **every year** |
| Biggest hurdle | New personal accounts need a closed test: 12 testers for 14 days | App review can reject "too simple" apps (guideline 4.2) |

**Set the price to $0.99 from day one.** On Google Play a free app can never be changed to paid later.

---

## Google Play

1. Create a developer account at https://play.google.com/console ($25, ID verification).
2. Set up a **payments profile** (Setup → Payments profile). Paid apps need it.
3. On your computer, back up `F:\clade\sizeright-keys` (USB stick or password manager). This is the **upload key**. If you lose it, Google can reset it, but that takes days.
4. Upload the key to GitHub so the cloud build signs the app. Run this yourself:
   `powershell -ExecutionPolicy Bypass -File tools\upload-secrets.ps1`
5. Re-run the "Android build" workflow on GitHub (Actions tab → Android build → Run workflow). Download the `sizeright-android-N` artifact; the `.aab` inside is what you upload.
6. In Play Console: **Create app** → name "SizeRight: Position Size Calculator", App, **Paid**.
7. **Testing → Closed testing:** create a track, upload the `.aab`, and accept **Play App Signing** (Google keeps the final key; ours is just the upload key). Add at least 12 testers by Gmail address. They must opt in and keep it installed for 14 days. Testers on a paid app can get it free if you add them under License testing.
8. Fill in the **App content** forms:
   - Privacy policy: https://stormrulzz.github.io/sizeright/privacy.html
   - Data safety: no data collected, no data shared
   - Ads: none
   - Content rating questionnaire: utility, no objectionable content
   - Target audience: 18+ (finance)
   - Financial features declaration: "none of the above / calculator only". It doesn't move money or give advice.
9. Store listing: text in README.md, the 512px icon (`icons/icon-512.png`), a 1024×500 feature graphic, and 2–8 phone screenshots.
10. After 14 days: **Apply for production access**, then publish to Production at $0.99.

## Apple App Store

1. Enroll in the Apple Developer Program at https://developer.apple.com/programs/enroll/ as an **Individual** ($99/year; Apple ID with two-factor auth, ID check; usually 1–2 days).
2. In App Store Connect → **Business**: sign the **Paid Apps Agreement** and add tax and bank details. Paid apps can't go on sale without it.
3. Join the **App Store Small Business Program** (15% instead of 30%): https://developer.apple.com/app-store/small-business-program/
4. Create the app: App Store Connect → Apps → **+** → bundle ID `app.sizeright.calc` (register it under Certificates, IDs & Profiles first), name "SizeRight: Position Size Calculator", SKU `sizeright`.
5. Create an **API key** for the cloud build: Users and Access → Integrations → App Store Connect API → Team key, role **App Manager**. Download the `.p8` (only possible once). Note the **Issuer ID** and **Key ID**, and your **Team ID** (Membership page).
6. Give those to Claude. Signing and the TestFlight upload then get added to `ios.yml`, so every push sends a build to App Store Connect.
7. Fill in the listing:
   - Price: $0.99 tier
   - App Privacy: **Data Not Collected**
   - Privacy policy URL: https://stormrulzz.github.io/sizeright/privacy.html
   - Category: Finance. Age rating: 4+
   - Screenshots: **6.9" iPhone** (1320×2868), 3–10 of them. The app is iPhone-only, so no iPad shots are needed.
   - Review notes: "Offline calculator. Fully functional without login. No network use."
8. Submit for review (typically 1–3 days).

### Reducing App Review risk (guideline 4.2, minimum functionality)
Apple rejects apps that feel like a website in a frame. Already done: all files ship inside the app (works in airplane mode), native haptics, native share sheet, per-asset memory of inputs, no browser chrome. If they still reject, the usual fix is one more native feature, e.g. saved trade presets or a home-screen widget.
