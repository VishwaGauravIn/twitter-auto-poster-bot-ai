# 🤖 EPFO Twitter / X Auto-Poster Bot (@EPFOCompliance)

> An autonomous, AI-powered compliance news aggregator and 3-part Twitter thread publisher dedicated to **[@EPFOCompliance](https://x.com/EPFOCompliance)** and promoting **[corporatecompliance.in](https://corporatecompliance.in)**.

[![Playwright](https://img.shields.io/badge/Browser_Automation-Playwright_Edge-0078D7?logo=microsoftedge)](https://playwright.dev/)
[![Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Schedule](https://img.shields.io/badge/Schedule-Twice_Daily_(9:30_AM_&_6:00_PM_IST)-10B981)](#-resilient-daily-schedule--watchdog)
[![Target Account](https://img.shields.io/badge/Twitter%20%2F%20X-@EPFOCompliance-1DA1F2?logo=x)](https://x.com/EPFOCompliance)
[![Website](https://img.shields.io/badge/Promoting-corporatecompliance.in-F59E0B)](https://corporatecompliance.in)

---

## 🌟 Key Capabilities

### 1. 🏛️ Strict Hierarchical Source Prioritization
News stories published within the past **30 days** are evaluated and selected using a strict 3-tier hierarchy:
- **Tier 0 (Official Verified Sources — Checked FIRST)**:
  - **PIB (Press Information Bureau)**: Direct releases from `pib.gov.in` and Ministry of Labour & Employment.
  - **Gazette Notifications & Circulars**: Official statutory orders from `egazette.gov.in` and `epfindia.gov.in`.
  - **Official EPFO Twitter**: Announcements originating from `@officialepfo` or `@socialepfo`.
- **Tier 1 (Mainstream Business Media — Checked SECOND)**:
  - *The Economic Times, Livemint, Business Standard, Financial Express, CNBC-TV18, Times of India, NDTV Profit, Moneycontrol*.
- **Tier 2 (Reference Blogs & Online Portals — Fallback)**.

Whenever unposted stories exist in Tier 0, the bot **strictly prioritizes official announcements**, badging the card with `🏛️ Press Information Bureau (PIB)` or `📜 Official Gazette Notification` and prefixing Tweet 1 with `[Official PIB Alert]`.

---

### 2. 🔄 Real-Time Website Synchronizer ([corporate_catalog.js](corporate_catalog.js))
- Automatically crawls `https://corporatecompliance.in/sitemap.xml` on every run (sub-second execution).
- Tracks **179+ live URLs** across 89 blogs, 12 calculators, 44 statutory wikis, and error resolution guides.
- **Auto-Discovery of New Blogs**: Whenever you publish a new article on your website, the bot detects it immediately, extracts its `<title>`, `<meta name="description">`, and keywords from the slug, and makes it available for immediate Twitter promotion.

---

### 3. 🎨 High-Res Branded Infographic Cards ([image_generator.js](image_generator.js))
- Renders **2400×1350 (2x Retina 16:9)** high-contrast Twitter cards locally via Playwright.
- **Zero Cost ($0.00)**: No paid image APIs or rate limits.
- Features ambient radiant glow, glassmorphism advisory boxes, gold accents, official authority badges, and direct call-to-action buttons for `corporatecompliance.in`.

---

### 4. 🧵 Native 3-Part Twitter Thread Architecture
Every post is published atomically as an official 3-part thread:
1. **Tweet 1 (Hook & Alert + Card)**: News headline summary with high-res card attached (`Thread 👇 (1/3)`).
2. **Tweet 2 (Step-by-Step Actionable Solution)**: Practical how-to instructions with exact phone numbers (e.g. official WhatsApp bot `+91 8796441800`), required forms, and deadlines (`(2/3)`).
3. **Tweet 3 (Caveat & Direct Blog Link)**: Fraud warnings, statutory limits + direct link to the specific blog article or calculator on `corporatecompliance.in` (`#EPFO #PFCompliance (3/3)`).

---

### 5. ⏰ Resilient Daily Schedule & Internet Watchdog ([daily_runner.js](daily_runner.js))
The bot is scheduled for the **two peak activity windows** on Indian Twitter:
- **Morning Peak**: `09:30 AM IST` (Active window: 09:00 AM – 02:00 PM IST)
- **Evening Peak**: `06:00 PM IST` (Active window: 05:30 PM – 11:59 PM IST)

#### 🛡️ Built-in Watchdog Features:
- **Active Internet Polling**: If your laptop has no Wi-Fi/internet at the scheduled time, the bot does not crash. It waits politely in the background (polling every 15s) and immediately executes once internet connects!
- **Automatic Missed-Run Catchup**: If your laptop was closed, asleep, or powered off during the scheduled time, Windows Task Scheduler automatically runs the task as soon as the laptop turns on (`StartWhenAvailable = True`).
- **Logon / Wakeup Trigger**: Checks on boot/login if today's morning or evening post is pending and completes it automatically.
- **Duplicate Prevention**: Tracks `daily_posting_status.json` so exactly 2 threads are posted per calendar day.

---

## 📂 Project Structure

```text
twitter-auto-poster-bot-ai/
├── daily_runner.js             # Dual-slot supervisor with internet polling & catchup
├── browser_poster.js           # Playwright Edge browser multi-composer thread poster
├── epfo_content.js             # RSS aggregator, Search Analytics ranker & thread generator
├── corporate_catalog.js        # Real-time sitemap.xml synchronizer & blog indexer
├── image_generator.js          # Playwright 2400x1350 compliance card renderer
├── index.js                    # Twitter API v2 poster (alternative to browser)
├── setup_tasks.ps1             # PowerShell script registering Windows Scheduled Tasks
├── setup_scheduled_tasks.bat   # One-click Windows task installer
├── run_browser_bot.bat         # One-click manual runner
├── corporate_resources_cache.json # Cached live catalog (179+ resources)
├── daily_posting_status.json   # Today's morning/evening execution record
├── posted_articles.json        # Deduplication history (prevents duplicate news)
└── .env                        # API keys (GEMINI_API_KEY)
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js** v18+ installed.
- **Microsoft Edge** browser installed.

### 2. Configure Environment
Create a `.env` file in the project root:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. One-Time Twitter Login
Run the browser poster once to authenticate your `@EPFOCompliance` session:
```powershell
npm run post:browser
```
*(Log in once in the opened Edge window. Your session is securely preserved in `.twitter_user_data/`)*

### 4. Enable Automatic Twice-Daily Posting
Right-click `setup_scheduled_tasks.bat` and select **"Run as administrator"** (or run `powershell -ExecutionPolicy Bypass -File setup_tasks.ps1`).

This registers:
- `EPFO_Twitter_Morning` — Daily at **09:30 AM IST** (+ catch-up if laptop was asleep)
- `EPFO_Twitter_Evening` — Daily at **06:00 PM IST** (+ catch-up if laptop was asleep)
- `EPFO_Twitter_LogonCatchup` — Runs on laptop boot/login after a 1-minute delay

---

## 🛠️ Manual Execution Commands

```powershell
# Run the intelligent daily runner (auto-detects morning vs evening slot & checks internet)
npm run daily

# Force immediate execution of the morning slot
node daily_runner.js --force-morning

# Force immediate execution of the evening slot
node daily_runner.js --force-evening

# Run a direct browser post immediately
npm run post:browser
```

---

## 📜 License
MIT © [Corporate Compliance](https://corporatecompliance.in)
