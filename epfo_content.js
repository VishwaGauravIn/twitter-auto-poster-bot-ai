// epfo_content.js — Unified EPFO News Fetcher, Search Analytics Ranker & Twitter Thread Generator
// Dedicated to promoting https://corporatecompliance.in tools and blogs on @EPFOCompliance.
// Generates detailed 3-part threads with actionable step-by-step solutions and exact blog links.

const fs = require("fs");
const path = require("path");
const {
  syncCorporateResources,
  matchCorporateResource,
  CURATED_RESOURCES,
  FALLBACK_RESOURCES
} = require("./corporate_catalog");

const HISTORY_FILE = path.join(__dirname, "posted_articles.json");

// Exported alias for compatibility
const CORPORATE_RESOURCES = CURATED_RESOURCES;
// Google Search Analytics & Impression Weights for EPFO Topics
const HIGH_SEARCH_INTENT_MAP = [
  { regex: /\b(balance|passbook|whatsapp|sms)\b/i, score: 35, tag: "Passbook/Balance" },
  { regex: /\b(withdraw|withdrawal|auto-claim|advance|form 31|form 19|settlement|limit)\b/i, score: 35, tag: "Withdrawal/Claims" },
  { regex: /\b(interest|interest rate|credited|credit)\b/i, score: 30, tag: "Interest Rate" },
  { regex: /\b(pension|eps-?95|higher pension)\b/i, score: 30, tag: "Pension" },
  { regex: /\b(wage ceiling|15,?000|21,?000)\b/i, score: 25, tag: "Wage Ceiling" },
  { regex: /\b(edli|insurance|e-nomination|nominee|7 lakh)\b/i, score: 25, tag: "EDLI/Insurance" },
  { regex: /\b(reject|rejection|claim rejected)\b/i, score: 25, tag: "Claim Rejection" },
  { regex: /\b(joint declaration|sop|date of exit|overlap|profile correction)\b/i, score: 20, tag: "SOP/Joint Declaration" },
  { regex: /\b(ecr|vishwas|damages|14b|7q|challan)\b/i, score: 20, tag: "ECR/Compliance" }
];

const NEGATIVE_INTENT_MAP = [
  { regex: /\b(quiz|celebrate|celebrates|foundation day|cricket|sports|hockey|awareness camp|webinar|seminar|meeting held)\b/i, penalty: 30 }
];

const TIER1_SOURCES = [
  "economic times", "livemint", "financial express", "business standard",
  "times of india", "ndtv", "hindu", "indian express", "moneycontrol", "cnbc", "pib"
];

function scoreArticle(article) {
  let score = 0;
  const matchedTags = [];

  for (const intent of HIGH_SEARCH_INTENT_MAP) {
    if (intent.regex.test(article.title)) {
      score += intent.score;
      matchedTags.push(intent.tag);
    }
  }

  for (const neg of NEGATIVE_INTENT_MAP) {
    if (neg.regex.test(article.title)) {
      score -= neg.penalty;
    }
  }

  const isTier1 = TIER1_SOURCES.some((s) => article.source.toLowerCase().includes(s));
  if (isTier1) score += 15;

  const recencyBonus = Math.round(((30 - article.daysAgo) / 30) * 10);
  score += Math.max(0, recencyBonus);

  return { ...article, score, matchedTags, isTier1 };
}

