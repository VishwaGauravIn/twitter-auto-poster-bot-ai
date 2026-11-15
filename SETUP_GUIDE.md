# 🚀 Quickstart Guide: Universal Free Twitter / X Auto-Poster Bot

Turn any Twitter / X account into an autonomous, high-engagement content engine.

---

## ⚡ Why Use This Bot?

- 🚫 **100% Free — No $100+/mo Twitter API Fee**: Uses local headless browser automation with persistent session storage.
- 🧵 **Atomic 3-to-5 Tweet Threads**: Composes educational, structured threads (Hook, Context, Solution, Nuances, Call-to-Action).
- 🎨 **Auto-Generated Retina Infographics**: Automatically renders high-contrast 2400×1350 branded cards locally for Tweet 1.
- 🔄 **Sitemap Auto-Sync**: Automatically crawls your website's `sitemap.xml` to match and promote relevant articles.
- 🔀 **Switchable Niche Engine**: Pre-configured profiles for **Compliance, Tech/AI, Crypto/Web3, Personal Finance**, or any custom field.
- ⏰ **Dual-Slot Automation & Offline Watchdog**: Runs twice daily during peak traffic windows and catches up if your PC was off.

---

## 🛠️ 3-Step Setup

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/Deepaksaroj203/twitter-auto-poster-bot-ai.git
cd twitter-auto-poster-bot-ai
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your free Google Gemini API key (from [ai.google.dev](https://ai.google.dev/)):

```env
GEMINI_API_KEY=your_gemini_api_key_here
NICHE_PROFILE=epfo # or ai_tech, crypto, finance, custom
```

### Step 3: One-Time Twitter Login

Run the bot once:

```bash
node daily_runner.js
```

A browser window will open automatically asking you to log into your Twitter/X account. Log in once, and your session is saved permanently in `.twitter_user_data`!

---

## 🔀 Switching Niches & Topics

To change your bot's niche, edit `NICHE_PROFILE` in `.env`:

| Profile | Command / Setting | Focus |
|---|---|---|
| **EPFO Compliance (Default)** | `NICHE_PROFILE=epfo` | Official PIB, Gazette, PF/ESIC alerts & statutory guides. |
| **Tech & AI News** | `NICHE_PROFILE=ai_tech` | TechCrunch, Hacker News, The Verge, LLM breakthroughs. |
| **Crypto & Web3** | `NICHE_PROFILE=crypto` | CoinDesk, CoinTelegraph, market sentiment, Bitcoin/Ethereum. |
| **Finance & Wealth** | `NICHE_PROFILE=finance` | Market trends, economy, investing, stock analysis. |
| **Custom Niche** | `NICHE_PROFILE=custom` | Create `config/profiles/custom.json` with your own feeds & website! |

---

## ⏰ Automated Scheduled Posting

### Windows:
Run the included batch script as Administrator:
```cmd
setup_scheduled_tasks.bat
```
This registers 3 resilient Windows Task Scheduler jobs:
1. `Twitter_Morning` — 09:30 AM IST
2. `Twitter_Evening` — 06:00 PM IST
3. `Twitter_LogonCatchup` — Triggers when you log into your laptop if a post was missed.

### Linux / macOS:
Add to your crontab (`crontab -e`):
```cron
30 9 * * * cd /path/to/twitter-auto-poster-bot-ai && node daily_runner.js >> daily_runner.log 2>&1
0 18 * * * cd /path/to/twitter-auto-poster-bot-ai && node daily_runner.js >> daily_runner.log 2>&1
```
