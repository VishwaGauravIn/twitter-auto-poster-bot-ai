# 🚀 Free Twitter / X AI Auto-Poster & Thread Bot

> **An autonomous, open-source AI content aggregator and multi-tweet thread publisher for Twitter / X.**  
> **100% Free • No $100+/mo Paid Twitter API Required • Built-in 2400×1350 Retina Card Generator • Switchable for Any Niche or Field.**

[![Playwright](https://img.shields.io/badge/Browser_Automation-Playwright_Edge-0078D7?logo=microsoftedge)](https://playwright.dev/)
[![Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Schedule](https://img.shields.io/badge/Schedule-Twice_Daily_Automation-10B981)](#-automated-twice-daily-posting)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Universal Niche](https://img.shields.io/badge/Niche-Easily_Switchable-9333EA)](#-easily-switchable-for-any-niche)
[![Live Showcase](https://img.shields.io/badge/Live_Showcase-@EPFOCompliance-1DA1F2?logo=x)](https://x.com/EPFOCompliance)

---

## 🌟 Why This Bot Is Different

Most Twitter automation bots require a **$100+/month Twitter API Basic subscription**, support only single boring text tweets, and break when internet drops. 

This repository provides an enterprise-grade, **zero-cost ($0.00) automation framework**:

| Feature | This Bot | Traditional Bots |
|---|---|---|
| **Twitter / X API Cost** | **$0.00 (Free forever)** via Playwright session automation | $100 to $5,000 / month |
| **Tweet Format** | **Atomic 3-to-5 Tweet Educational Threads** | Single short tweet |
| **Infographic Media** | **2400×1350 (2x Retina 16:9) Branded News Cards** | Plain text or low-res stock |
| **Website Promotion** | **Auto-syncs website `sitemap.xml`** & matches articles | Manual link insertion |
| **Niche Flexibility** | **Plug-and-play for ANY field** (Tech, Crypto, Finance, Law, etc.) | Hardcoded to one niche |
| **Offline Reliability** | **Active Wi-Fi Polling + Windows Wakeup Catch-up** | Fails silently if offline |
| **Memory Footprint** | **< 15 MB RAM (Zero-Idle-Footprint)** | Lingering background daemons |

---

## 🔀 Easily Switchable for Any Niche

Out of the box, the repository comes pre-configured with a **live production showcase for EPFO & Labour Law Compliance** ([@EPFOCompliance](https://x.com/EPFOCompliance)), but you can switch to **any field in 30 seconds** by changing `NICHE_PROFILE` in `.env`:

```env
# Choose your active profile:
NICHE_PROFILE=epfo     # EPFO Compliance & Labour Law (Default)
# NICHE_PROFILE=ai_tech  # AI & Technology News
# NICHE_PROFILE=crypto   # Cryptocurrency & Web3 Markets
# NICHE_PROFILE=finance  # Personal Finance & Stock Markets
# NICHE_PROFILE=custom   # Your own custom business or personal blog
```

### Pre-Configured Profiles Included:
- **`epfo` (Default)**: Official PIB releases, Gazette notifications, PF/ESIC compliance guides promoting `corporatecompliance.in`.
- **`ai_tech`**: Curates top stories from Hacker News, TechCrunch, The Verge, and Ars Technica.
- **`crypto`**: Tracks Bitcoin, Ethereum, DeFi, and Web3 trends from CoinDesk and CoinTelegraph.
- **`finance`**: Synthesizes market movements, macroeconomics, and wealth creation strategies.
- **`custom`**: Create your own `config/profiles/custom.json` with your RSS feeds, sitemap, hashtags, and branding!

---

## 🎯 Core Capabilities

### 1. 🧵 5-Tweet Comprehensive Solution Threads
Every post is structured to deliver massive value, authority, and engagement:
- **Tweet 1/5 (Hook & Alert + Branded Card)**: Subject context, direct blog link, hashtags, and 2400×1350 card.
- **Tweet 2/5 (Background Statutory Problem)**: Core context, who is impacted, and why it matters.
- **Tweet 3/5 (Actionable Step-by-Step Solution)**: Concrete practical steps, portal procedures, and numbers.
- **Tweet 4/5 (Nuances & Legal Penalties)**: Calculations, compliance pitfalls, and interest/damages rules.
- **Tweet 5/5 (Security Caveats & Website CTA)**: Scam warnings + custom website promotional link.

### 2. 🎨 2400×1350 High-Res Branded Infographic Cards
- Renders **2400×1350 (2x Retina 16:9)** high-contrast Twitter cards locally via Playwright.
- **Zero Cost ($0.00)**: No paid image APIs or rate limits.
- Features ambient radiant glow, glassmorphism advisory boxes, gold accents, and custom authority badges.

### 3. 🔄 Real-Time Website & Sitemap Synchronizer
- Automatically crawls any website's `sitemap.xml` on every run.
- Matches trending news stories to your specific blog posts, tools, or service pages for hyper-relevant inbound traffic.

### 4. ⏰ Resilient Dual-Slot Automation & Internet Watchdog
- Scheduled for peak engagement windows (Morning & Evening).
- **Active Internet Polling**: If your laptop has no Wi-Fi at the scheduled time, it waits in the background (polling every 15s) and executes immediately once online!
- **Automatic Missed-Run Catchup**: If your PC was asleep, Windows Task Scheduler automatically runs the task upon logon (`StartWhenAvailable = True`).

---

## ⚡ Quickstart (3 Minutes)

### 1. Clone & Install
```bash
git clone https://github.com/Deepaksaroj203/twitter-auto-poster-bot-ai.git
cd twitter-auto-poster-bot-ai
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your free Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NICHE_PROFILE=epfo # or ai_tech, crypto, finance, custom
```

### 3. One-Time Twitter Login
```bash
node daily_runner.js
```
*An Edge browser window will open. Log into your Twitter/X account once. Your session is securely preserved in `.twitter_user_data/` for all future automated runs!*

### 4. Enable Automated Twice-Daily Posting
Right-click `setup_scheduled_tasks.bat` and select **"Run as administrator"**.  
*(On Linux/macOS, see the crontab instructions in [SETUP_GUIDE.md](SETUP_GUIDE.md))*

---

## 📂 Project Structure

```text
twitter-auto-poster-bot-ai/
├── config/
│   ├── config_loader.js         # Loads active niche profile with 'epfo' default fallback
│   └── profiles/
│       ├── epfo.json            # Default production profile (EPFO & corporatecompliance.in)
│       ├── ai_tech.json         # Artificial Intelligence & Tech News profile
│       ├── crypto.json          # Crypto & Web3 profile
│       ├── finance.json         # Finance & Markets profile
│       └── custom.example.json  # Template for your custom niche
├── content_engine.js            # Universal multi-niche AI thread generator
├── browser_poster.js            # Playwright Edge browser multi-composer thread poster
├── daily_runner.js              # Dual-slot supervisor with internet polling & catchup
├── epfo_content.js              # Dedicated EPFO aggregator (PIB, Gazette, Official sources)
├── corporate_catalog.js         # Real-time sitemap.xml synchronizer & blog indexer
├── image_generator.js           # Playwright 2400x1350 branded infographic renderer
├── index.js                     # Twitter API v2 poster (alternative to browser)
├── setup_tasks.ps1              # Windows Task Scheduler registration script
├── setup_scheduled_tasks.bat    # 1-click Windows task installer
├── SETUP_GUIDE.md               # Complete multi-niche setup guide for new users
└── .env                         # API credentials and active profile setting
```

---

## 📜 License
MIT © [Corporate Compliance](https://corporatecompliance.in)
