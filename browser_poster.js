// Free Browser-based Twitter / X Auto-Poster via Playwright & Microsoft Edge
// Dedicated for @EPFOCompliance — Posts live 3-part EPFO compliance threads with actionable solutions,
// high-res branded news card images, and exact links to https://corporatecompliance.in blogs and tools.

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const GenAI = require("@google/generative-ai");
const { generateContent } = require("./content_engine");
const { generateEpfoTweet, savePostedHeadline } = require("./epfo_content");
const { generateTweetImage } = require("./image_generator");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env.");
  process.exit(1);
}

const genAI = new GenAI.GoogleGenerativeAI(GEMINI_API_KEY);
const USER_DATA_DIR = path.join(__dirname, ".twitter_user_data");

async function postThreadViaBrowser(thread, imagePath = null) {
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

    console.log("📝 Navigating directly to dedicated tweet composer (https://x.com/compose/post)...");
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForTimeout(2500);

    // Check if any leftover modal/draft prompt exists and discard it
    try {
      const discardBtn = page.locator('button[data-testid="confirmationSheetConfirm"]');
      if (await discardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log("🧹 Discarding leftover draft dialog...");
        await discardBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }
    } catch (_) {}

    // 1. Tweet 1 (Hook + Direct Reference Link + Infographic Image)
    const textbox0 = page.locator('div[data-testid="tweetTextarea_0"]').first();
    await textbox0.waitFor({ state: "visible", timeout: 15000 });

    console.log(`✍️ Typing Tweet 1/${thread.length} (Subject Hook + Reference Link)...`);
    await textbox0.click({ force: true });
    await page.waitForTimeout(500);
    await page.keyboard.insertText(thread[0]);
    await page.waitForTimeout(1000);

    // Attach image card to Tweet 1
    if (imagePath && fs.existsSync(imagePath)) {
      console.log("📸 Attaching branded news card image to Tweet 1...");
      const fileInput = page.locator('input[data-testid="fileInput"], input[type="file"]').first();
      await fileInput.setInputFiles(imagePath);
      console.log("⏳ Waiting for image upload preview to render...");
      await page.locator('[data-testid="attachments"], div[aria-label="Image"], button[aria-label="Remove media"]').first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(2500);
    }

    // 2. Chained Tweets (Tweet 2 through Tweet N) to form the full thread
    for (let i = 1; i < thread.length; i++) {
      console.log(`➕ Clicking 'Add post' to compose Tweet ${i + 1}/${thread.length}...`);
      const addBtn = page.locator('button[data-testid="addButton"]').first();
      await addBtn.waitFor({ state: "visible", timeout: 10000 });
      await addBtn.click({ force: true });
      await page.waitForTimeout(1200);

      const nextTextarea = page.locator(`div[data-testid="tweetTextarea_${i}"]`).first();
      await nextTextarea.waitFor({ state: "visible", timeout: 10000 });
      await nextTextarea.click({ force: true });
      await page.waitForTimeout(500);
      await page.keyboard.insertText(thread[i]);
      await page.waitForTimeout(1000);
    }

    // 3. Publish the complete thread atomically via 'Post all'
    console.log("⏳ Waiting for 'Post all' button to become enabled...");
    const postAllBtn = page.locator('button[data-testid="tweetButton"]').first();
    await postAllBtn.waitFor({ state: "visible", timeout: 10000 });

    // Ensure the button is active and not aria-disabled
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[data-testid="tweetButton"]');
      return btn && btn.getAttribute("aria-disabled") !== "true" && !btn.disabled;
    }, { timeout: 25000 });

    console.log("🚀 Clicking 'Post all' to publish full thread...");
    await postAllBtn.click({ force: true });

    // 4. Confirm submission: Wait for the composer textarea to detach (disappear)
    console.log("⏳ Waiting for Twitter backend to accept thread submission...");
    await page.locator('div[data-testid="tweetTextarea_0"]').waitFor({ state: "detached", timeout: 35000 }).catch(() => {});
    await page.waitForTimeout(6000);

    // 5. Verify published thread on live profile
    console.log("🔍 Navigating to @EPFOCompliance profile to verify live publication...");
    await page.goto("https://x.com/EPFOCompliance", { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForTimeout(5000);

    console.log(`🎉 Complete ${thread.length}-part EPFO compliance thread posted successfully to @EPFOCompliance!`);

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

async function executePostingWorkflow() {
  const { thread, tweetText, insight, headline, source, pubDate, resourceTitle, resourceUrl } = await generateContent(genAI);

  // Generate high-res branded news card image for Tweet 1
  let imagePath = null;
  try {
    imagePath = await generateTweetImage({
      headline,
      insight,
      resourceTitle,
      resourceUrl,
      source,
      pubDate,
    });
  } catch (imgErr) {
    console.warn("⚠️ Image generation warning:", imgErr.message);
  }

  // Post the 3-part thread simultaneously
  await postThreadViaBrowser(thread, imagePath);
  savePostedHeadline(headline, source, pubDate);
  console.log(`✨ All done! Promoted: ${resourceTitle} (${resourceUrl})`);
  return { headline, source, resourceTitle, resourceUrl, thread };
}

async function main() {
  try {
    await executePostingWorkflow();
  } catch (err) {
    console.error("Execution failed:", err.message || err);
    process.exit(1);
  }
}

module.exports = {
  postThreadViaBrowser,
  executePostingWorkflow,
  main
};

if (require.main === module) {
  main();
}
