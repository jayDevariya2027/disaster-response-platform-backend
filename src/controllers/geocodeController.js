const axios = require("axios");

const extractLocationFromGemini = async (description) => {
  const prompt = `
    Extract the disaster location from the following description.

    Strictly return only the location in this exact format:
    [Landmark or Area], [City], [State]

    Rules:
    - Replace uncommon towns with the nearest major city
    - Use only administrative region names (no districts or tehsils)
    - Do not include "district", "tehsil", or any symbols like asterisks or periods
    - Avoid words like "near", "close to", or "approximately"
    - If multiple locations are mentioned, return only the most relevant one
    - Output must be a single line, comma-separated, with no explanation

    Description:
    "${description}"
    `;

  const response = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: { key: process.env.GEMINI_API_KEY },
    }
  );

  return (
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
  );
};

const geocodeLocation = async (locationName) => {
  const url = "https://nominatim.openstreetmap.org/search";

  const response = await axios.get(url, {
    params: {
      q: locationName,
      format: "json",
      limit: 1,
    },
    headers: {
      "User-Agent": "DisasterResponseApp/1.0 jaydevariya2027@gmail.com",
    },
  });

  const result = response.data?.[0];
  if (!result) return null;

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formatted_address: result.display_name,
  };
};

const extractAndGeocode = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ error: "Description is required" });

    const locationName = await extractLocationFromGemini(description);

    const geocoded = await geocodeLocation(locationName);
    if (!geocoded)
      return res.status(400).json({ error: "Could not geocode location" });

    const responseValue = {
      coordinates: geocoded,
      locationName,
    };

    return res.status(200).json({ source: "live", ...responseValue });
  } catch (err) {
    console.error("Geocode Error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to extract and geocode location" });
  }
};

module.exports = {
  extractAndGeocode,
};
