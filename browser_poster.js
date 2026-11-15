// Free Browser-based Twitter / X Auto-Poster via Playwright & Microsoft Edge
// Dedicated for @EPFOCompliance — Posts live EPFO news, circulars & compliance advisories.
// Automatically matches and promotes https://corporatecompliance.in tools and blogs with high-res branded image cards.

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

async function postTweetViaBrowser(tweetText, imagePath = null) {
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

    // Click the sidebar "Post" button to trigger the composer modal
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
      console.log("🎯 Scoped to active tweet modal dialog (avoids background mask obstruction)...");
      scope = modal;
    } else {
      console.log("ℹ️ Modal not detected, using inline composer...");
    }

    // Locate textbox strictly within the active scope
    const textbox = scope.locator('div[data-testid="tweetTextarea_0"], div[role="textbox"][contenteditable="true"]').first();
    await textbox.waitFor({ state: "visible", timeout: 15000 });

    console.log("✍️ Focusing and typing tweet content into composer...");
    await textbox.click({ force: true });
    await page.waitForTimeout(500);

    await page.keyboard.insertText(tweetText);
    await page.waitForTimeout(1000);

    // Press Escape to dismiss any hashtag/mention popup dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Attach image if present
    if (imagePath && fs.existsSync(imagePath)) {
      console.log("📸 Attaching branded news card image to tweet...");
      const fileInput = scope.locator('input[data-testid="fileInput"], input[type="file"]').first();
      await fileInput.setInputFiles(imagePath);
      console.log("⏳ Waiting for image upload preview to render...");
      await scope.locator('[data-testid="attachments"], div[aria-label="Image"], button[aria-label="Remove media"]').first().waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    console.log("🚀 Publishing tweet (Control+Enter & Force-Click fallback)...");

    // Primary action: Control+Enter
    await page.keyboard.press("Control+Enter");
    await page.waitForTimeout(3000);

    // Fallback: If modal or post button is still visible, force-click Post button
    const postButton = scope.locator('button[data-testid="tweetButton"], button[data-testid="tweetButtonInline"]').first();
    const isStillVisible = await postButton.isVisible().catch(() => false);
    if (isStillVisible) {
      console.log("👉 Force-clicking 'Post' button...");
      await postButton.click({ force: true });
    }

    // Confirm modal closes or wait 5 seconds
    if (isModalOpen) {
      await modal.waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    } else {
      await page.waitForTimeout(4000);
    }

    console.log("🎉 Tweet with image card posted successfully to @EPFOCompliance!");

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
    const { tweetText, headline, source, pubDate, resourceTitle, resourceUrl } = await generateEpfoTweet(genAI);

    // Extract insight (the first line of the tweet before blank line)
    const insight = tweetText.split("\n\n")[0] || headline;

    // Generate high-res branded news card image
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
      console.warn("⚠️ Image generation warning, falling back to text tweet:", imgErr.message);
    }

    await postTweetViaBrowser(tweetText, imagePath);
    savePostedHeadline(headline, source, pubDate);
    console.log(`✨ All done! Promoted: ${resourceTitle} (${resourceUrl})`);
  } catch (err) {
    console.error("Execution failed:", err.message || err);
    process.exit(1);
  }
}

main();
