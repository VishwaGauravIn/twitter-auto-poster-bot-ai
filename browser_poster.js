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
    "generate a recent indian polity today news, advices and question ask on those news; under 260 characters, plain text only, you can use emojis and trending hashtags. No quotes or markdown.";

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
    headless: false, // Keep visible so user can see or log in if needed
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  try {
    console.log("🔍 Checking Twitter / X login status...");
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 45000 });

    // Wait a brief moment to see if redirected to login
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isLoggedOut = currentUrl.includes("/login") || currentUrl.includes("/i/flow/login") || (await page.locator('a[href="/login"]').count()) > 0;

    if (isLoggedOut) {
      console.log("\n⚠️ NOT LOGGED IN YET!");
      console.log("👉 Please log into your Twitter/X account in the opened Edge browser window.");
      console.log("⏳ Waiting up to 2 minutes for you to complete login...\n");

      // Wait until home feed or compose button appears after login
      await page.waitForURL((url) => !url.href.includes("/login") && !url.href.includes("/i/flow/login"), {
        timeout: 120000,
      });
      await page.waitForTimeout(4000);
      console.log("✅ Login successful! Your session is now saved for all future automated runs.");
    } else {
      console.log("✅ Authenticated session detected.");
    }

    console.log("📝 Opening tweet composer...");
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Locate the compose textbox
    const textbox = page.locator('div[data-testid="tweetTextarea_0"]').first();
    await textbox.waitFor({ state: "visible", timeout: 15000 });
    await textbox.click();

    // Type the tweet content
    await textbox.fill(tweetText);
    await page.waitForTimeout(1000);

    // Locate Post button
    const postButton = page.locator('button[data-testid="tweetButton"]').first();
    await postButton.waitFor({ state: "visible", timeout: 10000 });

    // Check if button is enabled
    const isEnabled = await postButton.isEnabled();
    if (!isEnabled) {
      throw new Error("Post button is disabled (tweet may be too long or empty).");
    }

    console.log("🚀 Clicking 'Post' button...");
    await postButton.click();

    // Wait for the compose modal to close or toast confirmation
    await page.waitForTimeout(4000);
    console.log("🎉 Tweet posted successfully to your Twitter profile!");

  } catch (err) {
    console.error("❌ Browser automation error:", err.message);
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
