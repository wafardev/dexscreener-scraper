const fs = require("fs");
const path = require("path");

const { useTTFBotAPI } = require("../api/apiCalls");

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

// Function to clean up directories by removing those that are missing tokenInfo, index.html, have an error file, or match a blocked domain
// Function also cleans up contracts that are no longer safe or rugged
async function cleanUpDirectories(dirPath, dirPathContracts) {
  if (!fs.existsSync(dirPath)) {
    console.error("Sites directory does not exist:", dirPath);
    return;
  }

  if (!fs.existsSync(dirPathContracts)) {
    console.error("Contracts directory does not exist:", dirPathContracts);
    return;
  }

  // Clean up directories in dirPath
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
      const subDirPath = path.join(dirPath, dirent.name);

      const tokenInfoPath = path.join(subDirPath, "tokenInfo");
      const indexPath = path.join(subDirPath, "index.html");
      const errorFilePath = path.join(subDirPath, "error.txt");

      const missingTokenInfo = !fs.existsSync(tokenInfoPath);
      const missingIndexHtml = !fs.existsSync(indexPath);
      const hasErrorFile = fs.existsSync(errorFilePath);

      // Check if the directory name contains a blocked domain
      const hasBlockedDomain = blockedDomains.some((domain) =>
        dirent.name.includes(domain)
      );

      // If any condition is met, delete the directory
      if (
        missingTokenInfo ||
        missingIndexHtml ||
        hasErrorFile ||
        hasBlockedDomain
      ) {
        fs.rmSync(subDirPath, { recursive: true, force: true });
        console.log(`Deleted: ${subDirPath}`);
      }
    }
  });

  console.log("Directory cleanup completed.\n");

  // Clean up files in dirPathContracts
  for (const file of fs.readdirSync(dirPathContracts, {
    withFileTypes: true,
  })) {
    if (file.isFile()) {
      const filePath = path.join(dirPathContracts, file.name);

      const contractAddress = file.name.split("_")[1].split(".")[0];
      const chainName = file.name.split("_")[0];

      try {
        const response = await useTTFBotAPI(contractAddress, chainName);

        if (response === false) {
          console.log(`Deleted: ${filePath}`);
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error processing contract at ${filePath}:`, error);
      }
    }
  }

  console.log("Contract cleanup completed.\n");
}

if (process.argv.length < 4) {
  console.error(
    "Please provide the main directory paths for sites to cleanup and contracts as arguments."
  );
  process.exit(1);
} else {
  const mainDirectoryPath = process.argv[2];
  const mainDirectoryPathContracts = process.argv[3];
  cleanUpDirectories(mainDirectoryPath, mainDirectoryPathContracts);
}
