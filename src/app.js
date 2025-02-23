const express = require("express");
const cors = require("cors");
const preservationRoutes = require("./routes/preservationRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/preservation", preservationRoutes);

module.exports = app;
