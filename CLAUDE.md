# Project Guardrails & Architecture: Twitter Auto-Poster Bot AI (@EPFOCompliance)

Automated EPFO compliance advisory and news aggregator for X (Twitter) account `@EPFOCompliance`, powered by Google Gemini AI (`gemini-3.5-flash-lite`) and Playwright browser automation on Microsoft Edge. Automatically promotes [Corporate Compliance](https://corporatecompliance.in) calculators and compliance blog articles.

## Quick Reference / Commands

- **Browser-based Auto-Poster (Recommended - $0.00 Free):**
  - Run manually: `npm run post:browser` or `run_browser_bot.bat`
  - Uses persistent Microsoft Edge profile in `.twitter_user_data` (avoids Twitter API 402 credits error).
- **Node.js Bot (Twitter API v2):**
  - Verification: `node -c index.js`
  - Run: `npm start`
- **Schedule Management:**
  - Setup Windows Task Scheduler (09:30 AM & 05:30 PM IST): `setup_scheduled_tasks.bat`

## Architecture & Code Boundaries

1. **`epfo_content.js` (Unified Content & Resource Mapper)**
   - Fetches real-time EPFO news via Google News RSS (`https://news.google.com/rss/search?q=EPFO+when:2d`).
   - Tracks posted headlines in `posted_articles.json` to prevent duplicates.
   - Intelligently maps topics/headlines to matching calculators and blog posts on `https://corporatecompliance.in`:
     - PF Withdrawal / Advance -> `/tools/pf-withdrawal-calculator`
     - EPS Pension / EPS-95 -> `/tools/eps-pension-calculator`
     - EDLI Life Cover / Nomination -> `/tools/edli-calculator`
     - EPF Contribution / Wage Ceiling -> `/tools/epf-contribution-calculator`
     - Gratuity -> `/tools/gratuity-calculator`
     - ECR Errors -> `/blog/epfo-ecr-error-uan-not-member-pension-scheme`
     - VISHWAS Scheme / Disputes -> `/blog/epfo-vishwas-scheme-roi-math-cost-benefit-analysis`
     - Contractor Liability -> `/blog/epfo-vishwas-scheme-unregistered-contractor-principal-employer`
     - Dual Employment / Overlap -> `/blog/epf-overlap-vindictive-employer-bgv-failure-guide`
     - SOPs / Circulars / Wiki -> `/tools/wiki`
     - General Fallback -> `/tools` or main site
   - Uses `gemini-3.5-flash-lite` to generate concise advisory insights strictly under 135 characters.
   - Enforces Twitter character budget (calculates 23 characters for URLs).

2. **`browser_poster.js` (Edge Browser Automation)**
   - Automates tweet posting via Playwright using persistent profile `.twitter_user_data`.
   - Handles hashtag popover dismissals via `Escape`, `Control+Enter` keyboard publishing, and force-click fallback.

3. **`index.js` (API v2 Client)**
   - Uses `twitter-api-v2` for posting via API keys (requires Twitter API subscription).

4. **Task Scheduling**
   - GitHub Actions (`.github/workflows/twitter.yml`): Twice daily at 09:30 AM & 05:30 PM IST (`0 4,12 * * *`).
   - Windows Task Scheduler: `setup_scheduled_tasks.bat`.

## Critical Quality Rules

- **Zero Secret Leakage:** Never commit `.env`, `.twitter_user_data`, `posted_articles.json`, or API keys.
- **Strict Character Limits:** Tweets must strictly stay within 280 Twitter characters (any URL = 23 characters).
- **Frequency:** Strictly limited to twice daily.
