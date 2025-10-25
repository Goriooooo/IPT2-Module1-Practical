import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js'; // Use the new auth route

dotenv.config(); // Make sure it finds the .env file

const app = express();

// --- Middleware ---
app.use(cors()); // Allows your frontend to make requests
app.use(express.json()); // Allows the server to read JSON

// --- Routes ---
app.use('/api/auth', authRoutes); // Connects /api/auth to your new auth.js

// --- Database Connection ---
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    app.listen(PORT, () => console.log(`✅ Backend server running on port: ${PORT}`));
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
});