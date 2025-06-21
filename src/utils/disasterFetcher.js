const supabase = require("./supabase");
const CACHE_TTL = 60 * 60 * 1000; 

const getCachedDisasterById = async (disaster_id) => {
  const cacheKey = `disaster:${disaster_id}`;

  // Check cache
  const { data: cached } = await supabase
    .from("cache")
    .select("*")
    .eq("key", cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log("✅ Returning cached disaster details");
    return { source: "cache", disaster: cached.value };
  }

  // Fetch from DB
  const { data: disaster, error } = await supabase
    .from("disasters")
    .select("id, title, location_name, tags, description")
    .eq("id", disaster_id)
    .single();

  if (error || !disaster) throw new Error("Disaster not found");

  // Cache it
  await supabase.from("cache").upsert({
    key: cacheKey,
    value: disaster,
    expires_at: new Date(Date.now() + CACHE_TTL).toISOString(),
  });

  console.log("📦 Disaster details cached");
  return { source: "live", disaster };
};

module.exports = { getCachedDisasterById };
