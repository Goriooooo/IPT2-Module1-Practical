import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import reservationRoutes from "./routes/reservations.js";
import adminRoutes from "./routes/admin.js";
import feedbackRoutes from "./routes/feedback.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import notificationRoutes from "./routes/notifications.js";
import backupRoutes from "./routes/backup.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - CORS must come before routes
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://eris-site.vercel.app',
    'https://eris-site-*.vercel.app' // For preview deployments
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers for Google OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());

// Debug endpoint (before DB middleware)
app.get("/api/debug", (req, res) => {
  res.json({
    mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
    mongoUriStart: process.env.MONGO_URI?.substring(0, 20) || '',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => !k.includes('VERCEL'))
  });
});

// Health check route (before DB middleware)
app.get("/", (req, res) => {
  res.json({ message: "Eris Cafe API is running" });
});

// Ensure database connection before handling API requests
app.use('/api', async (req, res, next) => {
  // Skip database for debug endpoint
  if (req.path === '/debug') return next();
  
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/backup", backupRoutes);

// Export for Vercel serverless functions
export default app;