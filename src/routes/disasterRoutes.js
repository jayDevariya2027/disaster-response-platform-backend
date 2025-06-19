const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster,
} = require("../controllers/disasterController");

router.use(auth);

router.post("/", createDisaster);
router.get("/", getDisasters);
router.put("/:id", updateDisaster);
router.delete("/:id", deleteDisaster);

module.exports = router;
