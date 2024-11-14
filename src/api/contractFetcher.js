const { useTTFBotAPI, getSourceCode } = require("./apiCalls");
const { addContractToPath } = require("./tokenInfo");

async function fetchContract(tokenProfile) {
  //console.log("Fetching contract for token profile:", tokenProfile);

  const supportedChains = ["ethereum", "base"];

  if (
    !tokenProfile.chainId ||
    !supportedChains.includes(tokenProfile.chainId)
  ) {
    console.log(`Unsupported chain ID: ${tokenProfile.chainId}`);
    return;
  }

  const { chainId, tokenAddress } = tokenProfile;
  let response;
  try {
    response = await useTTFBotAPI(tokenAddress, chainId);

    if (response === false) {
      console.log("TTF API returned false for contract:", tokenAddress);
      return;
    }
  } catch (error) {
    console.error("Error fetching data from TTF API:", error);
    return;
  }

  let safeBool = response === true;

  const sourceCode = await getSourceCode(tokenAddress, chainId);

  try {
    await addContractToPath(tokenAddress, sourceCode, chainId, safeBool);
  } catch (error) {
    console.error("Error saving contract link:", error);
  }
}

module.exports = { fetchContract };
