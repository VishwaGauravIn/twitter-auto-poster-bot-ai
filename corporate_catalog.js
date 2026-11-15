// corporate_catalog.js — Real-Time Resource Synchronizer & Search Matcher
// Automatically tracks all published blogs, tools, and wikis on https://corporatecompliance.in
// Dynamically fetches sitemap.xml on every run to discover and incorporate newly published articles!

const fs = require("fs");
const path = require("path");
const https = require("https");

const CACHE_FILE = path.join(__dirname, "corporate_resources_cache.json");

// Curated high-priority solution facts for core compliance topics
// These provide rich, verified details (exact phone numbers, form names, statutory math)
const CURATED_RESOURCES = [
  {
    keywords: ["whatsapp", "upi", "auto-settlement", "epfo 3.0", "epraapti", "e-praapti", "dormant", "atm card", "bhim", "8796441800", "passbook on whatsapp"],
    title: "EPFO 3.0: WhatsApp, UPI & Auto-Settlement Reality Check",
    cta: "Read full verified guide & breakdown:",
    url: "https://corporatecompliance.in/blog/epfo-2026-digital-updates-whatsapp-upi-auto-settlement",
    solutionFacts: "Save official WhatsApp bot +91 8796441800. Send 'Hi' from your UAN-registered mobile. Access PF balance, last 5 transactions & passbook instantly. Service is strictly read-only. Auto-settlement applies only to inoperative balances up to ₹1,000.",
    priority: 100
  },
  {
    keywords: ["rfe-3", "doj missing", "doe missing", "date of joining", "date of exit missing", "ecr error rfe", "member profile missing"],
    title: "Fix ECR Error RFE-3 (Missing DOJ/DOE)",
    cta: "Step-by-step ECR RFE-3 fix guide:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-rfe-3-uan-not-linked-doj-doe-missing",
    solutionFacts: "Fix missing Date of Joining/Exit in employer Unified Portal member profile before generating monthly ECR challan. Ensure UAN-Aadhaar linking is verified.",
    priority: 95
  },
  {
    keywords: ["overlap", "dual employment", "exit date", "date of exit", "bgv", "relieving", "two uans", "overlapping service"],
    title: "Fix PF Overlap & Exit Date Guide",
    cta: "Guide to resolve PF overlap & exit dates:",
    url: "https://corporatecompliance.in/blog/epf-overlap-vindictive-employer-bgv-failure-guide",
    solutionFacts: "Resolve overlapping service dates causing BGV failures. Submit Joint Declaration with relieving letters, resignation acceptance, and salary slips via EPFiGMS.",
    priority: 95
  },
  {
    keywords: ["uan is not a member", "uan not a member", "pension scheme error", "ecr pension error"],
    title: "ECR Error Fix Guide (UAN Not Pension Member)",
    cta: "Guide to resolve ECR pension scheme error:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-uan-not-member-pension-scheme",
    solutionFacts: "Occurs when employee joined EPF after age 58 or is excluded. Set EPS contribution to 0 in the ECR text/CSV file and mark non-contributory to upload successfully.",
    priority: 95
  },
  {
    keywords: ["vishwas roi", "vishwas math", "cost benefit", "damages vs litigation", "14b waiver roi"],
    title: "EPFO VISHWAS Scheme Financial Analysis",
    cta: "VISHWAS dispute & damages breakdown:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-roi-math-cost-benefit-analysis",
    solutionFacts: "Compare financial cost of settling pending PF litigation under VISHWAS to waive up to 100% 14B damages versus continuing expensive CGIT litigation.",
    priority: 90
  },
  {
    keywords: ["startup funding", "due diligence", "cgit appeal", "m&a pf liability", "vishwas startup", "vc due diligence"],
    title: "EPFO VISHWAS Scheme for Startups & M&A",
    cta: "Startup PF compliance due diligence guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-startup-funding-due-diligence-cgit",
    solutionFacts: "Clean up contingent PF litigation liabilities under VISHWAS 2026 before VC funding rounds or M&A due diligence audits.",
    priority: 90
  },
  {
    keywords: ["unregistered contractor", "principal employer", "contract labor pf", "section 8a", "unregistered vendor"],
    title: "EPFO Contractor Liability & VISHWAS Scheme",
    cta: "Principal employer contractor liability guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-unregistered-contractor-principal-employer",
    solutionFacts: "Principal employers are statutorily liable under Section 8A for contractor defaults. Utilize VISHWAS to settle past unregistered vendor arrears.",
    priority: 90
  },
  {
    keywords: ["contractor liability", "principal employer liability", "subcontractor pf", "contractor 14b", "vendor audit"],
    title: "Principal Employer Contractor Liability Guide",
    cta: "Contractor PF liability mitigation guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-contractor-liability-principal-employer",
    solutionFacts: "Audit contractor ECR challans, verify wage ceilings, and retain security deposits to safeguard principal employers from Section 14B damages.",
    priority: 90
  },
  {
    keywords: ["vishwas portal", "vishwas deadline", "december deadline", "employer portal vishwas", "how to apply vishwas"],
    title: "VISHWAS Scheme Portal Application Guide",
    cta: "Step-by-step VISHWAS filing guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-december-deadline-employer-portal-guide",
    solutionFacts: "Login to employer Unified Portal, navigate to VISHWAS 2026 tab, enter 14B show-cause/order details, and upload court withdrawal petition.",
    priority: 90
  },
  {
    keywords: ["vishwas", "vishwas scheme", "14b", "7q", "penalty waiver", "damages waiver", "pf amnesty", "conciliation"],
    title: "EPFO VISHWAS Scheme 2026 Dispute Resolution Guide",
    cta: "Complete VISHWAS Scheme dispute guide:",
    url: "https://corporatecompliance.in/blog/epfo-vishwas-scheme-2026-pf-damages-dispute-resolution-guide",
    solutionFacts: "Waive up to 100% of penal damages under Section 14B for belated PF remittances upon settling 7Q interest and remitting dues.",
    priority: 90
  },
  {
    keywords: ["form 10d legacy", "form 10d aadhaar", "aadhaar not verified 10d", "legacy account pension", "non-aadhaar 10d"],
    title: "Fix Form 10D Aadhaar Not Verified in Legacy Accounts",
    cta: "Guide to resolve Form 10D legacy account errors:",
    url: "https://corporatecompliance.in/blog/epfo-form-10d-aadhaar-not-verified-legacy-account",
    solutionFacts: "Submit physical Form 10D along with Joint Declaration and employer attestation to the jurisdictional EPFO regional office for pre-Aadhaar accounts.",
    priority: 90
  },
  {
    keywords: ["rfe-37", "rfe-25", "pohw", "1.16%", "higher wages pension", "higher pension ecr error"],
    title: "Fix ECR Error RFE-37 / RFE-25 (1.16% POHW)",
    cta: "Step-by-step RFE-37 resolution guide:",
    url: "https://corporatecompliance.in/blog/epfo-ecr-error-rfe-37-rfe-25-pohw-1-16-percent",
    solutionFacts: "Calculate and remit the mandatory 1.16% additional employer contribution on wages above ₹15,000 for approved higher pension members in monthly ECR.",
    priority: 90
  },
  {
    keywords: ["balance", "passbook", "pf calculator", "interest rate", "compound", "accumulated balance"],
    title: "EPF Balance & Interest Calculator",
    cta: "Calculate your EPF balance & interest growth:",
    url: "https://corporatecompliance.in/tools/pf-calculator",
    solutionFacts: "Calculate compound annual interest growth at 8.25% on combined employee and employer PF contributions.",
    priority: 50
  },
  {
    keywords: ["withdraw", "advance", "claim", "form 31", "form 19", "form 10c", "settlement", "auto-claim", "illness", "marriage", "housing", "construction"],
    title: "PF Withdrawal Calculator",
    cta: "Calculate withdrawal limits & eligibility:",
    url: "https://corporatecompliance.in/tools/pf-withdrawal-calculator",
    solutionFacts: "Check permissible withdrawal limits under Form 31: up to 100% of employee share for illness, 36 months wages for housing, or 50% for marriage/education.",
    priority: 50
  },
  {
    keywords: ["pension", "eps", "eps-95", "eps 95", "higher pension", "superannuation", "retirement", "pensioner"],
    title: "EPS Pension Calculator",
    cta: "Estimate your monthly EPS pension:",
    url: "https://corporatecompliance.in/tools/eps-pension-calculator",
    solutionFacts: "Formula: (Pensionable Salary × Pensionable Service) / 70. Maximum standard pensionable salary capped at ₹15,000 unless higher pension opted.",
    priority: 50
  },
  {
    keywords: ["edli", "insurance", "death claim", "nomination", "nominee", "e-nomination", "life cover", "7 lakh", "700000"],
    title: "EDLI Insurance Calculator",
    cta: "Calculate EDLI insurance benefit up to ₹7L:",
    url: "https://corporatecompliance.in/tools/edli-calculator",
    solutionFacts: "Payout is 35× average monthly salary (max ₹15,000) + 50% average PF balance, capped at ₹7,00,000 for active members.",
    priority: 50
  },
  {
    keywords: ["contribution", "wage ceiling", "15,000", "15000", "salary ceiling", "admin charges", "12%", "basic wages", "inspection charges"],
    title: "EPF Contribution Calculator",
    cta: "Calculate employer & employee PF split:",
    url: "https://corporatecompliance.in/tools/epf-contribution-calculator",
    solutionFacts: "Employee: 12% to EPF. Employer: 3.67% to EPF, 8.33% to EPS (capped at ₹1,250), plus 0.5% EDLI and 0.5% admin charges.",
    priority: 50
  },
  {
    keywords: ["gratuity", "5 years", "service tenure", "gratuity act", "gratuity payout"],
    title: "Gratuity Calculator",
    cta: "Calculate your statutory gratuity:",
    url: "https://corporatecompliance.in/tools/gratuity-calculator",
    solutionFacts: "Formula: (15 × Last Drawn Salary × Years of Service) / 26. Tax-free limit up to ₹20 Lakhs for eligible employees completing 5 continuous years.",
    priority: 50
  },
  {
    keywords: ["joint declaration", "sop", "kyc", "aadhaar", "uan", "circular", "rule", "guideline", "court"],
    title: "EPFO Statutory Wiki & SOPs",
    cta: "Check EPFO SOPs, rules & guides:",
    url: "https://corporatecompliance.in/tools/wiki",
    solutionFacts: "Access official EPFO standard operating procedures, circular archives, and KYC correction guidelines.",
    priority: 40
  }
];

