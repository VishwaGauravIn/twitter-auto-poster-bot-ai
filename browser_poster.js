// Free Browser-based Twitter / X Auto-Poster via Playwright & Microsoft Edge
// Bypasses Twitter API charges ($0.00 cost) using your personal browser session.
require("dotenv").config();
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

async function generateTweetContent() {
  console.log("🤖 Generating Indian polity news tweet via Gemini AI...");
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { maxOutputTokens: 300 },
  });

  const prompt =
    "generate a recent indian polity today news, advices and question ask on those news; under 240 characters, plain text only, use emojis and trending hashtags. No quotes or markdown.";

  const result = await model.generateContent(prompt);
  const text = (await result.response).text().trim().replace(/^["']|["']$/g, "");
  return text;
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

    // Reliable check for logged-in user:
    const loggedInIndicator = page.locator(
      '[data-testid="SideNav_AccountSwitcher_Button"], a[data-testid="AppTabBar_Home_Link"], [data-testid="SideNav_NewTweet_Button"]'
    ).first();

    const isLoggedIn = await loggedInIndicator.isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log("\n============================================================");
      console.log("🔑 TWITTER / X LOGIN REQUIRED (ONE-TIME SETUP)");
      console.log("============================================================");
      console.log("Microsoft Edge is open on your screen.");
      console.log("👉 Please LOG IN to your Twitter/X account in the browser.");
      console.log("⏳ Take your time! The browser will NOT close automatically.\n");

      const currentUrl = page.url();
      if (!currentUrl.includes("/login") && !currentUrl.includes("/i/flow/login")) {
        await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      }

      await loggedInIndicator.waitFor({ state: "visible", timeout: 600000 });
      await page.waitForTimeout(4000);
      console.log("✅ Login confirmed! Your session has been permanently saved.\n");
    } else {
      console.log("✅ Authenticated session detected.");
    }

    console.log("📝 Opening tweet composer...");

    if (!page.url().includes("/home")) {
      await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Click the sidebar "Post" button to open the compose modal
    const sideNavPostBtn = page.locator('a[data-testid="SideNav_NewTweet_Button"], button[data-testid="SideNav_NewTweet_Button"]').first();
    if (await sideNavPostBtn.isVisible().catch(() => false)) {
      await sideNavPostBtn.click();
      await page.waitForTimeout(1000);
    }

    // Locate the compose textbox
    const textbox = page.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textbox.waitFor({ state: "visible", timeout: 15000 });
    console.log("✍️ Typing tweet content into composer...");

    await textbox.click();
    await page.waitForTimeout(500);

    // Insert text natively through keyboard
    await page.keyboard.insertText(tweetText);
    await page.waitForTimeout(1000);

    // Press Escape to dismiss any hashtag/mention autocomplete popup dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    console.log("🚀 Publishing tweet (Control+Enter & Force-Click)...");

    // Primary action: Control+Enter is the native Twitter shortcut to post a tweet
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(2000);

    // Fallback: If modal is still open, force-click the Post button bypassing any overlay/tooltip
    const postButton = page.locator('button[data-testid="tweetButton"]').first();
    const isStillVisible = await postButton.isVisible().catch(() => false);
    if (isStillVisible) {
      console.log("👉 Force-clicking 'Post' button...");
      await postButton.click({ force: true });
    }

    // Wait for the tweet submission to complete
    await page.waitForTimeout(5000);
    console.log("🎉 Tweet posted successfully to your Twitter profile!");

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
    const tweetText = await generateTweetContent();
    await postTweetViaBrowser(tweetText);
    console.log("✨ All done!");
  } catch (err) {
    console.error("Execution failed:", err.message || err);
    process.exit(1);
  }
}

main();
