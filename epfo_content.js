// epfo_content.js — Unified EPFO News Fetcher, Search Analytics Ranker & Tweet Generator
// Dedicated to promoting https://corporatecompliance.in tools and blogs on @EPFOCompliance.
// Filters news up to 30 days old and ranks by Google Search Analytics impression potential.

const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(__dirname, "posted_articles.json");

// Prioritized directory of tools and blog posts on corporatecompliance.in
const CORPORATE_RESOURCES = [
  // 1. Blog: ECR errors / UAN pension issues
  {
    keywords: ["ecr", "ecr error", "uan is not a member", "uan not a member", "return filing", "challan error"],
    title: "ECR Error Fix Guide",
    cta: "Guide to resolve EPFO ECR error:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-uan-not-member-pension-scheme",
  },
  // 2. Blog: VISHWAS scheme / PF Disputes / Damages waiver
  {
    keywords: ["vishwas", "dispute", "damages", "14b", "7q", "penalty waiver", "amnesty", "conciliation", "cgit"],
    title: "EPFO VISHWAS Scheme Guide",
    cta: "EPFO VISHWAS dispute analysis:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-roi-math-cost-benefit-analysis",
  },
  // 3. Blog: Contractors & Principal Employer liability
  {
    keywords: ["contractor", "principal employer", "contract labor", "vendor compliance", "unregistered contractor", "7a inquiry"],
    title: "Contractor PF Liability Guide",
    cta: "Contractor PF liability & compliance guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-unregistered-contractor-principal-employer",
  },
  // 4. Blog: Dual employment / Overlap / Date of exit
  {
    keywords: ["overlap", "dual employment", "exit date", "date of exit", "bgv", "relieving", "two uans"],
    title: "PF Overlap & Exit Fix Guide",
    cta: "Guide to resolve PF overlap & exit dates:",
    url: "https://corporatecompliance.in/blog/epf-overlap-vindictive-employer-bgv-failure-guide",
  },
  // 5. EDLI / Insurance / Nomination / Death claims
  {
    keywords: ["edli", "insurance", "death claim", "nomination", "nominee", "e-nomination", "life cover", "7 lakh", "700000"],
    title: "EDLI Insurance Calculator",
    cta: "Calculate EDLI insurance benefit up to ₹7L:",
    url: "https://corporatecompliance.in/tools/edli-calculator",
  },
  // 6. PF Balance / Passbook / Interest / WhatsApp service
  {
    keywords: ["balance", "passbook", "whatsapp", "sms", "interest rate", "interest credit", "credited", "pf calculator", "growth"],
    title: "EPF Balance & Interest Calculator",
    cta: "Calculate your EPF balance & interest growth:",
    url: "https://corporatecompliance.in/tools/pf-calculator",
  },
  // 7. PF Withdrawal / Advance / Claim Settling
  {
    keywords: ["withdraw", "advance", "claim", "form 31", "form 19", "form 10c", "settlement", "auto-claim", "illness", "marriage", "housing", "construction"],
    title: "PF Withdrawal Calculator",
    cta: "Calculate withdrawal limits & eligibility:",
    url: "https://corporatecompliance.in/tools/pf-withdrawal-calculator",
  },
  // 8. Pension / EPS / Retirement
  {
    keywords: ["pension", "eps", "eps-95", "eps 95", "higher pension", "superannuation", "retirement", "pensioner"],
    title: "EPS Pension Calculator",
    cta: "Estimate your monthly EPS pension:",
    url: "https://corporatecompliance.in/tools/eps-pension-calculator",
  },
  // 9. EPF Contribution / Wage Ceiling / Admin charges
  {
    keywords: ["contribution", "wage ceiling", "15,000", "15000", "salary ceiling", "admin charges", "12%", "basic wages", "inspection charges"],
    title: "EPF Contribution Calculator",
    cta: "Calculate employer & employee PF split:",
    url: "https://corporatecompliance.in/tools/epf-contribution-calculator",
  },
  // 10. Gratuity / Service tenure
  {
    keywords: ["gratuity", "5 years", "service tenure", "gratuity act", "gratuity payout"],
    title: "Gratuity Calculator",
    cta: "Calculate your statutory gratuity:",
    url: "https://corporatecompliance.in/tools/gratuity-calculator",
  },
  // 11. Wiki / Circulars / SOPs / Joint Declaration / Guidelines
  {
    keywords: ["joint declaration", "sop", "kyc", "aadhaar", "uan", "circular", "rule", "guideline", "court"],
    title: "EPFO Statutory Wiki & SOPs",
    cta: "Check EPFO SOPs, rules & guides:",
    url: "https://corporatecompliance.in/tools/wiki",
  },
];

