// content_engine.js — Universal AI Content & Thread Generator
// Dynamically switches between the specialized EPFO engine and generic niche profiles.

const { getActiveProfile } = require("./config/config_loader");
const { generateEpfoTweet } = require("./epfo_content");

async function generateContent(genAI) {
  const profile = getActiveProfile();

  // If profile is EPFO (default), delegate 100% to the specialized epfo_content engine
  if (profile.id === "epfo") {
    return await generateEpfoTweet(genAI);
  }

  console.log(`🌐 Using Universal Content Engine for niche: [${profile.name}]`);
  
  // Generic Niche Content Pipeline
  const Parser = require("rss-parser");
  const parser = new Parser({ timeout: 10000 });
  const feeds = profile.rssFeeds || [];
  
  let allArticles = [];
  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed && feed.items) {
        allArticles.push(...feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feed.title || profile.name
        })));
      }
    } catch (_) {}
  }

  // Fallback if no feeds configured
  if (allArticles.length === 0) {
    allArticles.push({
      title: `${profile.name}: Latest Industry Trends & Strategic Insights`,
      link: profile.websiteUrl,
      pubDate: new Date().toISOString(),
      source: profile.name
    });
  }

  const selectedArticle = allArticles[0];
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a social media growth expert for ${profile.name} (${profile.accountHandle}).
Write a high-converting, educational 3-part Twitter thread based on this headline:
"${selectedArticle.title}"

Format strictly as JSON array:
[
  "Tweet 1 (Hook + Link + Image tag): Subject hook, core context, link (${profile.websiteUrl}), hashtags (${profile.hashtags.join(" ")}) Thread 👇 (1/3)",
  "Tweet 2 (Actionable Breakdown): Key insights, practical takeaway, steps (2/3)",
  "Tweet 3 (Conclusion & CTA): Summary, call to action, check out ${profile.websiteUrl} (${profile.hashtags.slice(0, 2).join(" ")}) (3/3)"
]`;

  let thread = [];
  try {
    const res = await model.generateContent(prompt);
    const jsonMatch = res.response.text().match(/\\[[\\s\\S]*\\]/);
    if (jsonMatch) {
      thread = JSON.parse(jsonMatch[0]);
    }
  } catch (_) {
    thread = [
      `[${profile.name} Update] ${selectedArticle.title} Read more: ${profile.websiteUrl} ${profile.hashtags.join(" ")} Thread 👇 (1/3)`,
      `Key Takeaways: Exploring what this means for the industry and practical steps forward. (2/3)`,
      `Explore full guides, tools, and updates at ${profile.websiteUrl} ${profile.hashtags.slice(0, 2).join(" ")} (3/3)`
    ];
  }

  return {
    thread,
    tweetText: thread[0],
    insight: selectedArticle.title,
    headline: selectedArticle.title,
    source: selectedArticle.source,
    pubDate: selectedArticle.pubDate,
    resourceTitle: profile.name,
    resourceUrl: profile.websiteUrl,
    profile
  };
}

module.exports = { generateContent };
