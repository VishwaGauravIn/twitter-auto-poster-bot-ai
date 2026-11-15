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
    "generate a recent indian polity today news, advices and question ask on those news; under 250 characters, plain text only, use emojis and trending hashtags. No quotes or markdown.";

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
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    console.log("🔍 Navigating to Twitter / X Home...");
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    // Check login state
    const currentUrl = page.url();
    const isLoggedOut =
      currentUrl.includes("/login") ||
      currentUrl.includes("/i/flow/login") ||
      (await page.locator('a[href="/login"]').count()) > 0;

    if (isLoggedOut) {
      console.log("\n⚠️ NOT LOGGED IN YET!");
      console.log("👉 Please log into your Twitter/X account in the opened Edge browser window.");
      console.log("⏳ Waiting up to 2 minutes for you to complete login...\n");

      await page.waitForURL((url) => !url.href.includes("/login") && !url.href.includes("/i/flow/login"), {
        timeout: 120000,
      });
      await page.waitForTimeout(4000);
      console.log("✅ Login successful! Session saved for future runs.");
    } else {
      console.log("✅ Authenticated session detected.");
    }

    console.log("📝 Finding tweet composer...");

    // Strategy 1: Check if the inline textbox is already visible on the home page
    let textbox = page.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    let isTextboxReady = await textbox.isVisible({ timeout: 4000 }).catch(() => false);

    // Strategy 2: If inline textbox not visible, click the sidebar "Post" button to open modal
    if (!isTextboxReady) {
      console.log("👉 Clicking sidebar 'Post' button to open composer...");
      const sideNavPostBtn = page.locator('a[data-testid="SideNav_NewTweet_Button"], button[data-testid="SideNav_NewTweet_Button"]').first();
      if (await sideNavPostBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sideNavPostBtn.click();
        await page.waitForTimeout(1500);
      } else {
        // Strategy 3: Try keyboard shortcut 'n' which opens tweet composer on Twitter
        console.log("👉 Triggering tweet composer via keyboard shortcut 'n'...");
        await page.keyboard.press("KeyN");
        await page.waitForTimeout(1500);
      }
    }

    // Now wait for the textbox in either home feed or compose modal
    textbox = page.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textbox.waitFor({ state: "visible", timeout: 15000 });
    console.log("✍️ Composer ready! Typing tweet content...");

    await textbox.click();
    await page.waitForTimeout(500);

    // Insert text natively through keyboard to trigger Lexical / Draft.js change handlers
    await page.keyboard.insertText(tweetText);
    await page.waitForTimeout(1500);

    // Locate the Post button (either modal or inline)
    console.log("🔍 Locating 'Post' button...");
    const postButton = page.locator('button[data-testid="tweetButton"], button[data-testid="tweetButtonInline"]').first();
    await postButton.waitFor({ state: "visible", timeout: 10000 });

    const isEnabled = await postButton.isEnabled();
    if (!isEnabled) {
      throw new Error("Post button is disabled (content may exceed character limits).");
    }

    console.log("🚀 Clicking 'Post' button...");
    await postButton.click();

    // Wait for the tweet to send and UI to settle
    await page.waitForTimeout(5000);
    console.log("🎉 Tweet posted successfully to your Twitter profile!");

  } catch (err) {
    console.error("❌ Browser automation error:", err.message);
    // Take a screenshot of the error state so we can see what happened
    const screenshotPath = path.join(__dirname, "last_error.png");
    try {
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Saved diagnostic screenshot to: ${screenshotPath}`);
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
