const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function downloadImage(imageUrl, outputPath) {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided.");
    }

    const response = await axios.get(imageUrl, {
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", (err) => {
        console.error("Error writing to file:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

async function saveDescription(outputDir, description) {
  const descriptionFilePath = path.join(outputDir, "description.txt");
  fs.writeFileSync(descriptionFilePath, description);
  console.log(`Saved description to ${descriptionFilePath}`);
}

async function downloadHeaderAndLogo(outputDir, headerUrl, iconUrl) {
  const headerImagePath = path.join(outputDir, "header.png");
  const iconImagePath = path.join(outputDir, "logo.png");

  await downloadImage(headerUrl, headerImagePath);
  console.log(`Saved header image to ${headerImagePath}`);

  await downloadImage(iconUrl, iconImagePath);
  console.log(`Saved logo image to ${iconImagePath}`);
}

async function addContractToPath(contractAddress, sourceCode, chain, safeBool) {
  const safeText = safeBool ? "_safe" : "_unsafe";

  const contractFilePath = path.join(
    "./saved-contracts",
    `${chain}_${contractAddress}${safeText}.txt`
  );

  const outputDir = path.dirname(contractFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (fs.existsSync(contractFilePath)) {
    console.log(`File ${contractFilePath} already exists. Skipping save.`);
    return;
  }

  try {
    await fs.promises.writeFile(contractFilePath, sourceCode);
    console.log(`Saved contract link to ${contractFilePath}`);
  } catch (error) {
    console.error(`Failed to save contract link: ${error.message}`);
  }
}

module.exports = {
  downloadHeaderAndLogo,
  saveDescription,
  addContractToPath,
};
