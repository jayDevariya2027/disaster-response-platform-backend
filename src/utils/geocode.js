const axios = require("axios");
const supabase = require("./supabase");

const CACHE_TTL = 60 * 60 * 1000;

const generateCacheKey = (description) =>
  `geocode:${description.toLowerCase()}`;

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

//openstreet map
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

const getLocationFromDescription = async (description) => {
  const cacheKey = generateCacheKey(description);

  const { data: cached } = await supabase
    .from("cache")
    .select("*")
    .eq("key", cacheKey)
    .single();

  if (cached) {
    const now = Date.now();
    const expiresAt = new Date(cached.expires_at).getTime();

    if (expiresAt > now) {
      console.log("returning cached data for get location from description ...")
      return {
        location_name: cached.value.location_name,
        location: `SRID=4326;POINT(${cached.value.coordinates.lng} ${cached.value.coordinates.lat})`,
      };
    }
  }

  let location_name, coordinates;

  try {
    location_name = await extractLocationFromGemini(description);
    if (!location_name) throw new Error("Gemini returned no location");

    coordinates = await geocodeLocation(location_name);
    if (!coordinates) throw new Error("Geocoding failed");
  } catch (err) {
    console.warn(`⚠️ Location fallback used: ${err.message}`);
    location_name = "Manhattan, NYC";
    coordinates = { lat: 40.7831, lng: -73.9712 };
  }

  const value = {
    location_name,
    coordinates,
  };

  await supabase.from("cache").upsert({
    key: cacheKey,
    value,
    expires_at: new Date(Date.now() + CACHE_TTL).toISOString(),
  });

  return {
    location_name,
    location: `SRID=4326;POINT(${coordinates.lng} ${coordinates.lat})`,
  };
};

module.exports = {
  getLocationFromDescription,
};
