const { getCachedDisasterById } = require("../utils/disasterFetcher");
const { analyzeImageWithGemini } = require("../utils/imageVerification");
const supabase = require("../utils/supabase");

const verifyImage = async (req, res) => {
  const { imageUrl } = req.body;
  const disaster_id = req.params.id;

  if (!imageUrl)
    return res.status(400).json({ error: "Image URL is required" });

  try {
    // 1. Get cached disaster details
    const { disaster } = await getCachedDisasterById(disaster_id);

    // 2. Analyze with Gemini
    const { source, result } = await analyzeImageWithGemini(
      imageUrl,
      disaster.title
    );

    // 3. Save report
    await supabase.from("reports").insert([
      {
        disaster_id,
        image_url: imageUrl,
        verification_status: result,
        created_at: new Date().toISOString(),
      },
    ]);

    return res.status(200).json({ source, ...result });
  } catch (err) {
    console.error("verifyImage error:", err.message);
    return res.status(500).json({ error: "Failed to verify image" });
  }
};


module.exports = { verifyImage };
