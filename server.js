import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import weatherRoutes from "./src/routes/weatherRoutes.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const CLIENT_URL = process.env.CLIENT_URL || "https://frontend-weather-app-diyw.onrender.com";

app.use(
  cors({
    origin: CLIENT_URL,
  })
);
app.use(express.json());

connectDB();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Weather API is running" });
});

app.use("/api/weather", weatherRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

