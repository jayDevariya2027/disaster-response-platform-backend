const express = require("express");
const { createResource, getNearbyResources } = require("../controllers/resourceController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, createResource);
router.get("/:id/resources", getNearbyResources); 

module.exports = router;
