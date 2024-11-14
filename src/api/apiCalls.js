require("dotenv").config();

const { TTF_API_TOKEN, ETHERSCAN_API_KEY } = process.env;

async function useTTFBotAPI(contractAddress, chain) {
  if (chain === "ethereum") {
    chain = "eth";
  }

  const rugList = [
    "Possible 100% Tax Trigger found!",
    "SUSPICIOUS CODE",
    "RUGGABLE",
    "Blacklist",
    "Whitelist",
    "Max Transaction",
    "Trading Disable",
    "Set Tax",
    "Max Wallet",
    "<b>Possible Delayed Honeypot. BE CAREFUL</b>",
    "<b>VERY POSSIBLE Delayed Honeypot. BE CAREFUL</b>",
  ];

  const safeFunctions = ["_update", "HARDCORE SELL LIMIT"];
  const renouncedList = [
    "Blacklist",
    "Whitelist",
    "Trading Disable",
    "Max Transaction",
    "Set Tax",
    "Max Wallet",
  ];

  try {
    const response = await fetch(
      `https://ttfapiv2.ttfbot.com/coolscan?contract=${contractAddress}&chain=${chain}&apiKey=${TTF_API_TOKEN}&airdrops=true`
    );

    const data = await response.json();
    //console.log(data);

    if (!data.token || data.error) {
      console.log(
        `The contract (${contractAddress}) cannot be verified by TTF API`
      );
      return "unverified";
    }

    let security;
    let honeyPot;

    if (chain === "eth") {
      security = data.token.security;
      honeyPot = data.market.taxes.honeyPot;
    } else if (chain === "base") {
      security = data.security;
      honeyPot = data.tax.isHoneypot;
    }

    for (const warning of security) {
      if (rugList.includes(warning)) {
        if (!renouncedList.includes(warning)) {
          console.log(
            `The contract (${contractAddress}) is probably a scam (no renounce)`
          );
          return false;
        }
      } else if (warning.includes("are external contracts")) {
        console.log(
          `The contract (${contractAddress}) is probably a scam due to external contracts`
        );
        return false;
      } else if (warning.includes("FUNCTIONS:")) {
        if (!safeFunctions.some((func) => warning.includes(func))) {
          console.log(
            `The contract (${contractAddress}) is probably a scam (unsafe functions)`
          );
          return false;
        }
      } else if (
        warning.includes("Honeypot") ||
        warning.includes("BE CAREFUL")
      ) {
        console.log(`The contract (${contractAddress}) is probably a scam`);
        return false;
      }
    }

    if (honeyPot) {
      console.log(
        `The contract (${contractAddress}) is identified as a honeypot`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error fetching or processing data from TTF API:", error);
    return "unverified";
  }
}

async function getSourceCode(contractAddress, chainId) {
  let chainNum;
  if (chainId === "ethereum") {
    chainNum = 1;
  } else if (chainId === "base") {
    chainNum = 8453;
  }

  try {
    const response = await fetch(
      `https://api.etherscan.io/v2/api?chainId=${chainNum}&module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`
    );

    const data = await response.json();

    if (!data.result) {
      console.log("The contract cannot be fetched from Etherscan API");
      return null;
    }

    let jsonAnswer = data.result[0].SourceCode;

    if (!jsonAnswer.startsWith("{{")) {
      return jsonAnswer;
    }

    let stringAnswer = data.result[0].SourceCode.slice(1, -1);
    jsonAnswer = JSON.parse(stringAnswer);

    let sourceCode = "";

    for (const key in jsonAnswer.sources) {
      const partialSourceCode = jsonAnswer.sources[key].content;
      sourceCode += partialSourceCode;
    }

    return sourceCode;
  } catch (error) {
    console.error("Error fetching or processing data from Etherscan:", error);
    return null;
  }
}

module.exports = { useTTFBotAPI, getSourceCode };
