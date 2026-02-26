import app from './server.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Connect to MongoDB and start server for local development
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
