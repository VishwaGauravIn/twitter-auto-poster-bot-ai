// Free Browser-based Twitter / X Auto-Poster via Playwright & Microsoft Edge
// Dedicated for @EPFOCompliance — Posts live EPFO news, circulars & compliance advisories.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const GenAI = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env.");
  process.exit(1);
}

const genAI = new GenAI.GoogleGenerativeAI(GEMINI_API_KEY);
const USER_DATA_DIR = path.join(__dirname, ".twitter_user_data");
const HISTORY_FILE = path.join(__dirname, "posted_articles.json");

// Fetch the most recent EPFO news and blog posts from Google News RSS
async function fetchLatestEpfoNews() {
  console.log("📰 Fetching latest published EPFO news & blogs...");
  try {
    const res = await fetch(
      "https://news.google.com/rss/search?q=EPFO+when:2d&hl=en-IN&gl=IN&ceid=IN:en",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const xml = await res.text();
    const itemMatches = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>/g)].map(
      (m) => m[1].replace(/ - .*$/, "").trim()
    );
    const headlines = itemMatches.filter((h) => h && !h.includes("Google News"));

    console.log(`Found ${headlines.length} recent EPFO headlines.`);
    return headlines;
  } catch (err) {
    console.warn("⚠️ Could not fetch RSS feed, using compliance topics fallback:", err.message);
    return [];
  }
}

// Load history of previously posted articles to avoid duplicate tweets
function getPostedHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch (_) {}
  return [];
}

function savePostedHeadline(headline) {
  try {
    const history = getPostedHistory();
    history.push({ headline, postedAt: new Date().toISOString() });
    // Keep only last 50 items
    const trimmed = history.slice(-50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch (err) {
    console.warn("Could not save history:", err.message);
  }
}

async function generateEpfoTweet() {
  const headlines = await fetchLatestEpfoNews();
  const history = getPostedHistory();
  const postedSet = new Set(history.map((h) => h.headline));

  // Find the first unposted headline
  let selectedHeadline = headlines.find((h) => !postedSet.has(h));

  const fallbackTopics = [
    "EPFO Auto-Claim Settlement limits and eligibility under Form 31 for illness and education",
    "Mandatory e-Nomination update for EDLI life insurance cover up to ₹7 Lakhs",
    "Standard Operating Procedure (SOP) for Joint Declaration member profile corrections",
    "Monthly ECR contribution filing deadlines and compliance checks for establishments",
    "EPFO interest rate credit status and how to check your digital passbook",
    "Higher pension EPS-95 calculation options and joint option verification",
    "UAN-Aadhaar seeding and active mobile link for seamless online withdrawals"
  ];

  if (!selectedHeadline) {
    selectedHeadline = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
    console.log(`ℹ️ All recent news posted. Using curated compliance topic: "${selectedHeadline}"`);
  } else {
    console.log(`✨ Selected unposted news: "${selectedHeadline}"`);
  }

  console.log("🤖 Generating EPFO compliance advisory tweet via Gemini AI...");
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { maxOutputTokens: 300 },
  });

  const prompt = `You are @EPFOCompliance, the leading authority on EPFO (Employees' Provident Fund Organisation) rules, circulars, and compliance updates in India.

Context / Latest News: "${selectedHeadline}"

Write a timely, authoritative compliance advisory tweet for PF members, HR professionals, and employers.
Rules:
1. Under 230 characters strictly (leave room for hashtags).
2. Actionable advice: Highlight the rule, deadline, or member benefit (e.g., ECR deadline, KYC seeding, UAN link, Form 31/19, Joint Declaration).
3. Plain text only. Include 2-3 focused hashtags: #EPFO #EPF #PFCompliance #UAN.
4. No quotes or markdown fences.`;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text().trim().replace(/^["']|["']$/g, "");

  return { text, headline: selectedHeadline };
}

async function postTweetViaBrowser(tweetText) {
  console.log("\n--- Tweet to Post ---");
  console.log(tweetText);
  console.log(`Length: ${tweetText.length} characters\n---------------------\n`);

  console.log("🌐 Launching Microsoft Edge browser...");
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    channel: "msedge",
    headless: false,
    viewport: { width: 1280, height: 850 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    console.log("🔍 Checking Twitter / X session...");
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const loggedInIndicator = page.locator(
      '[data-testid="SideNav_AccountSwitcher_Button"], a[data-testid="AppTabBar_Home_Link"], [data-testid="SideNav_NewTweet_Button"]'
    ).first();

    const isLoggedIn = await loggedInIndicator.isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log("\n============================================================");
      console.log("🔑 TWITTER / X LOGIN REQUIRED (ONE-TIME SETUP)");
      console.log("============================================================");
      console.log("Please log into @EPFOCompliance in the opened Edge window.");
      console.log("⏳ The browser will remain open until login is completed...\n");

      const currentUrl = page.url();
      if (!currentUrl.includes("/login") && !currentUrl.includes("/i/flow/login")) {
        await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      }

      await loggedInIndicator.waitFor({ state: "visible", timeout: 600000 });
      await page.waitForTimeout(4000);
      console.log("✅ Login confirmed! Session saved permanently.\n");
    } else {
      console.log("✅ Authenticated as @EPFOCompliance.");
    }

    console.log("📝 Opening tweet composer...");
    if (!page.url().includes("/home")) {
      await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Click the sidebar "Post" button
    const sideNavPostBtn = page.locator('a[data-testid="SideNav_NewTweet_Button"], button[data-testid="SideNav_NewTweet_Button"]').first();
    if (await sideNavPostBtn.isVisible().catch(() => false)) {
      await sideNavPostBtn.click();
      await page.waitForTimeout(1000);
    }

    // Locate textbox
    const textbox = page.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textbox.waitFor({ state: "visible", timeout: 15000 });
    console.log("✍️ Typing tweet content into composer...");

    await textbox.click();
    await page.waitForTimeout(500);

    await page.keyboard.insertText(tweetText);
    await page.waitForTimeout(1000);

    // Press Escape to dismiss any hashtag/mention popup dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    console.log("🚀 Publishing tweet (Control+Enter & Force-Click fallback)...");

    // Primary action: Control+Enter
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(2000);

    // Fallback: If modal still open, force-click Post button
    const postButton = page.locator('button[data-testid="tweetButton"]').first();
    const isStillVisible = await postButton.isVisible().catch(() => false);
    if (isStillVisible) {
      console.log("👉 Force-clicking 'Post' button...");
      await postButton.click({ force: true });
    }

    await page.waitForTimeout(5000);
    console.log("🎉 Tweet posted successfully to @EPFOCompliance!");

  } catch (err) {
    console.error("❌ Browser automation error:", err.message);
    const screenshotPath = path.join(__dirname, "last_error.png");
    try {
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Diagnostic screenshot saved to: ${screenshotPath}`);
    } catch (_) {}
    throw err;
  } finally {
    console.log("🔒 Closing browser session...");
    await context.close();
  }
}

async function main() {
  try {
    const { text, headline } = await generateEpfoTweet();
    await postTweetViaBrowser(text);
    savePostedHeadline(headline);
    console.log("✨ All done! Next tweet scheduled.");
  } catch (err) {
    console.error("Execution failed:", err.message || err);
    process.exit(1);
  }
}

main();