async function fetchTopImpressionEpfoNews() {
  console.log("📰 Fetching published EPFO news from the past 30 days (Google Search Analytics)...");

  const rssQueries = [
    "https://news.google.com/rss/search?q=EPFO+when:30d&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=EPF+withdrawal+OR+pension+OR+passbook+when:30d&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=EPFO+circular+OR+guidelines+OR+%22wage+ceiling%22+when:30d&hl=en-IN&gl=IN&ceid=IN:en"
  ];

  const allArticles = new Map();

  for (const queryUrl of rssQueries) {
    try {
      const res = await fetch(queryUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/g)];

      for (const m of items) {
        const rawTitle = m[1];
        const pubDateStr = m[2];
        const source = m[3] || "News";
        const cleanTitle = rawTitle.replace(/ - [^-]+$/, "").trim();
        const pubDate = new Date(pubDateStr);
        const ageMs = Date.now() - pubDate.getTime();
        const daysAgo = Math.max(0, ageMs / (1000 * 60 * 60 * 24));

        if (daysAgo <= 30 && !allArticles.has(cleanTitle)) {
          allArticles.set(cleanTitle, {
            title: cleanTitle,
            rawTitle,
            source,
            pubDate: pubDate.toISOString(),
            daysAgo: Math.round(daysAgo * 10) / 10
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ RSS fetch warning:", err.message);
    }
  }

  console.log(`Found ${allArticles.size} unique EPFO articles published within the last 30 days.`);
  return Array.from(allArticles.values());
}

function getPostedHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch (_) {}
  return [];
}

function savePostedHeadline(headline, source = "", pubDate = "") {
  try {
    const history = getPostedHistory();
    history.push({ headline, source, pubDate, postedAt: new Date().toISOString() });
    const trimmed = history.slice(-100);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch (err) {
    console.warn("Could not save history:", err.message);
  }
}

// Generate an authoritative 3-part Twitter Thread with exact solution and blog link
async function generateEpfoTweet(genAI) {
  const articles = await fetchTopImpressionEpfoNews();
  const history = getPostedHistory();
  const postedSet = new Set(history.map((h) => h.headline.toLowerCase().trim()));

  const scoredArticles = articles
    .map(scoreArticle)
    .filter((a) => !postedSet.has(a.title.toLowerCase().trim()))
    .sort((a, b) => b.score - a.score);

  console.log(`📊 Filtered to ${scoredArticles.length} unposted candidate stories.`);

  const topCandidates = scoredArticles.slice(0, 5);

  let selectedHeadline = "";
  let selectedSource = "";
  let selectedPubDate = "";

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 600,
      responseMimeType: "application/json"
    },
  });

  if (topCandidates.length > 0) {
    console.log("\n--- Top High-Impression Candidates (Past 30 Days) ---");
    topCandidates.forEach((c, idx) => {
      console.log(`[#${idx + 1}] Score: ${c.score} | ${c.daysAgo}d ago | ${c.source} | ${c.title}`);
    });

    const candidatesPayload = topCandidates.map((c, idx) => ({
      index: idx + 1,
      title: c.title,
      source: c.source,
      daysAgo: c.daysAgo,
      score: c.score,
      topics: c.matchedTags
    }));

    const editorPrompt = `You are the Senior SEO & Search Analytics Editor for @EPFOCompliance.
Analyze these top candidate EPFO news stories published within the past 30 days:
${JSON.stringify(candidatesPayload, null, 2)}

Task: Select the single story with the HIGHEST public search impression demand in India today.
Return JSON: { "selectedIndex": <number>, "selectedHeadline": "<title>" }`;

    try {
      console.log("🤖 Gemini AI selecting top search impression candidate...");
      const result = await model.generateContent(editorPrompt);
      const parsed = JSON.parse((await result.response).text());

      const chosenCandidate = topCandidates.find((c, idx) => idx + 1 === parsed.selectedIndex) || topCandidates[0];
      selectedHeadline = chosenCandidate.title;
      selectedSource = chosenCandidate.source;
      selectedPubDate = chosenCandidate.pubDate;
      console.log(`🎯 AI Selected: [Score: ${chosenCandidate.score}] ${selectedHeadline}`);
    } catch (parseErr) {
      console.warn("⚠️ AI selection fallback to top candidate:", parseErr.message);
      const topOne = topCandidates[0];
      selectedHeadline = topOne.title;
      selectedSource = topOne.source;
      selectedPubDate = topOne.pubDate;
    }
  }

  // Fallback topic if no unposted RSS stories available
  if (!selectedHeadline) {
    selectedHeadline = "EPFO brings PF balance, passbook and transaction details to WhatsApp: What subscribers can access";
    selectedSource = "The Times of India";
    selectedPubDate = new Date().toISOString();
  }

  // Dynamically synchronize live website resources from corporatecompliance.in
  const liveResources = await syncCorporateResources();

  // Match the exact tool or blog from corporatecompliance.in
  const resource = matchCorporateResource(selectedHeadline, liveResources);
  console.log(`🔗 Matched Resource: ${resource.title} (${resource.url})`);

  // Prompt Gemini to craft the complete 3-part Thread
  const threadPrompt = `You are @EPFOCompliance, the leading authority on EPFO rules and statutory compliance in India.
Write an authoritative, high-engagement 3-part Twitter/X THREAD about this development:

News Headline: "${selectedHeadline}"
Source: "${selectedSource}"
Topic Facts / Solution from our website guide: "${resource.solutionFacts}"

CRITICAL RULES FOR EACH TWEET:
1. TWEET 1 (Hook & Alert):
   - Crisp announcement of the news and what it means for PF members/employers.
   - End with: "Thread 👇 (1/3)"
   - STRICT LENGTH: Under 220 characters. NO links or hashtags.

2. TWEET 2 (The Step-by-Step Solution / How-To):
   - Provide the EXACT ACTIONABLE SOLUTION / STEPS based on the Topic Facts.
   - Mention the specific phone number, forms, or procedure (e.g. save +91 8796441800, send 'Hi' from registered mobile).
   - End with: "(2/3)"
   - STRICT LENGTH: Under 250 characters. NO links or hashtags.

3. TWEET 3 (Key Caution & Blog Link):
   - Mention key caveats, limits, or scam warnings (e.g. read-only service, auto-settlement limited to ₹1,000, beware of fake numbers).
   - Direct Call-to-Action with link: "${resource.cta} ${resource.url}"
   - End with: "#EPFO #PFCompliance (3/3)"
   - STRICT LENGTH: Under 260 characters (the URL automatically counts as 23 characters).

4. CARD INSIGHT:
   - One crisp sentence (under 115 characters) summarizing the key rule for the high-res infographic card.

Return JSON in this exact schema:
{
  "tweet1": "<tweet 1 text>",
  "tweet2": "<tweet 2 text>",
  "tweet3": "<tweet 3 text>",
  "cardInsight": "<one sentence summary under 115 chars>"
}`;

  console.log("🧵 Generating 3-part solution thread via Gemini AI...");
  const threadResult = await model.generateContent(threadPrompt);
  const threadData = JSON.parse((await threadResult.response).text());

  const tweet1 = (threadData.tweet1 || "").trim();
  const tweet2 = (threadData.tweet2 || "").trim();
  const tweet3 = (threadData.tweet3 || "").trim();
  const cardInsight = (threadData.cardInsight || tweet1.slice(0, 110)).trim();

  const thread = [tweet1, tweet2, tweet3];

  console.log("\n==================== 3-PART THREAD TO POST ====================");
  console.log(`[Tweet 1/3 - Image Card Attached] (${tweet1.length} chars):\n${tweet1}\n`);
  console.log(`[Tweet 2/3 - Actionable Solution] (${tweet2.length} chars):\n${tweet2}\n`);
  console.log(`[Tweet 3/3 - Caveat & Blog Link] (${tweet3.length} chars):\n${tweet3}`);
  console.log("===============================================================\n");

  return {
    thread,
    tweetText: tweet1, // Primary tweet for card/legacy callers
    insight: cardInsight,
    headline: selectedHeadline,
    source: selectedSource,
    pubDate: selectedPubDate,
    resourceUrl: resource.url,
    resourceTitle: resource.title,
  };
}

module.exports = {
  CORPORATE_RESOURCES,
  FALLBACK_RESOURCES,
  HIGH_SEARCH_INTENT_MAP,
  syncCorporateResources,
  matchCorporateResource,
  scoreArticle,
  fetchTopImpressionEpfoNews,
  getPostedHistory,
  savePostedHeadline,
  generateEpfoTweet,
};