// Fallback resources when no specific keyword matched
const FALLBACK_RESOURCES = [
  {
    title: "Compliance Calculators",
    cta: "Free EPFO compliance calculators:",
    url: "https://corporatecompliance.in/tools",
  },
  {
    title: "Corporate Compliance Solutions",
    cta: "Expert EPFO compliance support:",
    url: "https://corporatecompliance.in",
  },
];

// Match topic to the most relevant tool or blog URL
function matchCorporateResource(text) {
  const lower = (text || "").toLowerCase();
  for (const item of CORPORATE_RESOURCES) {
    if (item.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return item;
    }
  }
  return FALLBACK_RESOURCES[Math.floor(Math.random() * FALLBACK_RESOURCES.length)];
}

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

// Noise penalty for local, ceremonial or low search volume notices
const NEGATIVE_INTENT_MAP = [
  { regex: /\b(quiz|celebrate|celebrates|foundation day|cricket|sports|hockey|awareness camp|webinar|seminar|meeting held)\b/i, penalty: 30 }
];

// Authoritative national publications (gives high impression confidence)
const TIER1_SOURCES = [
  "economic times", "livemint", "financial express", "business standard",
  "times of india", "ndtv", "hindu", "indian express", "moneycontrol", "cnbc", "pib"
];

// Calculate composite Search Impression & Importance Score
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

  // Recency within the 30-day window: up to 10 points
  const recencyBonus = Math.round(((30 - article.daysAgo) / 30) * 10);
  score += Math.max(0, recencyBonus);

  return { ...article, score, matchedTags, isTier1 };
}

// Fetch published EPFO news from up to 30 days ago across multiple high-intent queries
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

        // Strictly enforce 30-day window (up to 1 month late from publish date)
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
      console.warn("⚠️ RSS fetch warning for query:", err.message);
    }
  }

  console.log(`Found ${allArticles.size} unique EPFO articles published within the last 30 days.`);
  return Array.from(allArticles.values());
}

// History tracking to avoid reposting identical news
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

// Clean and truncate text nicely at the last full word
function truncateAtWord(str, maxLen) {
  if (str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(" ");
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub).trim();
}

