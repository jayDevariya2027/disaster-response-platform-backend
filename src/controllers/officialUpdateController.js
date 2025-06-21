// controllers/officialUpdateController.js
const { fetchFemaUpdates } = require("../utils/browseScraper");
const supabase = require("../utils/supabase");

const getOfficialUpdates = async (req, res) => {
  const cacheKey = "official-updates:fema";

  // 1. Check cache
  const { data: cached } = await supabase
    .from("cache")
    .select("*")
    .eq("key", cacheKey)
    .single();

  if (cached) {
    const now = Date.now();
    const expiresAt = new Date(cached.expires_at).getTime();

    if (expiresAt > now) {
      console.log("✅ Returning cached FEMA updates");
      return res.status(200).json({ source: "cache", updates: cached.value });
    }
  }

  // 2. Scrape live data
  try {
    const updates = await fetchFemaUpdates();

    // 3. Cache result
    await supabase.from("cache").upsert({
      key: cacheKey,
      value: updates,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    return res.status(200).json({ source: "live", updates });
  } catch (err) {
    console.error("getOfficialUpdates error:", err.message);
    return res.status(500).json({ error: "Failed to fetch official updates" });
  }
};

module.exports = { getOfficialUpdates };
