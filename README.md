# ClipMate kit site (landing page + Razorpay checkout)

Static landing page (`public/`) plus Vercel serverless functions (`api/`). No database.

Flow: buyer pays with Razorpay Checkout, `api/verify` checks Razorpay's signature and returns a signed link to `download.html`, which fetches the guide from `api/guide`. The guide PDF lives in `private/` and is never served as a static file. "Already paid?" (`api/recover`) re-issues a link after Razorpay confirms the payment ID and email.

## Before you deploy
1. Put your support email in `public/index.html` (`SUPPORT_EMAIL`).
2. Build the guide PDF (it is git-ignored on purpose, because the repo is public): open `guide-src/guide.html` in Edge and print to PDF, or run
   `msedge --headless --no-pdf-header-footer --print-to-pdf=private/ClipMate-Guide.pdf guide-src/guide.html`
3. In Razorpay Dashboard, use **test keys** first. Make sure payment auto-capture is on (Settings > Payment Capture), because `api/recover` only accepts captured payments.

## Deploy (Vercel)
```
cd site
npx vercel            # first deploy, creates the project
npx vercel env add RAZORPAY_KEY_ID
npx vercel env add RAZORPAY_KEY_SECRET
npx vercel env add DOWNLOAD_SECRET     # long random string
npx vercel --prod
```
Deploy with the CLI from your machine so `private/ClipMate-Guide.pdf` is uploaded. Do NOT connect the GitHub repo to Vercel, because the PDF is not in git. Optional: `RESEND_API_KEY` and `MAIL_FROM` to email the link automatically. See `.env.example`.

## Test
Use Razorpay test keys and a test card or UPI from Razorpay's docs. After a test payment you should land on `download.html` and get the PDF. Then switch to live keys.

## Notes
- The price is `PRICE_PAISE` (default 14900). The page text says Rs 149, so change both together.
- Anyone with a download link can download the guide. Links don't expire. Don't publish them.
