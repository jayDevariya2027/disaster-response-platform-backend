const { geocodeLocation } = require("../utils/geocode");
const supabase = require("../utils/supabase");

const createResource = async (req, res) => {
  try {
    const { disaster_id, name, location_name, type } = req.body;

    if (!disaster_id || !name || !location_name || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const coordinates = await geocodeLocation(location_name);
    const location = `SRID=4326;POINT(${coordinates.lng} ${coordinates.lat})`;

    const { data, error } = await supabase
      .from("resources")
      .insert([{ disaster_id, name, location_name, location, type }])
      .select("*");

    if (error) throw new Error(error.message);

    console.log(`✅ Resource mapped: ${type} at ${location_name}`);

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("createResource error:", err.message);
    res.status(500).json({ error: "Failed to create resource" });
  }
};

const getNearbyResources = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { geometry } = req.query;

    if (!geometry) {
      return res.status(400).json({ error: "geometry parameter required" });
    }

    const { data, error } = await supabase.rpc("get_resources_nearby", {
      disaster: disaster_id,
      point_geometry: geometry,
    });

    if (error) throw new Error(error.message);

    res.status(200).json(data);
  } catch (err) {
    console.error("getNearbyResources error:", err.message);
    res.status(500).json({ error: "Failed to fetch nearby resources" });
  }
};


module.exports = {
  createResource,
  getNearbyResources,
};