const FALLBACK_RESOURCES = [
  {
    title: "Compliance Calculators",
    cta: "Free EPFO compliance calculators:",
    url: "https://corporatecompliance.in/tools",
    solutionFacts: "Access comprehensive EPFO calculators for PF balance, pension, gratuity, and withdrawal limits.",
    priority: 10
  },
  {
    title: "Corporate Compliance Solutions",
    cta: "Expert EPFO compliance support:",
    url: "https://corporatecompliance.in",
    solutionFacts: "Consult statutory compliance experts for employer audit defense, ECR filing, and grievance resolution.",
    priority: 10
  }
];

// Helper: HTTP request with timeout
function httpGet(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const req = https.get(
        url,
        {
          headers: {
            "User-Agent": "EPFOComplianceBot/2.0 (+https://corporatecompliance.in)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          }
        },
        (res) => {
          if (res.statusCode < 200 || res.statusCode >= 400) {
            resolve("");
            return;
          }
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve(body));
        }
      );
      req.on("error", () => resolve(""));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve("");
      });
    } catch {
      resolve("");
    }
  });
}

// Decode basic HTML entities
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/\s+/g, " ")
    .trim();
}

// Extract keywords from URL slug
function extractKeywordsFromSlug(slug) {
  const parts = slug.toLowerCase().split(/[-_]/).filter((p) => p.length > 2);
  const stopWords = new Set(["the", "and", "for", "with", "from", "how", "what", "guide", "rules", "2026", "2025"]);
  return parts.filter((p) => !stopWords.has(p));
}

