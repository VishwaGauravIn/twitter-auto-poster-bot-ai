// epfo_content.js — Unified EPFO News Fetcher, Search Analytics Ranker & Twitter Thread Generator
// Dedicated to promoting https://corporatecompliance.in tools and blogs on @EPFOCompliance.
// Generates detailed 3-part threads with actionable step-by-step solutions and exact blog links.

const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(__dirname, "posted_articles.json");

// Exhaustive directory of all live blogs and tools on corporatecompliance.in
// Each entry includes specific solution facts to supply the exact "how-to" in Tweet 2!
const CORPORATE_RESOURCES = [
  // 1. Blog: EPFO 3.0 WhatsApp, UPI & Auto-settlement Reality Check
  {
    keywords: ["whatsapp", "upi", "auto-settlement", "epfo 3.0", "epraapti", "e-praapti", "dormant", "atm card", "bhim", "8796441800", "passbook on whatsapp"],
    title: "EPFO 3.0: WhatsApp, UPI & Auto-Settlement Reality Check",
    cta: "Read full verified guide & breakdown:",
    url: "https://corporatecompliance.in/blog/epfo-2026-digital-updates-whatsapp-upi-auto-settlement",
    solutionFacts: "Save official WhatsApp bot +91 8796441800. Send 'Hi' from your UAN-registered mobile. Access PF balance, last 5 transactions & passbook instantly. Service is strictly read-only. Auto-settlement applies only to inoperative balances up to ₹1,000."
  },
  // 2. Blog: ECR Error RFE-3 (DOJ/DOE Missing)
  {
    keywords: ["rfe-3", "doj missing", "doe missing", "date of joining", "date of exit missing", "ecr error rfe", "member profile missing"],
    title: "Fix ECR Error RFE-3 (Missing DOJ/DOE)",
    cta: "Step-by-step ECR RFE-3 fix guide:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-rfe-3-uan-not-linked-doj-doe-missing",
    solutionFacts: "Fix missing Date of Joining/Exit in employer Unified Portal member profile before generating monthly ECR challan. Ensure UAN-Aadhaar linking is verified."
  },
  // 3. Blog: PF Overlap & Date of Exit Fix (Dual employment / BGV)
  {
    keywords: ["overlap", "dual employment", "exit date", "date of exit", "bgv", "relieving", "two uans", "overlapping service"],
    title: "Fix PF Overlap & Exit Date Guide",
    cta: "Guide to resolve PF overlap & exit dates:",
    url: "https://corporatecompliance.in/blog/epf-overlap-vindictive-employer-bgv-failure-guide",
    solutionFacts: "Resolve overlapping service dates causing BGV failures. Submit Joint Declaration with relieving letters, resignation acceptance, and salary slips via EPFiGMS."
  },
  // 4. Blog: ECR Error - UAN Not a Member of Pension Scheme
  {
    keywords: ["uan is not a member", "uan not a member", "pension scheme error", "ecr pension error"],
    title: "ECR Error Fix Guide (UAN Not Pension Member)",
    cta: "Guide to resolve ECR pension scheme error:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-uan-not-member-pension-scheme",
    solutionFacts: "Occurs when employee joined EPF after age 58 or is excluded. Set EPS contribution to 0 in the ECR text/CSV file and mark non-contributory to upload successfully."
  },
  // 5. Blog: VISHWAS Scheme ROI & Math Breakdown
  {
    keywords: ["vishwas roi", "vishwas math", "cost benefit", "damages vs litigation", "14b waiver roi"],
    title: "EPFO VISHWAS Scheme Financial Analysis",
    cta: "VISHWAS dispute & damages breakdown:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-roi-math-cost-benefit-analysis",
    solutionFacts: "Compare financial cost of settling pending PF litigation under VISHWAS to waive up to 100% 14B damages versus continuing expensive CGIT litigation."
  },
  // 6. Blog: VISHWAS Scheme & Startup Funding Due Diligence
  {
    keywords: ["startup funding", "due diligence", "cgit appeal", "m&a pf liability", "venture funding pf"],
    title: "Clearing Due Diligence via VISHWAS Scheme",
    cta: "How VISHWAS clears due diligence:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-startup-funding-due-diligence-cgit",
    solutionFacts: "Clear pending PF assessment orders and Section 7A liabilities through VISHWAS to unblock venture funding rounds, M&A due diligence, and statutory audits."
  },
  // 7. Blog: Unregistered Contractors & Principal Employer Liability
  {
    keywords: ["unregistered contractor", "principal employer default", "contractor default pf", "contract labor pf"],
    title: "Principal Employer Contractor PF Guide",
    cta: "Principal employer contractor liability guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-unregistered-contractor-principal-employer",
    solutionFacts: "Principal employers can regularize unregistered contract workers' PF arrears and avoid joint recovery notices or prosecution under Section 14."
  },
  // 8. Blog: Contractor Liability & Vendor Compliance
  {
    keywords: ["contractor liability", "vendor default", "vendor pf compliance", "subcontractor pf"],
    title: "Contractor PF Liability Management",
    cta: "Contractor PF default & compliance guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-contractor-liability-principal-employer",
    solutionFacts: "Audit monthly contractor ECR challans, electronic contribution slips, and wage registers before releasing contractor invoices to prevent 7A liability."
  },
  // 9. Blog: VISHWAS Scheme December Deadline & Portal Guide
  {
    keywords: ["vishwas deadline", "december deadline", "employer portal guide", "vishwas scheme portal"],
    title: "EPFO VISHWAS Employer Portal Guide",
    cta: "Step-by-step VISHWAS portal application guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-december-deadline-employer-portal-guide",
    solutionFacts: "Navigate the EPFO Unified Employer Portal to file Form VISHWAS, upload assessment copies, and remit agreed arrears before the deadline expires."
  },
  // 10. Blog: VISHWAS 2026 PF Damages & Dispute Resolution
  {
    keywords: ["vishwas 2026", "pf damages", "dispute resolution", "14b damages", "7q interest", "penalty waiver", "amnesty"],
    title: "EPFO VISHWAS 2026 Dispute Resolution Guide",
    cta: "Read full VISHWAS damages resolution guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-2026-pf-damages-dispute-resolution-guide",
    solutionFacts: "Understand statutory formula for Section 14B damages waiver and 7Q interest remittance to close long-standing EPFO recovery proceedings."
  },
  // 11. Blog: Form 10D Aadhaar Not Verified (Legacy Pension Claim)
  {
    keywords: ["form 10d", "pension claim", "aadhaar not verified", "legacy account", "physical claim 10d"],
    title: "Form 10D Legacy Account Pension Fix",
    cta: "How to fix Form 10D pension claim:",
    url: "https://corporatecompliance.in/blog/epfo-form-10d-aadhaar-not-verified-legacy-account",
    solutionFacts: "Submit physical Form 10D with bank manager certification and joint declaration when legacy member records lack biometric Aadhaar seeding."
  },
  // 12. Blog: ECR Error RFE-37 & RFE-25 (POHW 1.16% Extra Pension)
  {
    keywords: ["rfe-37", "rfe-25", "pohw", "1.16%", "higher wages pension", "higher pension ecr error"],
    title: "Fix ECR Error RFE-37 / RFE-25 (1.16% POHW)",
    cta: "Step-by-step RFE-37 resolution guide:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-rfe-37-rfe-25-pohw-1-16-percent",
    solutionFacts: "Calculate and remit the mandatory 1.16% additional employer contribution on wages above ₹15,000 for approved higher pension members in monthly ECR."
  },
  // 13. Tool: PF Balance & Interest Calculator
  {
    keywords: ["balance", "passbook", "pf calculator", "interest rate", "compound", "accumulated balance"],
    title: "EPF Balance & Interest Calculator",
    cta: "Calculate your EPF balance & interest growth:",
    url: "https://corporatecompliance.in/tools/pf-calculator",
    solutionFacts: "Calculate compound annual interest growth at 8.25% on combined employee and employer PF contributions."
  },
  // 14. Tool: PF Withdrawal / Advance Calculator
  {
    keywords: ["withdraw", "advance", "claim", "form 31", "form 19", "form 10c", "settlement", "auto-claim", "illness", "marriage", "housing", "construction"],
    title: "PF Withdrawal Calculator",
    cta: "Calculate withdrawal limits & eligibility:",
    url: "https://corporatecompliance.in/tools/pf-withdrawal-calculator",
    solutionFacts: "Check permissible withdrawal limits under Form 31: up to 100% of employee share for illness, 36 months wages for housing, or 50% for marriage/education."
  },
  // 15. Tool: EPS Pension Calculator
  {
    keywords: ["pension", "eps", "eps-95", "eps 95", "higher pension", "superannuation", "retirement", "pensioner"],
    title: "EPS Pension Calculator",
    cta: "Estimate your monthly EPS pension:",
    url: "https://corporatecompliance.in/tools/eps-pension-calculator",
    solutionFacts: "Formula: (Pensionable Salary × Pensionable Service) / 70. Maximum standard pensionable salary capped at ₹15,000 unless higher pension opted."
  },
  // 16. Tool: EDLI Life Insurance Calculator
  {
    keywords: ["edli", "insurance", "death claim", "nomination", "nominee", "e-nomination", "life cover", "7 lakh", "700000"],
    title: "EDLI Insurance Calculator",
    cta: "Calculate EDLI insurance benefit up to ₹7L:",
    url: "https://corporatecompliance.in/tools/edli-calculator",
    solutionFacts: "Payout is 35× average monthly salary (max ₹15,000) + 50% average PF balance, capped at ₹7,00,000 for active members."
  },
  // 17. Tool: EPF Contribution Calculator
  {
    keywords: ["contribution", "wage ceiling", "15,000", "15000", "salary ceiling", "admin charges", "12%", "basic wages", "inspection charges"],
    title: "EPF Contribution Calculator",
    cta: "Calculate employer & employee PF split:",
    url: "https://corporatecompliance.in/tools/epf-contribution-calculator",
    solutionFacts: "Employee: 12% to EPF. Employer: 3.67% to EPF, 8.33% to EPS (capped at ₹1,250), plus 0.5% EDLI and 0.5% admin charges."
  },
  // 18. Tool: Gratuity Calculator
  {
    keywords: ["gratuity", "5 years", "service tenure", "gratuity act", "gratuity payout"],
    title: "Gratuity Calculator",
    cta: "Calculate your statutory gratuity:",
    url: "https://corporatecompliance.in/tools/gratuity-calculator",
    solutionFacts: "Formula: (15 × Last Drawn Salary × Years of Service) / 26. Tax-free limit up to ₹20 Lakhs for eligible employees completing 5 continuous years."
  },
  // 19. Tool: Statutory Wiki & SOPs
  {
    keywords: ["joint declaration", "sop", "kyc", "aadhaar", "uan", "circular", "rule", "guideline", "court"],
    title: "EPFO Statutory Wiki & SOPs",
    cta: "Check EPFO SOPs, rules & guides:",
    url: "https://corporatecompliance.in/tools/wiki",
    solutionFacts: "Access official EPFO standard operating procedures, circular archives, and KYC correction guidelines."
  },
];

// Fallback resources
const FALLBACK_RESOURCES = [
  {
    title: "Compliance Calculators",
    cta: "Free EPFO compliance calculators:",
    url: "https://corporatecompliance.in/tools",
    solutionFacts: "Access comprehensive EPFO calculators for PF balance, pension, gratuity, and withdrawal limits."
  },
  {
    title: "Corporate Compliance Solutions",
    cta: "Expert EPFO compliance support:",
    url: "https://corporatecompliance.in",
    solutionFacts: "Consult statutory compliance experts for employer audit defense, ECR filing, and grievance resolution."
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

  // Match the exact tool or blog from corporatecompliance.in
  const resource = matchCorporateResource(selectedHeadline);
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
  matchCorporateResource,
  scoreArticle,
  fetchTopImpressionEpfoNews,
  getPostedHistory,
  savePostedHeadline,
  generateEpfoTweet,
};
