const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());


app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "health-v2",
    port: process.env.PORT || 3001
  });
});

//starting server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on port ${PORT}');
})