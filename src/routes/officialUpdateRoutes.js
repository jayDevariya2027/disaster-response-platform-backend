const express = require("express");
const router = express.Router();
const { getOfficialUpdates } = require("../controllers/officialUpdateController");

router.get("/official-updates", getOfficialUpdates);

module.exports = router;
