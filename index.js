// By VishwaGauravIn (https://itsvg.in)
// Updated for @EPFOCompliance — Live EPFO News, Circulars & Compliance Advisories
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

const twitterClient = new TwitterApi({
  appKey: APP_KEY,
  appSecret: APP_SECRET,
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_SECRET,
});

const genAI = new GenAI.GoogleGenerativeAI(GEMINI_API_KEY);

async function fetchLatestEpfoNews() {
  console.log("📰 Fetching latest published EPFO news & blogs...");
  try {
    const res = await fetch(
      "https://news.google.com/rss/search?q=EPFO+when:2d&hl=en-IN&gl=IN&ceid=IN:en",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const xml = await res.text();
    const itemMatches = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>/g)].map(
      (m) => m[1].replace(/ - .*$/, "").trim()
    );
    const headlines = itemMatches.filter((h) => h && !h.includes("Google News"));
    return headlines;
  } catch (err) {
    console.warn("⚠️ RSS fetch failed, using fallback:", err.message);
    return [];
  }
}

async function sendTweet(tweetText) {
  try {
    const res = await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully! Tweet ID:", res.data.id);
  } catch (error) {
    console.error("Error sending tweet to Twitter:");
    if (error.data) {
      console.error(JSON.stringify(error.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    throw error;
  }
}

async function run() {
  const headlines = await fetchLatestEpfoNews();
  const headline =
    headlines.length > 0
      ? headlines[0]
      : "EPFO compliance updates: Joint Declaration SOP and e-Nomination mandatory for EDLI";

  console.log(`✨ Selected news: "${headline}"`);
  console.log("🤖 Generating EPFO compliance tweet via Gemini AI...");

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { maxOutputTokens: 300 },
  });

  const prompt = `You are @EPFOCompliance, the leading authority on EPFO (Employees' Provident Fund Organisation) rules, circulars, and compliance updates in India.

Context / Latest News: "${headline}"

Write a timely, authoritative compliance advisory tweet for PF members, HR professionals, and employers.
Rules:
1. Under 230 characters strictly.
2. Actionable advice: Highlight the rule, deadline, or member benefit (e.g., ECR deadline, KYC seeding, UAN link, Form 31/19, Joint Declaration).
3. Plain text only. Include 2-3 focused hashtags: #EPFO #EPF #PFCompliance #UAN.
4. No quotes or markdown fences.`;

  const result = await model.generateContent(prompt);
  const text = (await result.response).text().trim().replace(/^["']|["']$/g, "");
  console.log("\n--- Generated Tweet Content ---\n" + text + "\n-------------------------------\n");

  console.log("Posting tweet to Twitter...");
  await sendTweet(text);
}

run().catch((error) => {
  console.error("\nExecution stopped with error:", error.message || error);
  process.exit(1);
});
