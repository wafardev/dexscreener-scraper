const fs = require("fs");
const path = require("path");

// Function to clean up directories by removing those that are missing tokenInfo, index.html, or have an error file
function cleanUpDirectories(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error("Directory does not exist:", dirPath);
    return;
  }

  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
      const subDirPath = path.join(dirPath, dirent.name);

      const tokenInfoPath = path.join(subDirPath, "tokenInfo");
      const indexPath = path.join(subDirPath, "index.html");
      const errorFilePath = path.join(subDirPath, "error.txt");

      const missingTokenInfo = !fs.existsSync(tokenInfoPath);
      const missingIndexHtml = !fs.existsSync(indexPath);
      const hasErrorFile = fs.existsSync(errorFilePath);

      if (missingTokenInfo || missingIndexHtml || hasErrorFile) {
        fs.rmSync(subDirPath, { recursive: true, force: true });
        console.log(`Deleted: ${subDirPath}`);
      }
    }
  });

  console.log("Cleanup completed.");
}

if (process.argv.length < 3) {
  console.error("Please provide the main directory path as an argument.");
  process.exit(1);
} else {
  const mainDirectoryPath = process.argv[2];
  cleanUpDirectories(mainDirectoryPath);
}
