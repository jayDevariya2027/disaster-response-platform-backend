const express = require("express");
const router = express.Router();
const { verifyImage } = require("../controllers/imageVerifyController");

router.post("/:id/verify-image", verifyImage);

module.exports = router;
