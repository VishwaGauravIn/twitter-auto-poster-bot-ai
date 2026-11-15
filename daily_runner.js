// daily_runner.js — Intelligent Dual-Slot Daily Automation Runner & Watchdog
// Ensures exactly 2 EPFO compliance threads are posted every day during peak Indian engagement windows.
// Features active internet polling, automatic missed-run catchup, and daily slot tracking.

const fs = require("fs");
const path = require("path");
const dns = require("dns");
const https = require("https");
const { executePostingWorkflow } = require("./browser_poster");

const STATUS_FILE = path.join(__dirname, "daily_posting_status.json");
const LOG_FILE = path.join(__dirname, "daily_runner.log");

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
  } catch (_) {}
}

// Check internet connectivity via fast DNS lookup with HTTPS fallback
function checkInternet() {
  return new Promise((resolve) => {
    dns.lookup("dns.google", { timeout: 4000 }, (err) => {
      if (!err) return resolve(true);

      // HTTPS fallback
      const req = https.get("https://www.google.com", { timeout: 5000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  });
}

// Polite wait loop for laptop to establish internet connection
async function waitForInternet(maxWaitMinutes = 45, checkIntervalSec = 15) {
  log("🔍 Checking active internet connection...");
  const isImmediatelyOnline = await checkInternet();
  if (isImmediatelyOnline) {
    log("🌐 Internet connection active.");
    return true;
  }

  log(`⏳ [OFFLINE] No active internet connection detected.`);
  log(`🔄 Laptop is currently offline. Polling every ${checkIntervalSec}s (timeout: ${maxWaitMinutes} mins)...`);

  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, checkIntervalSec * 1000));
    const online = await checkInternet();
    if (online) {
      log(`🌐 [ONLINE] Internet connection established! Proceeding with scheduled compliance post...`);
      // Wait 3 seconds for connection stability
      await new Promise((r) => setTimeout(r, 3000));
      return true;
    }
  }

  log(`❌ [TIMEOUT] No internet connection after ${maxWaitMinutes} minutes. Exiting run.`);
  return false;
}

// Compute Indian Standard Time (IST, UTC+5:30)
function getIstTime() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffsetMs = 5.5 * 3600000;
  const istDate = new Date(utcMs + istOffsetMs);

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  return { istDate, dateStr, hours, minutes };
}

// Load daily posting status
function loadStatus() {
  if (fs.existsSync(STATUS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
    } catch (_) {}
  }
  return null;
}

function saveStatus(status) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), "utf8");
  } catch (err) {
    log(`⚠️ Could not save daily status: ${err.message}`);
  }
}

// Evaluate which slot should be run today
function evaluateSlot(status, hours, minutes) {
  // Morning Slot target: 09:30 AM IST (Window: >= 09:00 AM)
  // Evening Slot target: 06:00 PM IST (Window: >= 17:30 / 5:30 PM)

  const isMorningWindow = hours >= 9;
  const isEveningWindow = hours > 17 || (hours === 17 && minutes >= 30);

  if (!status.morning.done) {
    if (isMorningWindow) {
      return {
        slot: "morning",
        reason: isEveningWindow
          ? "Catch-up: Morning post was missed earlier today (executing now before evening slot)."
          : "Scheduled Morning Slot (Peak engagement window: 09:30 AM IST)."
      };
    }
    return {
      slot: null,
      reason: `Current time (${hours}:${String(minutes).padStart(2, "0")} IST) is before Morning peak window (09:00 AM).`
    };
  }

  if (!status.evening.done) {
    if (isEveningWindow) {
      return {
        slot: "evening",
        reason: "Scheduled Evening Slot (Peak engagement window: 06:00 PM IST)."
      };
    }
    return {
      slot: null,
      reason: `Morning slot already posted at ${status.morning.postedAt}. Evening slot opens at 05:30 PM IST.`
    };
  }

  return {
    slot: null,
    reason: `All done! Both daily slots (Morning & Evening) are completed for today.`
  };
}

async function runDailyScheduler(forceSlot = null) {
  const { dateStr, hours, minutes } = getIstTime();
  log(`================================================================`);
  log(`⏰ EPFO Twitter Daily Runner: ${dateStr} ${hours}:${String(minutes).padStart(2, "0")} IST`);
  log(`================================================================`);

  let status = loadStatus();

  // Reset or initialize if new calendar day
  if (!status || status.date !== dateStr) {
    log(`📅 Initializing fresh daily posting tracking for ${dateStr}...`);
    status = {
      date: dateStr,
      morning: { done: false, postedAt: null, headline: null, url: null },
      evening: { done: false, postedAt: null, headline: null, url: null }
    };
    saveStatus(status);
  }

  // Determine slot
  let targetSlot = forceSlot;
  if (!targetSlot) {
    const evaluation = evaluateSlot(status, hours, minutes);
    if (!evaluation.slot) {
      log(`ℹ️ ${evaluation.reason}`);
      log(`✨ No posting action needed at this time. Exiting cleanly.`);
      return;
    }
    targetSlot = evaluation.slot;
    log(`🎯 Target Posting Slot: [${targetSlot.toUpperCase()}] — ${evaluation.reason}`);
  }

  // Verify internet connectivity (with polite wait loop for Wi-Fi connection)
  const isOnline = await waitForInternet(45, 15);
  if (!isOnline) {
    log("❌ Aborting scheduled post due to prolonged internet outage.");
    process.exit(1);
  }

  // Execute posting with up to 3 retries on transient errors
  const maxRetries = 3;
  let attempt = 0;
  let postedResult = null;

  while (attempt < maxRetries && !postedResult) {
    attempt++;
    try {
      log(`🚀 Executing ${targetSlot.toUpperCase()} 3-part thread workflow (Attempt ${attempt}/${maxRetries})...`);
      postedResult = await executePostingWorkflow();
    } catch (err) {
      log(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        log(`⏳ Waiting 3 minutes before retrying...`);
        await new Promise((r) => setTimeout(r, 180000));
      }
    }
  }

  if (postedResult) {
    status[targetSlot] = {
      done: true,
      postedAt: new Date().toISOString(),
      headline: postedResult.headline,
      source: postedResult.source,
      url: postedResult.resourceUrl
    };
    saveStatus(status);
    log(`🎉 SUCCESS: ${targetSlot.toUpperCase()} thread published to @EPFOCompliance!`);
    log(`📌 Headline: "${postedResult.headline}"`);
    log(`🔗 Promoted URL: ${postedResult.resourceUrl}`);
  } else {
    log(`❌ Failed to post ${targetSlot.toUpperCase()} thread after ${maxRetries} attempts.`);
    process.exit(1);
  }
}

// Allow CLI override: node daily_runner.js --force-morning / --force-evening
const args = process.argv.slice(2);
const forceSlot = args.includes("--force-morning")
  ? "morning"
  : args.includes("--force-evening")
  ? "evening"
  : null;

runDailyScheduler(forceSlot).catch((err) => {
  log(`💥 Fatal runner error: ${err.message}`);
  process.exit(1);
});