// Generate an authoritative, high-impression tweet with corporatecompliance.in link
async function generateEpfoTweet(genAI) {
  const articles = await fetchTopImpressionEpfoNews();
  const history = getPostedHistory();
  const postedSet = new Set(history.map((h) => h.headline.toLowerCase().trim()));

  // Score articles by search analytics & filter out already posted ones
  const scoredArticles = articles
    .map(scoreArticle)
    .filter((a) => !postedSet.has(a.title.toLowerCase().trim()))
    .sort((a, b) => b.score - a.score);

  console.log(`📊 Filtered to ${scoredArticles.length} unposted candidate stories.`);

  // Top candidates pool (top 5 highest impression scores)
  const topCandidates = scoredArticles.slice(0, 5);

  let selectedHeadline = "";
  let selectedSource = "";
  let selectedPubDate = "";
  let insight = "";

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 250,
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

Task:
1. Select the SINGLE story with the HIGHEST Google search impression demand and public impact across India today.
2. Write a timely, authoritative compliance advisory update for PF members and employers.

CRITICAL RULES FOR "insight":
- STRICT LENGTH: Under 130 characters.
- Actionable and factual: highlight the rule, limit, portal feature, or statutory benefit.
- Plain text only.
- DO NOT include URLs, links, hashtags, or quotation marks.

Return JSON in this exact schema:
{
  "selectedIndex": <number>,
  "selectedHeadline": "<title of chosen story>",
  "insight": "<compliance advisory strictly under 130 characters>"
}`;

    try {
      console.log("🤖 Gemini AI evaluating top search impression candidate...");
      const result = await model.generateContent(editorPrompt);
      const parsed = JSON.parse((await result.response).text());

      const chosenCandidate = topCandidates.find((c, idx) => idx + 1 === parsed.selectedIndex) || topCandidates[0];
      selectedHeadline = chosenCandidate.title;
      selectedSource = chosenCandidate.source;
      selectedPubDate = chosenCandidate.pubDate;
      insight = (parsed.insight || "").trim().replace(/^["']|["']$/g, "");

      console.log(`🎯 AI Selected: [Score: ${chosenCandidate.score}] ${selectedHeadline}`);
    } catch (parseErr) {
      console.warn("⚠️ AI JSON parsing fallback, using #1 scored candidate:", parseErr.message);
      const topOne = topCandidates[0];
      selectedHeadline = topOne.title;
      selectedSource = topOne.source;
      selectedPubDate = topOne.pubDate;
    }
  }

  // Fallback to high-impact compliance pillars if no RSS articles available
  if (!selectedHeadline || !insight) {
    const fallbackPillars = [
      {
        topic: "EPFO WhatsApp passbook & balance access service launched for members",
        insight: "Track your EPF passbook balance instantly via the official WhatsApp service without logging into the portal."
      },
      {
        topic: "EPFO Auto-Claim Settlement limits raised to ₹1 Lakh under Form 31 for illness and education",
        insight: "EPFO auto-settles Form 31 advance claims up to ₹1 Lakh within 3 days using IT automation for illness & education."
      },
      {
        topic: "Mandatory e-Nomination update for EDLI life insurance cover up to ₹7 Lakhs",
        insight: "Ensure active e-Nomination on your UAN to guarantee immediate ₹7 Lakh EDLI insurance payout for family nominees."
      },
      {
        topic: "Supreme Court and High Court rulings on EPS-95 higher pension calculation options",
        insight: "Review higher pension eligibility under EPS-95 as courts bar arbitrary rejection based on trust rules."
      },
      {
        topic: "EPFO Standard Operating Procedure (SOP) for Joint Declaration member profile corrections",
        insight: "Update name, DOB, and joining dates on UAN using EPFO's Joint Declaration SOP before filing PF transfer claims."
      }
    ];

    const pick = fallbackPillars[Math.floor(Math.random() * fallbackPillars.length)];
    selectedHeadline = selectedHeadline || pick.topic;
    insight = insight || pick.insight;
    selectedSource = selectedSource || "Official EPFO Circular";
    selectedPubDate = selectedPubDate || new Date().toISOString();
  }

  // Safety trim: keep insight under 135 characters
  if (insight.length > 135) {
    insight = truncateAtWord(insight, 132) + "...";
  }

  // Match most relevant tool or blog URL from corporatecompliance.in
  const resource = matchCorporateResource(selectedHeadline);
  console.log(`🔗 Matched Resource: ${resource.title} (${resource.url})`);

  // Assemble final tweet:
  // [Insight]
  //
  // [CTA] [URL]
  //
  // #EPFO #PFCompliance
  const hashtags = "#EPFO #PFCompliance";
  const tweetText = `${insight}\n\n${resource.cta} ${resource.url}\n\n${hashtags}`;

  // Twitter counts any URL as 23 characters (t.co)
  const twitterCharCount = insight.length + 2 + resource.cta.length + 1 + 23 + 2 + hashtags.length;

  console.log(`\n--- Final Assembled Tweet ---`);
  console.log(tweetText);
  console.log(`Raw Chars: ${tweetText.length} | Twitter Chars: ~${twitterCharCount} / 280 max\n-----------------------------\n`);

  return {
    tweetText,
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
  matchCorporateResource,
  scoreArticle,
  fetchTopImpressionEpfoNews,
  getPostedHistory,
  savePostedHeadline,
  generateEpfoTweet,
};
