const axios = require("axios");
const supabase = require("./supabase");

const CACHE_TTL = 60 * 60 * 1000;
const generateCacheKey = (url, title) => `verify:${title}:${url}`;

const downloadImageAsBase64 = async (url) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data).toString("base64");
};

const analyzeImageWithGemini = async (imageUrl, disasterTitle) => {
  const prompt = `This image was submitted as evidence of a disaster titled "${disasterTitle}". 
  Analyze whether this image is truly related to the disaster. Is it authentic? 
  Respond in this format: 
  YES, followed by a short reason if it is genuine.
  NO, followed by a short reason if it is fake or unrelated.
  Example: YES, this image shows flooding in the mentioned location.`;

  const cacheKey = generateCacheKey(imageUrl, disasterTitle);
  const { data: cached } = await supabase
    .from("cache")
    .select("*")
    .eq("key", cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log("♻️ Returning cached image verification");
    return { source: "cache", result: cached.value };
  }

  const base64Image = await downloadImageAsBase64(imageUrl);

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Unknown";

    let is_authentic = null;
    let reason = raw;

    if (/^yes[,:\s]/i.test(raw)) {
      is_authentic = true;
      reason = raw.replace(/^yes[,:\s]*/i, "").trim();
    } else if (/^no[,:\s]/i.test(raw)) {
      is_authentic = false;
      reason = raw.replace(/^no[,:\s]*/i, "").trim();
    }

    const result = { is_authentic, reason };

    await supabase.from("cache").upsert({
      key: cacheKey,
      value: result,
      expires_at: new Date(Date.now() + CACHE_TTL).toISOString(),
    });

    return { source: "live", result };
  } catch (err) {
    console.error("❌ Gemini API error:", err.response?.data || err.message);
    throw new Error("Gemini API request failed");
  }

};

module.exports = { analyzeImageWithGemini };
