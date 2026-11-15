// By VishwaGauravIn (https://itsvg.in)
require("dotenv").config();
const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");

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

if (!APP_KEY || !APP_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
  console.error("Error: Twitter credentials are incomplete. Please set APP_KEY, APP_SECRET, ACCESS_TOKEN, and ACCESS_SECRET.");
  process.exit(1);
}

const twitterClient = new TwitterApi({
  appKey: APP_KEY,
  appSecret: APP_SECRET,
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_SECRET,
});

const genAI = new GenAI.GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig = {
  maxOutputTokens: 400,
};

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
    throw error;
  }
}

async function run() {
  // Use gemini-1.5-flash (gemini-pro 1.0 is deprecated)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig,
  });

  // Prompt configuration
  const prompt =
    "generate a recent indian polity today news, advices and question ask on those news; under 280 characters and should be plain text, you can use emojis and trending hastags";

  console.log("Generating tweet content via Gemini AI...");
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log("Generated Tweet:\n", text);

  console.log("Posting tweet to Twitter...");
  await sendTweet(text);
}

run().catch((error) => {
  console.error("Execution failed:", error);
  process.exit(1);
});
