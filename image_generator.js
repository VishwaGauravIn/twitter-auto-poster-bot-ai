// image_generator.js — Generates high-res, branded Twitter news & compliance cards (1200x675)
// Dedicated to @EPFOCompliance promoting https://corporatecompliance.in

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function generateTweetImage({ headline, insight, resourceTitle, resourceUrl, source, pubDate }) {
  const outputPath = path.join(__dirname, "generated_tweet_image.png");
  console.log("🎨 Rendering high-res compliance news card for Twitter...");

  const formattedDate = pubDate
    ? new Date(pubDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const safeHeadline = escapeHtml(headline);
  const safeInsight = escapeHtml(insight);
  const safeTitle = escapeHtml(resourceTitle || "Statutory Calculators");
  const safeSource = escapeHtml(source || "Official Circular");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 675px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 10% 20%, #132742 0%, #0a1120 90%);
      color: #ffffff;
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }
    .bg-grid {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: 1;
    }
    .glow-orb {
      position: absolute;
      top: -80px;
      right: -80px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, transparent 70%);
      border-radius: 50%;
      z-index: 1;
    }
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-epfo {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(37, 99, 235, 0.22);
      border: 1px solid rgba(59, 130, 246, 0.45);
      padding: 8px 18px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #60a5fa;
    }
    .badge-date {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 14px;
      color: #94a3b8;
      font-weight: 500;
    }
    .main-body {
      margin-top: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .headline {
      font-size: 38px;
      line-height: 1.28;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.5px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    .advisory-box {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border-left: 5px solid #f59e0b;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .advisory-icon {
      font-size: 28px;
      flex-shrink: 0;
    }
    .advisory-text {
      font-size: 20px;
      font-weight: 500;
      color: #e2e8f0;
      line-height: 1.4;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 14px 24px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      background: #2563eb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      color: #ffffff;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.2px;
    }
    .brand-tag {
      font-size: 13px;
      color: #64748b;
      margin-left: 6px;
    }
    .tool-pill {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #000000;
      font-weight: 700;
      font-size: 15px;
      padding: 8px 20px;
      border-radius: 24px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="glow-orb"></div>
  <div class="content">
    <div class="header">
      <div class="badge-epfo">
        <span>⚖️</span>
        <span>EPFO Compliance Alert</span>
      </div>
      <div class="badge-date">
        <span>${safeSource} • ${formattedDate}</span>
      </div>
    </div>

    <div class="main-body">
      <div class="headline">${safeHeadline}</div>
      <div class="advisory-box">
        <div class="advisory-icon">💡</div>
        <div class="advisory-text">${safeInsight}</div>
      </div>
    </div>

    <div class="footer">
      <div class="brand-left">
        <div class="brand-logo">CC</div>
        <div>
          <span class="brand-name">corporatecompliance.in</span>
          <span class="brand-tag">| Statutory Tools</span>
        </div>
      </div>
      <div class="tool-pill">
        <span>${safeTitle}</span>
        <span>→</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Launch browser (try msedge channel first, fallback to default chromium)
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  } catch (_) {
    browser = await chromium.launch({ headless: true });
  }

  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 675 },
      deviceScaleFactor: 2, // 2x deviceScaleFactor yields crystal-clear 2400x1350 output
    });

    await page.setContent(htmlContent, { waitUntil: "load" });
    await page.waitForTimeout(500); // ensure font rendering settles
    await page.screenshot({ path: outputPath, type: "png" });
    console.log(`✅ Tweet card rendered successfully: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateTweetImage,
};
