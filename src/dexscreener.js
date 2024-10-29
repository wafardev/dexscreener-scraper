async function getLatestTokenProfile() {
  try {
    const response = await fetch(
      "https://api.dexscreener.com/token-profiles/latest/v1",
      {
        method: "GET",
        headers: {},
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error fetching latest token profile:", error);
    return null;
  }
}

module.exports = { getLatestTokenProfile };
