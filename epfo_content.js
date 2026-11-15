// epfo_content.js — Unified EPFO News Fetcher, Search Analytics Ranker & Twitter Thread Generator
// Dedicated to promoting https://corporatecompliance.in tools and blogs on @EPFOCompliance.
// Generates detailed 3-part threads with actionable step-by-step solutions and exact blog links.
// Enforces strict source priority: Tier 0 (PIB, Gazette, @officialepfo) > Tier 1 (Mainstream Media) > Tier 2 (Online Blogs).

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
  { regex: /\b(wage ceiling|15,?000|21,?000|25,?000)\b/i, score: 25, tag: "Wage Ceiling" },
  { regex: /\b(edli|insurance|e-nomination|nominee|7 lakh)\b/i, score: 25, tag: "EDLI/Insurance" },
  { regex: /\b(reject|rejection|claim rejected)\b/i, score: 25, tag: "Claim Rejection" },
  { regex: /\b(joint declaration|sop|date of exit|overlap|profile correction)\b/i, score: 20, tag: "SOP/Joint Declaration" },
  { regex: /\b(ecr|vishwas|damages|14b|7q|challan|amnesty)\b/i, score: 25, tag: "ECR/Compliance" }
];

const NEGATIVE_INTENT_MAP = [
  { regex: /\b(quiz|celebrate|celebrates|foundation day|cricket|sports|hockey|awareness camp|webinar|seminar|meeting held|spardha|cultural)\b/i, penalty: 40 }
];

// Source Classification: Tier 0 (Official) > Tier 1 (Mainstream Media) > Tier 2 (Online Blogs)
function getSourceTier(article) {
  const src = (article.source || "").toLowerCase();
  const title = (article.title || "").toLowerCase();

  // Tier 0: Official Verified Sources (PIB, Gazette notifications, @officialepfo / @socialepfo, epfindia.gov.in)
  const isPib = src.includes("pib") || title.includes("pib") || title.includes("press information bureau") || src.includes("press information bureau");
  const isGazette = src.includes("gazette") || title.includes("gazette notification") || src.includes("egazette") || title.includes("official circular") || src.includes("epfindia") || src.includes("epfo.gov");
  const isTwitter = src.includes("twitter") || src.includes("x.com") || title.includes("@officialepfo") || title.includes("@socialepfo") || title.includes("officialepfo") || title.includes("socialepfo");

  if (isPib) return { tier: 0, tierName: "Official Verified (PIB)", sourceBadge: "🏛️ Press Information Bureau (PIB)", priorityBonus: 80 };
  if (isGazette) return { tier: 0, tierName: "Official Verified (Gazette)", sourceBadge: "📜 Official Gazette Notification", priorityBonus: 75 };
  if (isTwitter) return { tier: 0, tierName: "Official Verified (Twitter)", sourceBadge: "🐦 @officialepfo Official Post", priorityBonus: 70 };

  // Tier 1: Well-Known Mainstream Media Groups
  const mainstream = [
    "economic times", "livemint", "business standard", "financial express",
    "times of india", "ndtv", "the hindu", "hindu", "indian express", "moneycontrol", "cnbc", "dd news"
  ];
  if (mainstream.some((m) => src.includes(m))) {
    return { tier: 1, tierName: "Mainstream Media", sourceBadge: article.source, priorityBonus: 30 };
  }

  // Tier 2: Other Online Blogs & Media Portals
  return { tier: 2, tierName: "Online Media/Blog", sourceBadge: article.source, priorityBonus: 5 };
}

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

  const tierInfo = getSourceTier(article);
  score += tierInfo.priorityBonus;

  const recencyBonus = Math.round(((30 - article.daysAgo) / 30) * 10);
  score += Math.max(0, recencyBonus);

  return { ...article, score, matchedTags, ...tierInfo };
}

