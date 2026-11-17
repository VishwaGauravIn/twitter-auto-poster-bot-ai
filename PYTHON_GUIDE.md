# AI Twitter / X Auto-Poster Bot (Python Edition)

Fully converted from `index.js` to pure Python with **zero external npm/Node dependencies**, connected to your local **FreeLLMAPI** instance (`http://127.0.0.1:31415`) with **836M+ free monthly tokens**.

---

## Features
- **Zero Cost AI Generation:** Connects directly to FreeLLMAPI with automatic fallback across fast models (`qwen3.8-27b`, `glm-4.7-flash`, `gemini-3.7-flash`, `deepseek-r1-distill-qwen-32b`, `llama-3.3-70b`).
- **Clean 280-Character Formatting:** Automatically ensures clean text, removes code fences/quotes, and adds trending hashtags and emojis.
- **Built-in OAuth 1.0a Engine:** Implements RFC 5849 signing with standard Python libraries.
- **Dry-Run Testing:** Test and preview generated tweets instantly without posting to Twitter.
- **Recurring Scheduler:** Run every X minutes continuously with `--interval <minutes>`.

---

## Configuration

Edit [`secrets.json`](secrets.json) with your Twitter Developer API credentials:
```json
{
  "APP_KEY": "YOUR_CONSUMER_KEY",
  "APP_SECRET": "YOUR_CONSUMER_SECRET",
  "ACCESS_TOKEN": "YOUR_ACCESS_TOKEN",
  "ACCESS_SECRET": "YOUR_ACCESS_SECRET"
}
```

> **Important Twitter Developer Settings:**
> In the Twitter Developer Portal (developer.x.com):
> 1. Set User Authentication Settings -> App Permissions to **"Read and Write"**.
> 2. If you modify permissions, you **must regenerate** the Access Token and Secret.

---

## Usage

### 1. Dry Run (Test AI tweet generation without posting)
```bash
python twitter_bot.py --dry-run
```
*(Or double-click `Test_Twitter_Bot_DryRun.bat` on your Desktop)*

### 2. Live Post (Generate and post to Twitter)
```bash
python twitter_bot.py
```
*(Or double-click `Run_Twitter_Bot.bat` on your Desktop)*

### 3. Custom Topic / Prompt
```bash
python twitter_bot.py --topic "latest artificial intelligence developments and future implications" --dry-run
```

### 4. Continuous Posting (e.g. Every 120 minutes / 2 hours)
```bash
python twitter_bot.py --interval 120
```
