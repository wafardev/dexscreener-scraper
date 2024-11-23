const { getLatestTokenProfiles } = require("./services/dexscreener");
const { scrape } = require("./services/scraper");
const { downloadHeaderAndLogo, saveDescription } = require("./api/tokenInfo");
const { fetchContract } = require("./api/contractFetcher");
const fs = require("fs");
const path = require("path");
const pLimit = require("p-limit");

async function main(limitFlag) {
  async function processTokens(usePLimit) {
    let tokenProfiles;
    try {
      tokenProfiles = await getLatestTokenProfiles();
    } catch (error) {
      console.error("Error fetching token profiles:", error);
      return;
    }

    if (usePLimit) {
      console.log("Using p-limit for concurrent processing.");
      const limit = pLimit(2);

      const tasks = tokenProfiles.map((tokenProfile) =>
        limit(() => processToken(tokenProfile))
      );

      await Promise.all(tasks);
    } else {
      console.log("Processing tokens sequentially.");
      for (const tokenProfile of tokenProfiles) {
        await processToken(tokenProfile);
      }
    }

    console.log(
      "processTokens completed successfully at",
      new Date().toLocaleTimeString()
    );
  }

  async function processToken(tokenProfile) {
    console.log("Token profile:", tokenProfile);

    await fetchContract(tokenProfile);

    if (!tokenProfile || !tokenProfile.links) {
      console.log("No valid token profile found.");
      return;
    }

    let url = "";

    for (const link of tokenProfile.links) {
      if (link.label === "Website") {
        url = link.url;
        break;
      }
    }

    if (!url) {
      console.log("No website link found in token profile.");
      return;
    }

    const blockedDomains = [
      "x.com",
      "twitter.com",
      "youtu.be",
      "youtube.com",
      "pump.fun",
      "tiktok.com",
      "warpcast.com",
      "pastebin.com",
    ];

    if (blockedDomains.some((domain) => url.includes(domain))) {
      console.log("Blocked domain found in URL:", url);
      return;
    }

    const { description, header, icon } = tokenProfile;
    const outputDir = path.join("./downloaded-sites", new URL(url).hostname);

    if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
      console.log(
        `Output directory ${outputDir} already exists and is not empty. Skipping scrape.`
      );
      return;
    }

    console.log(
      `Starting scrape for ${url} at ${new Date().toLocaleTimeString()}`
    );

    try {
      await scrape(url);
    } catch (error) {
      console.error("Error scraping website:", error);
      return;
    }

    const tokenInfoDir = path.join(outputDir, "tokenInfo");
    fs.mkdirSync(tokenInfoDir, { recursive: true });

    try {
      await saveDescription(tokenInfoDir, description);
    } catch (error) {
      console.error("Error saving description:", error);
      return;
    }

    const xlSize = "?size=xl";
    const headerUrl = header + xlSize;
    const iconUrl = icon + xlSize;

    try {
      await downloadHeaderAndLogo(tokenInfoDir, headerUrl, iconUrl);
    } catch (error) {
      console.error("Error downloading images:", error);
    }
  }

  while (true) {
    try {
      console.log("Starting token processing...");
      await processTokens(limitFlag);
    } catch (err) {
      console.error("Error during token processing:", err);
    }
    console.log("Waiting for 10 minutes...");
    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
  }
}

if (process.argv[2] === "limit") {
  main(true).catch((err) => console.error("Error during execution:", err));
} else {
  main(false).catch((err) => console.error("Error during execution:", err));
}