// Extract metadata from a blog page
async function scrapePageMeta(url) {
  const html = await httpGet(url, 7000);
  if (!html) return null;

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);

  let rawTitle = titleMatch ? titleMatch[1] : "";
  rawTitle = rawTitle.replace(/\s*\|.*$/, "").replace(/\s*-\s*Corporate\s*Compliance.*$/i, "").trim();
  const cleanTitle = decodeHtmlEntities(rawTitle);

  const rawDesc = descMatch ? descMatch[1] : "";
  const cleanDesc = decodeHtmlEntities(rawDesc);

  const urlObj = new URL(url);
  const slug = path.basename(urlObj.pathname);
  const slugKeywords = extractKeywordsFromSlug(slug);

  return {
    url,
    title: cleanTitle || slug.replace(/[-_]/g, " "),
    cta: "Read full verified guide & breakdown:",
    solutionFacts: cleanDesc || `Detailed step-by-step guidance on ${cleanTitle || slug.replace(/[-_]/g, " ")}.`,
    keywords: Array.from(new Set([...slugKeywords, slug.replace(/[-_]/g, " ")])),
    lastUpdated: new Date().toISOString()
  };
}

// Read local cache from disk
function loadCachedResources() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn("⚠️ Failed reading corporate resources cache:", e.message);
    }
  }
  return [];
}

// Save cache to disk
function saveCachedResources(resources) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(resources, null, 2), "utf-8");
  } catch (e) {
    console.warn("⚠️ Failed saving corporate resources cache:", e.message);
  }
}

