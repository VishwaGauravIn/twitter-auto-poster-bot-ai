// config/config_loader.js — Dynamic Niche Profile Loader
// Defaults 100% to 'epfo' ensuring existing production bot is completely untouched.

const fs = require("fs");
const path = require("path");

function getActiveProfile() {
  const profileId = process.env.NICHE_PROFILE || "epfo";
  const profilePath = path.join(__dirname, "profiles", `${profileId}.json`);

  if (fs.existsSync(profilePath)) {
    try {
      return JSON.parse(fs.readFileSync(profilePath, "utf8"));
    } catch (err) {
      console.warn(`⚠️ Error reading profile '${profileId}', falling back to 'epfo':`, err.message);
    }
  }

  // Fallback default: EPFO profile
  const epfoPath = path.join(__dirname, "profiles", "epfo.json");
  if (fs.existsSync(epfoPath)) {
    return JSON.parse(fs.readFileSync(epfoPath, "utf8"));
  }

  return {
    id: "epfo",
    name: "EPFO & PF Compliance",
    accountHandle: "@EPFOCompliance",
    brandName: "EPFO COMPLIANCE ALERT",
    websiteName: "corporatecompliance.in",
    websiteUrl: "https://corporatecompliance.in",
    sitemapUrl: "https://corporatecompliance.in/sitemap.xml",
    hashtags: ["#EPFO", "#PFCompliance", "#HRIndia", "#LabourLaw"]
  };
}

module.exports = { getActiveProfile };
