import express from "express";
import dotenv from "dotenv";
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
    'http://localhost:5174'
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Eris Cafe API is running" });
});

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    console.log("Connected to MongoDB for data persistence");
    app.listen(PORT, () => {
      console.log(`Server is running on localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });