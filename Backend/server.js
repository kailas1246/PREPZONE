import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import openaiRoutes from "./routes/openaiRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import pistonRoutes from "./routes/pistonRoutes.js";
import mongoosePkg from 'mongoose';

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Mongoose Configuration
const { set } = mongoosePkg;
set('strictQuery', false);
set('bufferCommands', false);

// CORS Configuration
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: FRONTEND_ORIGIN, credentials: true }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.EXPRESS_JSON_LIMIT || '10mb' }));

// --- API ROUTES ---

// Middleware for logging (Optional/Debug)
app.use('/api/user', (req, res, next) => {
  try {
    console.log('[user] %s %s body=%o from %s', req.method, req.originalUrl, req.body, req.ip);
  } catch (e) {}
  next();
});

// API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/piston", pistonRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);

// --- STATIC FRONTEND SERVING (The "No Cold Start" Part) ---

/** * On your server, make sure your 'dist' folder is copied to 
 * a location relative to this file. 
 * Based on your root package.json: ../LOGIN/dist
 */
const distPath = path.join(__dirname, "../LOGIN/dist");

// 1. Serve the static assets (js, css, images)
app.use(express.static(distPath));

// 2. The "Catch-all" route. 
// If the request doesn't match an API route above, send the React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// --- DATABASE & SERVER START ---

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Connected");

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`🚀 Production Server running on port ${port}`);
      console.log(`📂 Serving frontend from: ${distPath}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

start();