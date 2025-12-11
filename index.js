// index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const dbUser = "asset-verse";

const dbPass = "wESmJsfCwH3k14os";
const mongoURI = `mongodb+srv://${dbUser}:${dbPass}@cluster0.wpjlndq.mongodb.net/assetverse?retryWrites=true&w=majority`;

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch(err => console.error("❌ MongoDB connection failed:", err.message));

// Test route
app.get("/", (req, res) => {
    res.send("AssetVerse Server Running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
