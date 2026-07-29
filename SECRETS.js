//? It is advisable to use environment variables instead of directly putting secrets in repository file but I have skipped this part as it would become complicated for many.
//? Alternatively you can download the repository instead or forking and upload it from your account and keep it private, in that way, your secrets will not be exposed to the public.

const APP_KEY = "YOUR_TWITTER_APP_KEY";
const APP_SECRET = "YOUR_TWITTER_APP_SECRET";
const ACCESS_TOKEN = "YOUR_TWITTER_ACCESS_TOKEN";
const ACCESS_SECRET = "YOUR_TWITTER_ACCESS_SECRET";
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_MODEL = "gemini-3.6-flash";
const TWITTER_BACKEND = "twitter-api-v2";
const XQUIK_API_KEY = "YOUR_XQUIK_API_KEY";
const XQUIK_ACCOUNT = "YOUR_XQUIK_ACCOUNT";

const SECRETS = {
  APP_KEY,
  APP_SECRET,
  ACCESS_TOKEN,
  ACCESS_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  TWITTER_BACKEND,
  XQUIK_API_KEY,
  XQUIK_ACCOUNT,
};

module.exports = SECRETS;
