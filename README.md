# Dexscreener Scraper

## Overview

Dexscreener Scraper is a Node.js application that fetches the latest token profiles from the Dexscreener API, scrapes their associated websites, and saves relevant information such as descriptions, header images, and logos to a local directory structure.

## Features

- Fetches the latest token profiles from the Dexscreener API.
- Scrapes the corresponding website for additional content.
- Downloads token images (header and logo) and saves them locally.
- Saves token descriptions into text files.
- Automatically runs every 5 minutes to update token information.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/wafardev/dexscreener-scraper/
   cd dexscreener-scraper
   ```

2. Install the required packages:

   ```bash
   npm install
   ```

## Usage

1. Ensure you have Node.js installed (version 14 or higher recommended).
2. Run the scraper:

   ```bash
   npm run dev
   ```
   
   For production use, consider using a process manager like PM2:
   
   ```bash
   pm2 start src/main.js --name "dexscreener-scraper"
   ```

3. The scraper will run and check for new token profiles every 5 minutes, saving data into the `downloaded-sites` directory.

## Directory Structure

The downloaded data will be organized as follows:

```
downloaded-sites/
└── <token-website-hostname>/
    ├── index.html
    └── tokenInfo/
        ├── description.txt
        ├── header.png
        └── logo.png
```

## Functions

- `getLatestTokenProfile()`: Fetches the latest token profile data from Dexscreener API.
- `scrape(url)`: Scrapes the specified URL and downloads the HTML content and resources.
- `downloadHeaderAndLogo(outputDir, headerUrl, iconUrl)`: Downloads the header image and logo into the specified directory.
- `saveDescription(outputDir, description)`: Saves the token description into a text file.

## Error Handling

The scraper has built-in error handling to ensure that it continues to run even if individual token profiles fail to process. Errors are logged to the console for debugging.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## Acknowledgments

- [Dexscreener](https://dexscreener.com) for providing the API.
- [Node.js](https://nodejs.org) for enabling easy JavaScript server-side development.
- [Puppeteer](https://pptr.dev/) for web scraping capabilities.