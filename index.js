// By VishwaGauravIn (https://itsvg.in)
// Updated for @EPFOCompliance — Live EPFO News & Compliance Advisories
// Automatically matches and promotes https://corporatecompliance.in tools and blogs with high-res branded image cards.

require("dotenv").config();
const fs = require("fs");
const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const { generateEpfoTweet, savePostedHeadline } = require("./epfo_content");
const { generateTweetImage } = require("./image_generator");

// Load credentials from environment variables or SECRETS.js fallback
let fileSecrets = {};
try {
  fileSecrets = require("./SECRETS");
} catch (e) {
  // SECRETS.js is optional if environment variables are set
}

const APP_KEY = process.env.APP_KEY || fileSecrets.APP_KEY;
const APP_SECRET = process.env.APP_SECRET || fileSecrets.APP_SECRET;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || fileSecrets.ACCESS_TOKEN;
const ACCESS_SECRET = process.env.ACCESS_SECRET || fileSecrets.ACCESS_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || fileSecrets.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set. Please provide it in .env or GitHub Secrets.");
  process.exit(1);
}

const twitterClient = new TwitterApi({
  appKey: APP_KEY,
  appSecret: APP_SECRET,
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_SECRET,
});

const genAI = new GenAI.GoogleGenerativeAI(GEMINI_API_KEY);

async function sendTweet(tweetText, imagePath = null) {
  try {
    let mediaId = null;
    if (imagePath && fs.existsSync(imagePath)) {
      console.log("📸 Uploading image to Twitter media endpoint...");
      mediaId = await twitterClient.v1.uploadMedia(imagePath);
      console.log("✅ Image uploaded. Media ID:", mediaId);
    }

    const payload = { text: tweetText };
    if (mediaId) {
      payload.media = { media_ids: [mediaId] };
    }

    const res = await twitterClient.v2.tweet(payload);
    console.log("🎉 Tweet sent successfully via Twitter API! Tweet ID:", res.data.id);
  } catch (error) {
    console.error("Error sending tweet to Twitter API:");
    if (error.data) {
      console.error(JSON.stringify(error.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    throw error;
  }
}

async function run() {
  const { tweetText, headline, source, pubDate, resourceTitle, resourceUrl } = await generateEpfoTweet(genAI);

  const insight = tweetText.split("\n\n")[0] || headline;

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

  console.log("Posting tweet with image to Twitter API...");
  await sendTweet(tweetText, imagePath);
  savePostedHeadline(headline, source, pubDate);
  console.log(`✨ All done! Promoted: ${resourceTitle} (${resourceUrl})`);
}

run().catch((error) => {
  console.error("\nExecution stopped with error:", error.message || error);
  process.exit(1);
});
