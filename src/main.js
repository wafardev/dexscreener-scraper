const { getLatestTokenProfile } = require("./dexscreener");
const { scrape } = require("./scraper");
const { downloadHeaderAndLogo, saveDescription } = require("./tokenInfo");
const fs = require("fs");
const path = require("path");

async function main() {
  const outputBaseDir = path.join("./downloaded-sites");

  async function processToken() {
    let tokenProfile;
    try {
      tokenProfile = await getLatestTokenProfile();
      console.log("Token profile:", tokenProfile);
    } catch (error) {
      console.error("Error fetching token profile:", error);
      return;
    }

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

    const { description, header, icon } = tokenProfile;
    const outputDir = path.join(outputBaseDir, new URL(url).hostname);

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

  await processToken();

  // Set interval for processing every 5 minutes
  setInterval(async () => {
    await processToken();
  }, 5 * 60 * 1000);
}

main().catch((err) => console.error("Error during execution:", err));