// Fetch all live URLs from sitemap.xml
async function fetchSitemapUrls() {
  const sitemapUrl = "https://corporatecompliance.in/sitemap.xml";
  const xml = await httpGet(sitemapUrl, 8000);
  if (!xml) return [];

  const urls = [];
  const regex = /<loc>(https:\/\/corporatecompliance\.in\/(?:blog|tools)\/[^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// Concurrency helper
async function mapConcurrent(items, limit, fn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

// Primary Synchronizer: Synchronizes live URLs dynamically every time it runs!
async function syncCorporateResources(options = {}) {
  const { force = false, verbose = true } = options;
  if (verbose) {
    console.log("🔄 Synchronizing live blogs & tools from https://corporatecompliance.in/sitemap.xml...");
  }

  const cached = loadCachedResources();
  const cachedUrlMap = new Map(cached.map((item) => [item.url, item]));

  // 1. Fetch live sitemap
  const liveUrls = await fetchSitemapUrls();

  if (liveUrls.length === 0) {
    if (verbose) {
      console.log(`ℹ️ Sitemap unreachable or offline. Using ${cached.length} cached resources.`);
    }
    return mergeAllResources(cached);
  }

  // 2. Detect newly published blog/tool URLs
  const missingUrls = liveUrls.filter((u) => force || !cachedUrlMap.has(u));

  if (missingUrls.length > 0) {
    if (verbose) {
      console.log(`✨ Found ${missingUrls.length} new/un-cached articles! Crawling metadata...`);
    }

    const newScraped = await mapConcurrent(missingUrls, 5, async (url) => {
      const meta = await scrapePageMeta(url);
      return meta;
    });

    for (const item of newScraped) {
      if (item && item.url) {
        cachedUrlMap.set(item.url, item);
      }
    }

    saveCachedResources(Array.from(cachedUrlMap.values()));
    if (verbose) {
      console.log(`✅ Dynamically indexed ${missingUrls.length} new articles into catalog! (Total live: ${cachedUrlMap.size})`);
    }
  } else {
    if (verbose) {
      console.log(`✅ All ${liveUrls.length} live website articles & tools are up to date!`);
    }
  }

  return mergeAllResources(Array.from(cachedUrlMap.values()));
}

// Merge curated high-priority records with dynamic records
function mergeAllResources(dynamicList = []) {
  const finalMap = new Map();

  // Add all dynamic/cached resources
  for (const item of dynamicList) {
    finalMap.set(item.url, {
      ...item,
      priority: item.priority || (item.url.includes("/blog/") ? 70 : 40)
    });
  }

  // Curated resources override with their high-fidelity facts and priorities
  for (const item of CURATED_RESOURCES) {
    finalMap.set(item.url, {
      ...finalMap.get(item.url),
      ...item
    });
  }

  return Array.from(finalMap.values());
}

// Intelligent Search & Intent Matcher
function matchCorporateResource(headline, allResources = null) {
  const resources = allResources || mergeAllResources(loadCachedResources());
  const lower = (headline || "").toLowerCase();

  let bestMatch = null;
  let highestScore = -1;

  for (const item of resources) {
    let score = 0;

    // Check exact keywords
    if (Array.isArray(item.keywords)) {
      for (const kw of item.keywords) {
        const kwLower = kw.toLowerCase();
        if (lower.includes(kwLower)) {
          // Multi-word matches score much higher
          score += kwLower.includes(" ") ? 30 : 15;
        }
      }
    }

    // Check slug overlap
    try {
      const slug = path.basename(new URL(item.url).pathname).replace(/[-_]/g, " ").toLowerCase();
      const slugWords = slug.split(" ").filter((w) => w.length > 3);
      for (const sw of slugWords) {
        if (lower.includes(sw)) {
          score += 10;
        }
      }
    } catch {
      // ignore url parse error
    }

    // Check title overlap
    if (item.title) {
      const titleWords = item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      for (const tw of titleWords) {
        if (lower.includes(tw)) {
          score += 8;
        }
      }
    }

    // Blogs get an inherent bonus over tools when keywords match
    if (item.url.includes("/blog/") && score > 0) {
      score += 12;
    }

    // Add baseline item priority weight
    score += (item.priority || 0) * 0.1;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 15) {
    return bestMatch;
  }

  // Fallback to general tool or corporate compliance portal
  return FALLBACK_RESOURCES[Math.floor(Math.random() * FALLBACK_RESOURCES.length)];
}

module.exports = {
  syncCorporateResources,
  matchCorporateResource,
  CURATED_RESOURCES,
  FALLBACK_RESOURCES,
  loadCachedResources,
  saveCachedResources,
  CACHE_FILE
};
