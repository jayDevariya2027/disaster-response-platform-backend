const { getCachedDisasterById } = require("../utils/disasterFetcher");
const { socialMockPosts } = require("../utils/socialMock");
const supabase = require("../utils/supabase");

const getMockSocialMedia = async (req, res) => {
    return res.status(200).json(socialMockPosts);
};

const getDisasterSocialMedia = async (req, res) => {
    const disaster_id = req.params.id;
    const cacheKey = `social-media:${disaster_id}`;

    try {
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
            console.log("✅ Returning cached data for disaster social media");
                return res
                    .status(200)
                    .json({ source: "cache", posts: cached.value });
            }
        }

        // 2. Get cached disaster details
        const { disaster } = await getCachedDisasterById(disaster_id);
        const { location_name, tags = [] } = disaster;

        // 3. Prepare tag + location keyword matching
        const tagRegexList = tags.map((tag) =>
            new RegExp(`\\b${tag}\\b`, "i")
        );

        const locationParts = location_name
            ? location_name.split(",").map((p) => p.trim().toLowerCase())
            : [];

        // 4. Filter mock posts
        const filtered = socialMockPosts.filter(({ post }) => {
            const lowerPost = post.toLowerCase();

            const tagMatch = tagRegexList.some((regex) => regex.test(lowerPost));
            const locationMatch = locationParts.some((part) =>
                lowerPost.includes(part)
            );

            return tagMatch || locationMatch;
        });

        // 5. Cache filtered results
        await supabase.from("cache").upsert({
            key: cacheKey,
            value: filtered,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        });

        console.log(`✅ Social media posts filtered and cached for ${disaster_id}`);
        return res.status(200).json({ source: "live", posts: filtered });
    } catch (err) {
        console.error("❌ getDisasterSocialMedia error:", err.message);
        return res
            .status(500)
            .json({ error: "Failed to fetch social media posts" });
    }
};

module.exports = {
    getMockSocialMedia,
    getDisasterSocialMedia,
};
