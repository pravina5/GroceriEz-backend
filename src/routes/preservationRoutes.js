const express = require("express");
const { fetchPreservationTips } = require("../controllers/preservationController");

const router = express.Router();
router.post("/", fetchPreservationTips);

module.exports = router;
