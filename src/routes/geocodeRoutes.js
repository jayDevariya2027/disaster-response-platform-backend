const express = require("express");
const router = express.Router();
const { extractAndGeocode } = require("../controllers/geocodeController");

router.get("/", extractAndGeocode);

module.exports = router;
