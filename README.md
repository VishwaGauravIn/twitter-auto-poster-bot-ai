# Automate your Twitter / X account to post tweets regularly using the power of AI

Everyone wants to become an influencer or at least be active on social media nowadays, but we know it's not easy to plan, create, schedule, and post content every day. It's a headache for most people, and many don't even start their journey to becoming an influencer because of these hurdles. But don't worry, you can use this repository to automate your Twitter/X account so that you only need to set it up once, and it will work every day without any intervention. You won't even need to think about content or scheduling. I have tried to write a beginner-friendly and easy to understand blog:

### [Check it out to understand how to set it up](https://blog.itsvg.in/ultimate-guide-to-automating-twitterx-posts-with-ai)
[![GPT](https://github.com/VishwaGauravIn/twitter-auto-poster-bot-ai/assets/81325730/d84e72dd-2a1c-4ab9-be21-280920745163)](https://blog.itsvg.in/ultimate-guide-to-automating-twitterx-posts-with-ai)

## Current API settings

Edit `SECRETS.js` before running the bot:

- `APP_KEY` and `APP_SECRET` are the OAuth 1.0a consumer key and secret.
- `ACCESS_TOKEN` and `ACCESS_SECRET` are the OAuth 1.0a user access token and secret.
- `GEMINI_API_KEY` comes from Google AI Studio.
- `GEMINI_MODEL` defaults to the stable `gemini-3.6-flash` model.

The default posting client uses OAuth 1.0a user context. OAuth 2.0 client
credentials are not interchangeable with these values.

Never commit real credentials to a public fork.