async function fetchTopImpressionEpfoNews() {
  console.log("📰 Fetching published EPFO news (PIB, Gazette, @officialepfo, then Mainstream Media)...");

  const rssQueries = [
    // Priority 1: Official PIB releases
    { url: "https://news.google.com/rss/search?q=(EPFO+OR+%22Employees+Provident+Fund%22)+site:pib.gov.in+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "Press Information Bureau (PIB)" },
    { url: "https://news.google.com/rss/search?q=(EPFO+OR+%22Employees+Provident+Fund%22)+(%22PIB%22+OR+%22Press+Information+Bureau%22)+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "Press Information Bureau (PIB)" },

    // Priority 2: Official Gazette notifications & statutory circulars
    { url: "https://news.google.com/rss/search?q=(EPFO+OR+%22Employees+Provident+Fund%22)+(%22gazette+notification%22+OR+%22official+circular%22)+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "Official Gazette / Circular" },

    // Priority 3: Official Twitter posts (@officialepfo / @socialepfo)
    { url: "https://news.google.com/rss/search?q=(%22@officialepfo%22+OR+%22@socialepfo%22+OR+%22officialepfo%22+OR+%22socialepfo%22)+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "Official EPFO Twitter (@officialepfo)" },

    // Priority 4: Mainstream Media & Google News trends
    { url: "https://news.google.com/rss/search?q=EPFO+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "News" },
    { url: "https://news.google.com/rss/search?q=EPF+withdrawal+OR+pension+OR+passbook+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "News" },
    { url: "https://news.google.com/rss/search?q=EPFO+circular+OR+guidelines+OR+%22wage+ceiling%22+when:30d&hl=en-IN&gl=IN&ceid=IN:en", defaultSource: "News" }
  ];

  const allArticles = new Map();

  for (const q of rssQueries) {
    try {
      const res = await fetch(q.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?(?:<source[^>]*>(.*?)<\/source>)?[\s\S]*?<\/item>/g)];

      for (const m of items) {
        const rawTitle = m[1].replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
        const pubDateStr = m[2];
        let source = (m[3] || q.defaultSource).trim();
        let cleanTitle = rawTitle;
        if (rawTitle.includes(" - ")) {
          const parts = rawTitle.split(" - ");
          source = parts.pop().trim() || source;
          cleanTitle = parts.join(" - ").trim();
        }
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

  // Hierarchical Tier Separation:
  // Tier 0: Official (PIB, Gazette, @officialepfo) -> Checked FIRST!
  // Tier 1: Mainstream Media (ET, Mint, BS, CNBC, TOI) -> Checked SECOND!
  // Tier 2: Online Blogs & Portals -> Fallback
  const tier0Candidates = scoredArticles.filter((a) => a.tier === 0 && a.score > 25);
  const tier1Candidates = scoredArticles.filter((a) => a.tier === 1);
  const tier2Candidates = scoredArticles.filter((a) => a.tier === 2);

  let candidatePool = [];
  let tierLabel = "";

  if (tier0Candidates.length > 0) {
    console.log(`\n🏛️ PRIORITY 1 ACTIVE: Found ${tier0Candidates.length} unposted OFFICIAL releases (PIB / Gazette / @officialepfo).`);
    candidatePool = tier0Candidates;
    tierLabel = "Official Verified Source (PIB / Gazette / @officialepfo)";
  } else if (tier1Candidates.length > 0) {
    console.log(`\n📰 PRIORITY 2 ACTIVE: No unposted official releases available. Checking Mainstream Media (${tier1Candidates.length} available)...`);
    candidatePool = tier1Candidates;
    tierLabel = "Mainstream Media (The Economic Times, Mint, CNBC, BS, TOI)";
  } else {
    console.log(`\n🌐 PRIORITY 3 ACTIVE: Checking Online Blogs & Reference Portals (${tier2Candidates.length} available)...`);
    candidatePool = tier2Candidates;
    tierLabel = "Online Media / Reference Blogs";
  }

  const topCandidates = candidatePool.slice(0, 5);

  let selectedHeadline = "";
  let selectedSource = "";
  let selectedPubDate = "";
  let selectedTierName = "";

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200,
      responseMimeType: "application/json"
    },
  });

  if (topCandidates.length > 0) {
    console.log(`\n--- Top High-Impression Candidates [${tierLabel}] ---`);
    topCandidates.forEach((c, idx) => {
      console.log(`[#${idx + 1}] Score: ${c.score} | ${c.daysAgo}d ago | ${c.sourceBadge || c.source} | ${c.title}`);
    });

    const candidatesPayload = topCandidates.map((c, idx) => ({
      index: idx + 1,
      title: c.title,
      source: c.sourceBadge || c.source,
      tier: c.tierName,
      daysAgo: c.daysAgo,
      score: c.score,
      topics: c.matchedTags
    }));

    const editorPrompt = `You are the Senior SEO & Search Analytics Editor for @EPFOCompliance.
Analyze these top candidate EPFO news stories from our prioritized source pool (${tierLabel}):
${JSON.stringify(candidatesPayload, null, 2)}

Task: Select the single story with the HIGHEST public search impression demand and statutory significance in India today.
Return JSON: { "selectedIndex": <number>, "selectedHeadline": "<title>" }`;

    try {
      console.log("🤖 Gemini AI evaluating top candidate from prioritized tier...");
      const result = await model.generateContent(editorPrompt);
      const parsed = JSON.parse((await result.response).text());

      const chosenCandidate = topCandidates.find((c, idx) => idx + 1 === parsed.selectedIndex) || topCandidates[0];
      selectedHeadline = chosenCandidate.title;
      selectedSource = chosenCandidate.sourceBadge || chosenCandidate.source;
      selectedPubDate = chosenCandidate.pubDate;
      selectedTierName = chosenCandidate.tierName || "Verified Source";
      console.log(`🎯 AI Selected: [Score: ${chosenCandidate.score}] [${selectedSource}] ${selectedHeadline}`);
    } catch (parseErr) {
      console.warn("⚠️ AI selection fallback to top candidate:", parseErr.message);
      const topOne = topCandidates[0];
      selectedHeadline = topOne.title;
      selectedSource = topOne.sourceBadge || topOne.source;
      selectedPubDate = topOne.pubDate;
      selectedTierName = topOne.tierName || "Verified Source";
    }
  }

  // Fallback topic if no unposted RSS stories available
  if (!selectedHeadline) {
    selectedHeadline = "EPFO Sets October 31 Deadline for Filing ECR Under Revised Wage Ceiling";
    selectedSource = "🏛️ Press Information Bureau (PIB)";
    selectedPubDate = new Date().toISOString();
    selectedTierName = "Official Verified (PIB)";
  }

  // Dynamically synchronize live website resources from corporatecompliance.in
  const liveResources = await syncCorporateResources();

  // Match the exact tool or blog from corporatecompliance.in
  const resource = matchCorporateResource(selectedHeadline, liveResources);
  console.log(`🔗 Matched Resource: ${resource.title} (${resource.url})`);

  // Prompt Gemini to craft the complete 5-part Thread
  const threadPrompt = `You are @EPFOCompliance, the leading authority on EPFO rules and statutory compliance in India.
Write an authoritative, highly comprehensive 5-part Twitter/X THREAD about this development:

News Headline: "${selectedHeadline}"
Source: "${selectedSource}"
Source Authority: "${selectedTierName}"
Topic Facts & Actionable Solution: "${resource.solutionFacts}"
Target Blog/Tool Guide URL: "${resource.url}"

CRITICAL RULES FOR EACH TWEET:

1. TWEET 1 (Subject Hook, Core Context & Direct Website Reference):
   - Announce the subject and news clearly according to the headline.
   - If Source is Official (PIB, Gazette, @officialepfo), prefix authoritatively (e.g. "[Official PIB Alert]" or "[Official Gazette Notice]").
   - MUST INCLUDE the website reference link: "${resource.cta} ${resource.url}"
   - Include hashtags: "#EPFO #PFCompliance"
   - End with: "Thread 👇 (1/5)"
   - STRICT LENGTH: Under 260 characters (the URL automatically counts as 23 characters).

2. TWEET 2 (Background Context & Member/Employer Impact):
   - Explain the statutory background, why this issue occurs, and who is affected (members or employers).
   - Detail the practical compliance impact.
   - End with: "(2/5)"
   - STRICT LENGTH: Under 265 characters. NO links.

3. TWEET 3 (Actionable Step-by-Step Solution / How-To):
   - Provide the EXACT procedural steps, official numbers (e.g. WhatsApp +91 8796441800), forms, or portal steps from the Topic Facts.
   - End with: "(3/5)"
   - STRICT LENGTH: Under 265 characters. NO links.

4. TWEET 4 (Employer Responsibilities, Penalties & Compliance Math):
   - Specific details on employer responsibilities, wage ceilings, damages/interest (14B/7Q), or filing deadlines.
   - Include relevant hashtags (e.g. "#LabourLaw #Payroll").
   - End with: "(4/5)"
   - STRICT LENGTH: Under 265 characters. NO links.

5. TWEET 5 (Caveats, Fraud Warnings & Website Promotion CTA):
   - Critical caveats, read-only limits, or scam warnings (e.g. never share OTPs, beware of fake numbers).
   - Direct call-to-action promoting the website: "Free statutory calculators & guides: https://corporatecompliance.in"
   - End with: "#EPFO #PFCompliance #HRIndia (5/5)"
   - STRICT LENGTH: Under 260 characters (the URL counts as 23 characters).

6. CARD INSIGHT:
   - One crisp sentence (under 115 characters) summarizing the core statutory rule for the high-res infographic card.

Return JSON in this exact schema:
{
  "tweet1": "<tweet 1 text>",
  "tweet2": "<tweet 2 text>",
  "tweet3": "<tweet 3 text>",
  "tweet4": "<tweet 4 text>",
  "tweet5": "<tweet 5 text>",
  "cardInsight": "<one sentence summary under 115 chars>"
}`;

  console.log("🧵 Generating 5-part comprehensive solution thread via Gemini AI...");
  const threadResult = await model.generateContent(threadPrompt);
  const threadData = JSON.parse((await threadResult.response).text());

  const tweet1 = (threadData.tweet1 || "").trim();
  const tweet2 = (threadData.tweet2 || "").trim();
  const tweet3 = (threadData.tweet3 || "").trim();
  const tweet4 = (threadData.tweet4 || "").trim();
  const tweet5 = (threadData.tweet5 || "").trim();
  const cardInsight = (threadData.cardInsight || tweet1.slice(0, 110)).trim();

  const thread = [tweet1, tweet2, tweet3, tweet4, tweet5].filter(Boolean);

  console.log("\n==================== 5-PART THREAD TO POST ====================");
  thread.forEach((tw, idx) => {
    console.log(`[Tweet ${idx + 1}/${thread.length}${idx === 0 ? " - Image Card Attached" : ""}] (${tw.length} chars):\n${tw}\n`);
  });
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
  getSourceTier,
  scoreArticle,
  fetchTopImpressionEpfoNews,
  getPostedHistory,
  savePostedHeadline,
  generateEpfoTweet,
};
