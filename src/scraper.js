const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const url = require("url");

const visitedUrls = new Set();

async function downloadResource(page, resourceUrl, outputDir) {
  try {
    const response = await page.goto(resourceUrl, {
      waitUntil: "networkidle2",
    });

    const contentType = response.headers()["content-type"] || "";
    const parsedUrl = url.parse(resourceUrl);

    // Generate a relative file path based on the resource path within the output directory
    const resourcePath = parsedUrl.pathname.replace(/^\/+/, "");
    const filePath = path.join(outputDir, resourcePath);

    // Create directories for the file path if they don’t exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (contentType.includes("text/html")) {
      const html = await response.text();
      fs.writeFileSync(filePath, html);
      const crawlSuccess = await crawlPage(resourceUrl, page, outputDir);
      if (!crawlSuccess) return false;
    } else {
      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
    }

    console.log(`Downloaded: ${resourceUrl}`);
    return true;
  } catch (err) {
    console.error(`Failed to download ${resourceUrl}:`, err);
    return false;
  }
}

async function crawlPage(startUrl, page, outputDir) {
  if (visitedUrls.has(startUrl)) return true;
  visitedUrls.add(startUrl);

  await page.goto(startUrl, { waitUntil: "networkidle2" });
  const html = await page.content();
  const $ = cheerio.load(html);

  // Save main HTML file
  const filePath = path.join(outputDir, "index.html");
  fs.writeFileSync(filePath, html);

  // Array to collect relative resource URLs
  const resourceUrls = [];
  $(
    'img, script, link[rel="stylesheet"], link[rel="icon"], link[rel="preload"]'
  ).each((_, element) => {
    const src = $(element).attr("src") || $(element).attr("href");

    if (src) {
      // Convert absolute URLs to relative paths
      const absoluteUrl = new URL(src, startUrl).href;
      const relativePath = path.relative(
        outputDir,
        path.join(outputDir, url.parse(absoluteUrl).pathname)
      );

      // Update element attribute with relative path
      $(element).attr("src", relativePath).attr("href", relativePath);

      const extension = path.extname(relativePath).toLowerCase();
      if (
        [
          ".js",
          ".css",
          ".jpg",
          ".jpeg",
          ".png",
          ".svg",
          ".woff",
          ".woff2",
          ".ttf",
          ".otf",
          ".eot",
        ].includes(extension)
      ) {
        resourceUrls.push(absoluteUrl);
      }
    }
  });

  if (resourceUrls.length > 100) {
    console.log("Too many items to download. Abort.");
    return false;
  }

  for (const resourceUrl of resourceUrls) {
    const downloadSuccess = await downloadResource(
      page,
      resourceUrl,
      outputDir
    );
    if (!downloadSuccess) return false;
  }

  // Recursively crawl internal links
  const pageUrls = [];
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href && !href.startsWith("#")) {
      const absoluteUrl = new URL(href, startUrl).href;
      if (absoluteUrl.startsWith(new URL(startUrl).origin)) {
        pageUrls.push(absoluteUrl);
      }
    }
  });

  for (const pageUrl of pageUrls) {
    const crawlSuccess = await crawlPage(pageUrl, page, outputDir);
    if (!crawlSuccess) return false;
  }

  return true;
}

async function scrape(startUrl) {
  const outputDir = path.join("./downloaded-sites", new URL(startUrl).hostname);

  if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
    console.log(
      `Directory ${outputDir} already exists and is not empty. Skipping scrape.`
    );
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36"
  );

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const crawlSuccess = await crawlPage(startUrl, page, outputDir);

  if (!crawlSuccess) {
    fs.writeFileSync(
      path.join(outputDir, "error.txt"),
      "Too many resources to download."
    );
    console.log("Error encountered. Created error.txt for cleanup.");
  }

  await browser.close();
}

module.exports = { scrape };
