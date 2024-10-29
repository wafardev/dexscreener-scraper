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

    let filePath;
    const resourcePath = parsedUrl.pathname.replace(/^\/+/, "");

    if (contentType.includes("text/html")) {
      filePath = path.join(outputDir, "index.html");
      const html = await response.text();
      fs.writeFileSync(filePath, html);
      await crawlPage(resourceUrl, page, outputDir); // Recursively crawl internal links
    } else {
      // For other resources, maintain the directory structure
      filePath = path.join(outputDir, resourcePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const buffer = await response.buffer();
      fs.writeFileSync(filePath, buffer);
    }

    console.log(`Downloaded: ${resourceUrl}`);
  } catch (err) {
    console.error(`Failed to download ${resourceUrl}:`, err);
  }
}

async function crawlPage(startUrl, page, outputDir) {
  if (visitedUrls.has(startUrl)) return;
  visitedUrls.add(startUrl);

  await page.goto(startUrl, { waitUntil: "networkidle2" });
  const html = await page.content();

  const filePath = path.join(outputDir, "index.html");
  fs.writeFileSync(filePath, html);

  const $ = cheerio.load(html);

  // Download linked resources (images, scripts, styles, and favicons)
  const resourceUrls = [];
  $('img, script, link[rel="stylesheet"], link[rel="icon"]').each(
    (_, element) => {
      const src = $(element).attr("src") || $(element).attr("href");
      if (src) {
        const absoluteUrl = new URL(src, startUrl).href;
        resourceUrls.push(absoluteUrl);
      }
    }
  );

  for (const resourceUrl of resourceUrls) {
    await downloadResource(page, resourceUrl, outputDir);
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
    await crawlPage(pageUrl, page, outputDir);
  }
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

  await crawlPage(startUrl, page, outputDir);

  await browser.close();
}

module.exports = { scrape };
