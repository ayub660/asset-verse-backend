// index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------
// MongoDB connection
// -----------------------------
const dbUser = "asset-verse";
const dbPass = "wESmJsfCwH3k14os";
const mongoURI = `mongodb+srv://${dbUser}:${dbPass}@cluster0.wpjlndq.mongodb.net/assetverse?retryWrites=true&w=majority`;

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch(err => console.error("❌ MongoDB connection failed:", err.message));

// -----------------------------
// User Schema
// -----------------------------
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "hr"], required: true },
    profileImage: { type: String }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// -----------------------------
// Auth Routes
// -----------------------------

// Register
app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, profileImage } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role, profileImage });
        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ message: "Login successful", token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// JWT Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// Get current logged-in user (Profile)
app.get("/api/users/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Example Protected Route
app.get("/api/protected", verifyToken, (req, res) => {
    res.json({ message: `Hello ${req.user.id}, you are ${req.user.role}` });
});

// Test route
app.get("/", (req, res) => {
    res.send("AssetVerse Server Running!");
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
