// By VishwaGauravIn (https://itsvg.in)

const { GoogleGenAI } = require("@google/genai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 400,
};
const genAI = new GoogleGenAI({ apiKey: SECRETS.GEMINI_API_KEY });

const prompt =
  "generate a web development content, tips and tricks or something new or some rant or some advice as a tweet, it should not be vague and should be unique; under 280 characters and should be plain text, you can use emojis";

async function generateTweet(ai = genAI) {
  const response = await ai.models.generateContent({
    config: generationConfig,
    contents: prompt,
    model: SECRETS.GEMINI_MODEL,
  });
  return response.text;
}

async function run() {
  const text = await generateTweet();
  console.log(text);
  sendTweet(text);
}

if (require.main === module) {
  run();
}

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}

module.exports = {
  generateTweet,
  run,
};
