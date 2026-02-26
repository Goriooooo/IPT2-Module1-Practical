import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error(`Error connecting to MongoDB: ${error.message}`);
        throw error;
    }

    return cached.conn;
} 