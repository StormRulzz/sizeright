# SizeRight: Position Size Calculator

A $0.99 Android app (offline PWA wrapped as a Trusted Web Activity). It tells you how many shares, coins, units or contracts to buy so a stop-out loses exactly what you planned, with fees included.

- Stocks, crypto (fractional quantity step), forex (micro lots), futures (ES, MES, NQ, MNQ, YM, RTY, CL, MCL, GC, MGC or custom point value)
- Risk as % of account or fixed $
- Long or short is detected from where the stop sits
- Loss at stop, position value, leverage, fee-adjusted breakeven, R:R, win rate needed to break even, 1R/2R/3R take-profit ladder
- Rounds size **down** so real risk never exceeds the budget
- Remembers inputs on the device. No ads, no account, no tracking

## Run locally

```
python -m http.server 8795 --directory F:\clade\sizeright
```

Then open http://localhost:8795. Tests: `node --test test/calc.test.js`. Icons: `python tools/make_icons.py`.

## Ship to Google Play

1. **Host it (free).** Push this folder to a GitHub repo and turn on GitHub Pages, or drag it into Cloudflare Pages. You get an HTTPS URL such as `https://<you>.github.io/sizeright/`.
2. **Package it.** Go to https://www.pwabuilder.com, paste the URL and choose **Package for stores → Android**. Set the package ID to something like `app.sizeright.calc`. It downloads a zip with a signed `.aab`, a signing key and `assetlinks.json`. **Back up the signing key.** Without it you can never update the app.
3. **Link the domain.** Put the generated `assetlinks.json` at `/.well-known/assetlinks.json` on your site. Without it, Android shows a browser address bar inside the app. On GitHub Pages this has to be a user or org site (repo `<you>.github.io`), or a custom domain, because `.well-known` must be at the domain root.
4. **Play Console.** Register at https://play.google.com/console (one-time $25), set up a payments profile, create the app as **Paid, $0.99**, and upload the `.aab`.
   - New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production access is granted.
   - Privacy policy URL: `<your site>/privacy.html`
   - Data safety form: no data collected, no data shared
   - Category: Finance. Content rating: Everyone. Add the "not financial advice" note in the description.

### Store listing draft

**Title:** SizeRight: Position Size Calculator

**Short description:** Know your exact position size and risk before every trade. No ads, works offline.

**Full description:**
Stop guessing how big to go. Enter your account size, risk and stop, and SizeRight tells you exactly how many shares, coins, lots or contracts to trade, with fees included.

• Stocks, crypto, forex and futures (ES, MES, NQ, MNQ, CL, GC and more)
• Risk by % of account or a fixed dollar amount
• Long and short detected automatically
• Fee-adjusted breakeven and loss at stop
• Reward:risk and the win rate you need to break even
• 1R / 2R / 3R take-profit ladder
• Always rounds down, so you never risk more than you planned

One-time purchase. No ads, no subscriptions, no account, no tracking. Works fully offline.

SizeRight is a calculator, not financial advice.

**Screenshots needed:** 2–8 phone screenshots (1080×1920 works). Take them from the running app at mobile width.
