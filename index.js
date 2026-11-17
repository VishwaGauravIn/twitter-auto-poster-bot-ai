// By VishwaGauravIn (https://itsvg.in)
// Updated for @EPFOCompliance — Live 3-Part EPFO Compliance Threads
// Automatically matches and promotes https://corporatecompliance.in blogs and tools with step-by-step solutions and high-res image cards.

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

async function sendThread(thread, imagePath = null) {
  try {
    let mediaId = null;
    if (imagePath && fs.existsSync(imagePath)) {
      console.log("📸 Uploading image to Twitter media endpoint...");
      mediaId = await twitterClient.v1.uploadMedia(imagePath);
      console.log("✅ Image uploaded. Media ID:", mediaId);
    }

    // Tweet 1 (Hook + Image)
    const tweet1Res = await twitterClient.v2.tweet({
      text: thread[0],
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    });
    console.log(`🎉 Tweet 1/${thread.length} posted! ID:`, tweet1Res.data.id);

    // Chained tweets (Tweet 2 through N)
    let previousId = tweet1Res.data.id;
    for (let i = 1; i < thread.length; i++) {
      const res = await twitterClient.v2.tweet({
        text: thread[i],
        reply: { in_reply_to_tweet_id: previousId },
      });
      console.log(`🎉 Tweet ${i + 1}/${thread.length} posted! ID:`, res.data.id);
      previousId = res.data.id;
    }
  } catch (error) {
    console.error("Error sending thread to Twitter API:");
    if (error.data) {
      console.error(JSON.stringify(error.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    throw error;
  }
}

async function run() {
  const { thread, tweetText, insight, headline, source, pubDate, resourceTitle, resourceUrl } = await generateEpfoTweet(genAI);

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

  console.log("Posting complete 3-part thread to Twitter API...");
  await sendThread(thread, imagePath);
  savePostedHeadline(headline, source, pubDate);
  console.log(`✨ All done! Promoted: ${resourceTitle} (${resourceUrl})`);
}

run().catch((error) => {
  console.error("\nExecution stopped with error:", error.message || error);
  process.exit(1);
});
