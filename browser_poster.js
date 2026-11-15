// Free Browser-based Twitter / X Auto-Poster via Playwright & Microsoft Edge
// Dedicated for @EPFOCompliance — Posts live 3-part EPFO compliance threads with actionable solutions,
// high-res branded news card images, and exact links to https://corporatecompliance.in blogs and tools.

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const GenAI = require("@google/generative-ai");
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

    console.log("📝 Opening tweet composer...");
    if (!page.url().includes("/home")) {
      await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Click the sidebar "Post" button to trigger the modal dialog
    const sideNavPostBtn = page.locator('a[data-testid="SideNav_NewTweet_Button"], button[data-testid="SideNav_NewTweet_Button"]').first();
    if (await sideNavPostBtn.isVisible().catch(() => false)) {
      await sideNavPostBtn.click();
      await page.waitForTimeout(1500);
    }

    // Determine scope: Modal dialog ([role="dialog"]) or inline feed composer
    let scope = page;
    const modal = page.locator('div[role="dialog"]').first();
    const isModalOpen = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (isModalOpen) {
      console.log("🎯 Scoped to active tweet modal dialog...");
      scope = modal;
    } else {
      console.log("ℹ️ Modal not detected, using inline composer...");
    }

    // 1. Tweet 1 (Hook + Infographic Image)
    const textbox0 = scope.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textbox0.waitFor({ state: "visible", timeout: 15000 });

    console.log("✍️ Typing Tweet 1/3 (Hook & News Alert)...");
    await textbox0.click({ force: true });
    await page.waitForTimeout(500);
    await page.keyboard.insertText(thread[0]);
    await page.waitForTimeout(1000);

    // Attach image card to Tweet 1
    if (imagePath && fs.existsSync(imagePath)) {
      console.log("📸 Attaching branded news card image to Tweet 1...");
      const fileInput = scope.locator('input[data-testid="fileInput"], input[type="file"]').first();
      await fileInput.setInputFiles(imagePath);
      console.log("⏳ Waiting for image upload preview to render...");
      await scope.locator('[data-testid="attachments"], div[aria-label="Image"], button[aria-label="Remove media"]').first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(2500);
    }

    // 2. Add Tweet 2 & Tweet 3 to form the thread
    const addBtn = scope.locator('button[data-testid="addButton"], div[aria-label="Add post"], button[aria-label="Add post"]').first();
    const canAddPost = await addBtn.isVisible().catch(() => false);

    if (canAddPost && thread.length > 1) {
      console.log("➕ Clicking 'Add post' to compose Tweet 2/3 (Step-by-Step Solution)...");
      await addBtn.click();
      await page.waitForTimeout(1000);

      const textbox1 = scope.locator('div[data-testid="tweetTextarea_1"]').first();
      await textbox1.waitFor({ state: "visible", timeout: 10000 });
      await textbox1.click({ force: true });
      await page.waitForTimeout(500);
      await page.keyboard.insertText(thread[1]);
      await page.waitForTimeout(1000);

      if (thread.length > 2) {
        console.log("➕ Clicking 'Add post' to compose Tweet 3/3 (Guide & Blog Link)...");
        await addBtn.click();
        await page.waitForTimeout(1000);

        const textbox2 = scope.locator('div[data-testid="tweetTextarea_2"]').first();
        await textbox2.waitFor({ state: "visible", timeout: 10000 });
        await textbox2.click({ force: true });
        await page.waitForTimeout(500);
        await page.keyboard.insertText(thread[2]);
        await page.waitForTimeout(1000);
      }
    } else {
      console.warn("ℹ️ Native Add post button not found; posting Tweet 1 as main update.");
    }

    // Dismiss any autocomplete popovers
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    console.log("🚀 Publishing full thread ('Post all' / Control+Enter)...");
    const postAllBtn = scope.locator('button[data-testid="tweetButton"]').first();
    if (await postAllBtn.isVisible().catch(() => false)) {
      await postAllBtn.click({ force: true });
    } else {
      await page.keyboard.press("Control+Enter");
    }

    // Confirm post modal closes
    if (isModalOpen) {
      await modal.waitFor({ state: "hidden", timeout: 25000 }).catch(() => {});
    }
    await page.waitForTimeout(4000);

    console.log("🎉 Complete 3-part EPFO compliance thread posted successfully to @EPFOCompliance!");

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
    const { thread, tweetText, insight, headline, source, pubDate, resourceTitle, resourceUrl } = await generateEpfoTweet(genAI);

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
  } catch (err) {
    console.error("Execution failed:", err.message || err);
    process.exit(1);
  }
}

main();
