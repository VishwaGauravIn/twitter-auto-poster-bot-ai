// epfo_content.js — Unified EPFO News Fetcher, Resource Mapper & Tweet Generator
// Dedicated to promoting https://corporatecompliance.in tools and blogs on @EPFOCompliance

const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(__dirname, "posted_articles.json");

// Prioritized directory of tools and blog posts on corporatecompliance.in
// Specific articles and tools are matched before broader topics.
const CORPORATE_RESOURCES = [
  // 1. Blog: ECR errors / UAN pension issues (specific)
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
  // 6. PF Withdrawal / Advance / Claim Settling
  {
    keywords: ["withdraw", "advance", "claim", "form 31", "form 19", "form 10c", "settlement", "auto-claim", "illness", "marriage", "housing", "construction"],
    title: "PF Withdrawal Calculator",
    cta: "Calculate withdrawal limits & eligibility:",
    url: "https://corporatecompliance.in/tools/pf-withdrawal-calculator",
  },
  // 7. Pension / EPS / Retirement
  {
    keywords: ["pension", "eps", "eps-95", "eps 95", "higher pension", "superannuation", "retirement", "pensioner"],
    title: "EPS Pension Calculator",
    cta: "Estimate your monthly EPS pension:",
    url: "https://corporatecompliance.in/tools/eps-pension-calculator",
  },
  // 8. EPF Contribution / Wage Ceiling / Admin charges
  {
    keywords: ["contribution", "wage ceiling", "15,000", "15000", "salary ceiling", "admin charges", "12%", "basic wages", "inspection charges"],
    title: "EPF Contribution Calculator",
    cta: "Calculate employer & employee PF split:",
    url: "https://corporatecompliance.in/tools/epf-contribution-calculator",
  },
  // 9. Gratuity / Service tenure
  {
    keywords: ["gratuity", "5 years", "service tenure", "gratuity act", "gratuity payout"],
    title: "Gratuity Calculator",
    cta: "Calculate your statutory gratuity:",
    url: "https://corporatecompliance.in/tools/gratuity-calculator",
  },
  // 10. Wiki / Circulars / Passbook / Joint Declaration SOP / Rules
  {
    keywords: ["joint declaration", "sop", "passbook", "interest rate", "kyc", "aadhaar", "uan", "circular", "rule", "guideline"],
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
  // Alternate fallback between tools and main site
  return FALLBACK_RESOURCES[Math.floor(Math.random() * FALLBACK_RESOURCES.length)];
}

// Fetch latest published EPFO news from Google News RSS
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
    console.log(`Found ${headlines.length} recent EPFO headlines.`);
    return headlines;
  } catch (err) {
    console.warn("⚠️ RSS fetch failed, using fallback:", err.message);
    return [];
  }
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

function savePostedHeadline(headline) {
  try {
    const history = getPostedHistory();
    history.push({ headline, postedAt: new Date().toISOString() });
    const trimmed = history.slice(-50);
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

// Generate an authoritative, character-safe tweet with corporatecompliance.in link
async function generateEpfoTweet(genAI) {
  const headlines = await fetchLatestEpfoNews();
  const history = getPostedHistory();
  const postedSet = new Set(history.map((h) => h.headline));

  let selectedHeadline = headlines.find((h) => !postedSet.has(h));

  const fallbackTopics = [
    "EPFO Auto-Claim Settlement limits and eligibility under Form 31 for illness and education",
    "Mandatory e-Nomination update for EDLI life insurance cover up to ₹7 Lakhs",
    "Standard Operating Procedure (SOP) for Joint Declaration member profile corrections",
    "Monthly ECR contribution filing deadlines and compliance checks for establishments",
    "EPFO interest rate credit status and how to check your digital passbook",
    "Higher pension EPS-95 calculation options and joint option verification",
    "UAN-Aadhaar seeding and active mobile link for seamless online withdrawals",
    "Principal employer liability for contract labor PF compliance and ECR reconciliation"
  ];

  if (!selectedHeadline) {
    selectedHeadline = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
    console.log(`ℹ️ All recent news posted. Using curated compliance topic: "${selectedHeadline}"`);
  } else {
    console.log(`✨ Selected unposted news: "${selectedHeadline}"`);
  }

  // Match most relevant tool or blog URL
  const resource = matchCorporateResource(selectedHeadline);
  console.log(`🎯 Matched resource: ${resource.title} (${resource.url})`);

  console.log("🤖 Generating concise compliance insight via Gemini AI...");
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { maxOutputTokens: 200 },
  });

  const prompt = `You are @EPFOCompliance, the leading authority on EPFO (Employees' Provident Fund Organisation) rules and compliance in India.

Context / Latest News: "${selectedHeadline}"

Write a crisp, authoritative compliance advisory update for employees and employers.
CRITICAL RULES:
1. STRICT LENGTH: Under 130 characters. Exactly 1 or 2 concise sentences.
2. Focus on action, rule, or benefit (e.g. limit, deadline, check, verification).
3. Plain text only.
4. DO NOT include any links, URLs, or hashtags (these will be added programmatically).
5. No quotation marks.`;

  const result = await model.generateContent(prompt);
  let insight = (await result.response).text().trim().replace(/^["']|["']$/g, "");

  // Safety trim: keep insight under 135 characters
  if (insight.length > 135) {
    insight = truncateAtWord(insight, 132) + "...";
  }

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

  console.log(`\n--- Assembled Tweet (Length: ${tweetText.length} raw chars, ~${twitterCharCount} Twitter chars) ---`);
  console.log(tweetText);
  console.log("----------------------------------------------------------------------------------\n");

  return {
    tweetText,
    headline: selectedHeadline,
    resourceUrl: resource.url,
    resourceTitle: resource.title,
  };
}

module.exports = {
  CORPORATE_RESOURCES,
  FALLBACK_RESOURCES,
  matchCorporateResource,
  fetchLatestEpfoNews,
  getPostedHistory,
  savePostedHeadline,
  generateEpfoTweet,
};
