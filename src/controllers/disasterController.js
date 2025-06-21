const { getCachedDisasterById } = require("../utils/disasterFetcher");
const { getLocationFromDescription } = require("../utils/geocode");
const supabase = require("../utils/supabase");

// Helper to build audit logs
const createAuditTrail = (action, userId) => ({
  action,
  user_id: userId,
  timestamp: new Date().toISOString(),
});

const createDisaster = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const owner_id = req.user.id;

    const audit_trail = [createAuditTrail("create", owner_id)];

    const { location_name, location } = await getLocationFromDescription(
      description
    );

    const { data, error } = await supabase
      .from("disasters")
      .insert([
        {
          title,
          description,
          tags,
          location_name,
          location,
          owner_id,
          audit_trail,
        },
      ])
      .select("*");

    if (error) throw new Error(error.message);

    return res.status(201).json(data[0]);
  } catch (err) {
    console.error("Error in createDisaster:", err.message);
    return res.status(500).json({ error: "Failed to create disaster" });
  }
};

const getDisasters = async (req, res) => {
  try {
    const { tag } = req.query;

    let query = supabase
      .from("disasters")
      .select("*")
      .order("created_at", { ascending: false });
    if (tag) query = query.contains("tags", [tag]);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error in getDisasters:", err.message);
    return res.status(500).json({ error: "Failed to fetch disasters" });
  }
};

const updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: existing, error: fetchError } = await supabase
      .from("disasters")
      .select("audit_trail")
      .eq("id", id)
      .single();

    if (fetchError || !existing)
      return res.status(404).json({ error: "Disaster not found" });

    const updatedAuditTrail = [
      ...(existing.audit_trail || []),
      createAuditTrail("update", user_id),
    ];

    const { data, error } = await supabase
      .from("disasters")
      .update({ ...req.body, audit_trail: updatedAuditTrail })
      .eq("id", id)
      .select("*");

    if (error) throw new Error(error.message);

    return res.status(200).json(data[0]);
  } catch (err) {
    console.error("Error in updateDisaster:", err.message);
    return res.status(500).json({ error: "Failed to update disaster" });
  }
};

const deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("disasters").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return res.status(204).send();
  } catch (err) {
    console.error("Error in deleteDisaster:", err.message);
    return res.status(500).json({ error: "Failed to delete disaster" });
  }
};

const getDisasterById = async (req, res) => {
  const { id } = req.params;

  try {
    const { source, disaster } = await getCachedDisasterById(id);
    return res.status(200).json({ source, ...disaster });
  } catch (err) {
    console.error("getDisasterById error:", err.message);
    return res.status(404).json({ error: "Disaster not found" });
  }
};

const getReportsForDisaster = async (req, res) => {
  const disaster_id = req.params.id;

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("image_url, verification_status, created_at")
      .eq("disaster_id", disaster_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return res.status(200).json(data);
  } catch (err) {
    console.error("getReportsForDisaster error:", err.message);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
};

module.exports = {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster,
  getDisasterById,
  getReportsForDisaster
};
