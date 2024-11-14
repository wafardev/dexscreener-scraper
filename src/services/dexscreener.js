const axios = require("axios");

async function getLatestTokenProfiles() {
  try {
    console.log("Starting fetch...");

    const response = await axios.get(
      "https://api.dexscreener.com/token-profiles/latest/v1"
    );

    console.log("Fetch response received.");

    const data = response.data;

    //console.log("Data received:", data);

    return data.length > 0 ? data : null;
  } catch (error) {
    console.error("Error fetching latest token profiles:", error.message);
    console.error("Full error object:", error);
    return null;
  }
}

module.exports = { getLatestTokenProfiles };
