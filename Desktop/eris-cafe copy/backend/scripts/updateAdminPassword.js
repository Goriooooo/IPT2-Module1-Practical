import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@eriscafe.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', admin.email);
    console.log('Current password field:', admin.password ? 'exists' : 'missing');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update the admin password
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email: admin@eriscafe.com');
    console.log('🔑 Password: admin123');
    console.log('🔐 Password is now properly hashed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
};

updateAdminPassword();
