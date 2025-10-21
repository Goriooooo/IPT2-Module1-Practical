import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World from Eris Cafe Backend!');
});

// Auth routes (includes orders and reservations)
app.use('/api/auth', authRoutes);

// Optional: MongoDB connection (commented out for now)
// import { connectDB } from './config/db.js';     
// import Product from './models/product.model.js';
// 
// app.post("/api/products", async (req, res) => {
//     const product = req.body;
//     if (!product.name || !product.price || !product.description) {
//         return res.status(400).json({ message: "Product data is required" });
//     }
//     const newProduct = new Product(product);
//     try {
//         await newProduct.save();
//         res.status(201).json({ success: true, data: newProduct });
//     } catch (error) {
//         console.error("Error saving product:", error);
//         res.status(500).json({ success: false, message: "Server Error" });
//     }
// });

app.listen(3000, () => {
    // connectDB(); // Commented out - using in-memory storage for now
    console.log('Server is running on localhost:3000');  
    console.log('Using in-memory storage for orders and reservations');
});