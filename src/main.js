const { getLatestTokenProfiles } = require("./dexscreener");
const { scrape } = require("./scraper");
const { downloadHeaderAndLogo, saveDescription } = require("./tokenInfo");
const fs = require("fs");
const path = require("path");

async function main() {
  const outputBaseDir = path.join("./downloaded-sites");

  async function processTokens() {
    let tokenProfiles;
    try {
      tokenProfiles = await getLatestTokenProfiles();
    } catch (error) {
      console.error("Error fetching token profiles:", error);
      return;
    }

    for (const tokenProfile of tokenProfiles) {
      console.log("Token profile:", tokenProfile);
      if (!tokenProfile || !tokenProfile.links) {
        console.log("No valid token profile found.");
        continue;
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
        continue;
      }

      const blockedDomains = [
        "x.com",
        "twitter.com",
        "youtu.be",
        "youtube.com",
        "pump.fun",
      ];

      for (let domain of blockedDomains) {
        if (url.includes(domain)) {
          return;
        }
      }

      const { description, header, icon } = tokenProfile;
      const outputDir = path.join(outputBaseDir, new URL(url).hostname);

      if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
        console.log(
          `Output directory ${outputDir} already exists and is not empty. Skipping scrape.`
        );
        continue;
      }

      console.log(
        `Starting scrape for ${url} at ${new Date().toLocaleTimeString()}`
      );

      try {
        await scrape(url);
      } catch (error) {
        console.error("Error scraping website:", error);
        continue;
      }

      const tokenInfoDir = path.join(outputDir, "tokenInfo");
      fs.mkdirSync(tokenInfoDir, { recursive: true });

      try {
        await saveDescription(tokenInfoDir, description);
      } catch (error) {
        console.error("Error saving description:", error);
        continue;
      }

      const xlSize = "?size=xl";
      const headerUrl = header + xlSize;
      const iconUrl = icon + xlSize;

      try {
        await downloadHeaderAndLogo(tokenInfoDir, headerUrl, iconUrl);
      } catch (error) {
        console.error("Error downloading images:", error);
        continue;
      }
    }
  }

  await processTokens();

  // Set interval for processing every 10 minutes
  setInterval(async () => {
    await processTokens();
  }, 10 * 60 * 1000);
}

main().catch((err) => console.error("Error during execution:", err));
