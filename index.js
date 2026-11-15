// By VishwaGauravIn (https://itsvg.in)
// Updated for @EPFOCompliance — Live EPFO News & Compliance Advisories
// Automatically matches and promotes https://corporatecompliance.in tools and blogs.

require("dotenv").config();
const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const { generateEpfoTweet, savePostedHeadline } = require("./epfo_content");

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

async function sendTweet(tweetText) {
  try {
    const res = await twitterClient.v2.tweet(tweetText);
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

  console.log("Posting tweet to Twitter API...");
  await sendTweet(tweetText);
  savePostedHeadline(headline, source, pubDate);
  console.log(`✨ All done! Promoted: ${resourceTitle} (${resourceUrl})`);
}

run().catch((error) => {
  console.error("\nExecution stopped with error:", error.message || error);
  process.exit(1);
});
