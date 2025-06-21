const express = require("express");
const router = express.Router();
const { getMockSocialMedia, getDisasterSocialMedia } = require("../controllers/socialMediaController");

router.get("/mock-social-media", getMockSocialMedia);
router.get("/disaster/:id/social-media", getDisasterSocialMedia);

module.exports = router;
