const GenAI = require("@google/generative-ai");
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

const genAI = new GenAI.GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

async function run() {
  try {
    // Model generowania treści
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
    });

    const prompt =
      "Stwórz chwytliwe i krótkie zdanie promujące Discorda dla maturzystów. Skup się na zachęceniu do dołączenia, podkreślając dostęp do materiałów, przecieków arkuszy i wsparcia przed maturą. Dodaj link: https://discord.gg/NKtRwQDp.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Domyślne hashtagi (opcjonalnie możesz pobrać dynamicznie)
    const popularHashtags = ["#Matura2025", "#Fifa", "#Matematyka", "#LGBT", "#Debata", "#Przecieki"];
    const hashtags = popularHashtags.join(" ");

    // Tworzenie tweeta
    let tweetText = `${text}\n\n${hashtags}`;

    // Sprawdzanie długości tweeta
    if (tweetText.length > 280) {
      tweetText = `${text.substring(0, 280 - hashtags.length - 3)}...\n\n${hashtags}`;
    }

    console.log(tweetText);
    await sendTweet(tweetText);
  } catch (error) {
    console.error("Error in run function:", error);
  }
}

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}

run();

