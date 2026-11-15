# Project Guardrails & Architecture: Twitter Auto-Poster Bot AI (@EPFOCompliance)

Automated EPFO compliance advisory, news aggregator, and branded image card generator for X (Twitter) account `@EPFOCompliance`, powered by Google Gemini AI (`gemini-3.5-flash-lite`) and Playwright browser automation on Microsoft Edge. Automatically promotes [Corporate Compliance](https://corporatecompliance.in) calculators and compliance blog articles.

## Quick Reference / Commands

- **Browser-based Auto-Poster with Image (Recommended - $0.00 Free):**
  - Run manually: `npm run post:browser` or `run_browser_bot.bat`
  - Generates high-res (2400x1350) branded infographic card and publishes it simultaneously with the tweet.
  - Uses persistent Microsoft Edge profile in `.twitter_user_data` (bypasses Twitter API 402 credits error).
- **Node.js Bot (Twitter API v2):**
  - Verification: `node -c index.js`
  - Run: `npm start`
- **Schedule Management:**
  - Setup Windows Task Scheduler (09:30 AM & 05:30 PM IST): `setup_scheduled_tasks.bat`

## Architecture & Code Boundaries

1. **`image_generator.js` (Branded Twitter Card Generator)**
   - Automatically renders a high-res (1200x675 @ 2x = 2400x1350) corporate compliance social card.
   - Includes:
     - ⚖️ EPFO Compliance Alert badge + Source & publication date
     - Bold news headline & glowing accent borders
     - Translucent glassmorphism advisory callout box
     - `corporatecompliance.in` branding & direct tool call-to-action pill
   - Uses Playwright headless Chromium / Edge with zero external API dependencies ($0.00 cost).

2. **`epfo_content.js` (Unified Content, SEO Ranker & Resource Mapper)**
   - **30-Day Publication Window:** Scans articles published up to 30 days ago to capture major statutory breakthroughs, circulars, and policy changes.
   - **Google Search Analytics & Impression Scoring:**
     - Computes an impression potential score based on search volume keywords:
       - Passbook / Balance / WhatsApp (+35 pts)
       - PF Withdrawal / Advance / Auto-claim limits (+35 pts)
       - Interest rate credit (8.25%) (+30 pts)
       - EPS-95 Higher pension / Court rulings (+30 pts)
       - Wage ceiling hike to ₹21,000 (+25 pts)
       - EDLI insurance / e-Nomination (+25 pts)
       - Claim rejections / error resolution (+25 pts)
       - SOP / Joint declaration / Date of exit (+20 pts)
       - ECR / VISHWAS / Damages (+20 pts)
     - Penalizes low-impression noise (quizzes, sports, ceremonial events: -30 pts).
     - Tier-1 financial media authority boost (Economic Times, Livemint, CNBC, Moneycontrol, Business Standard, PIB: +15 pts).
     - Recency factor scaled across 30 days (+0 to +10 pts).
   - **Gemini AI SEO & Analytics Editor:**
     - Evaluates the top 5 highest-scoring unposted articles.
     - Picks the single highest-impression story and drafts a compliance insight strictly under 130 characters.
   - **Resource Mapping:** Automatically pairs the topic with the matching tool or blog on `https://corporatecompliance.in`:
     - PF Balance / Interest -> `/tools/pf-calculator`
     - PF Withdrawal / Advance -> `/tools/pf-withdrawal-calculator`
     - EPS Pension / EPS-95 -> `/tools/eps-pension-calculator`
     - EDLI Life Cover / Nomination -> `/tools/edli-calculator`
     - EPF Contribution / Wage Ceiling -> `/tools/epf-contribution-calculator`
     - Gratuity -> `/tools/gratuity-calculator`
     - ECR Errors -> `/blog/epfo-ecr-error-uan-not-member-pension-scheme`
     - VISHWAS Scheme / Disputes -> `/blog/epfo-vishwas-scheme-roi-math-cost-benefit-analysis`
     - Contractor Liability -> `/blog/epfo-vishwas-scheme-unregistered-contractor-principal-employer`
     - PF Overlaps & Exit Dates -> `/blog/epf-overlap-vindictive-employer-bgv-failure-guide`
     - SOPs / Circulars / Wiki -> `/tools/wiki`
     - Fallbacks -> `/tools` or main site
   - Tracks posted articles in `posted_articles.json` with source and publication timestamp.
   - Strictly enforces Twitter character budget (<280 chars, URL = 23 chars).

3. **`browser_poster.js` (Edge Browser Automation with Image Upload)**
   - Automates tweet posting via Playwright using persistent profile `.twitter_user_data`.
   - Uploads and attaches the generated infographic card simultaneously via `input[data-testid="fileInput"]`.
   - Handles hashtag popover dismissals via `Escape`, `Control+Enter` keyboard publishing, and force-click fallback.

4. **`index.js` (API v2 Client with Media Upload)**
   - Uploads image via Twitter v1 media endpoint (`uploadMedia`) and posts with tweet text via v2 API.

5. **Task Scheduling**
   - GitHub Actions (`.github/workflows/twitter.yml`): Twice daily at 09:30 AM & 05:30 PM IST (`0 4,12 * * *`).
   - Windows Task Scheduler: `setup_scheduled_tasks.bat`.

## Critical Quality Rules

- **Zero Secret Leakage:** Never commit `.env`, `.twitter_user_data`, `posted_articles.json`, `generated_tweet_image.png`, or API keys.
- **Strict Character Limits:** Tweets must strictly stay within 280 Twitter characters (any URL = 23 characters).
- **Frequency:** Strictly limited to twice daily.
