import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🔍 Testing MongoDB Connection...\n');
  console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ Not found');
  console.log('Connection string:', process.env.MONGO_URI?.substring(0, 50) + '...\n');

  try {
    console.log('⏳ Attempting to connect to MongoDB Atlas...');
    console.log('⏰ Timeout set to 10 seconds for testing...\n');

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for testing
      socketTimeoutMS: 45000,
    });

    console.log('✅ SUCCESS! MongoDB Connected:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('🔌 Connection state:', conn.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    await mongoose.connection.close();
    console.log('\n✅ Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('Server selection timed out')) {
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.log('   → Go to: https://cloud.mongodb.com/');
      console.log('   → Network Access → Add your current IP or use 0.0.0.0/0 for testing');
      console.log('\n2. Verify your internet connection');
      console.log('\n3. Check if MongoDB Atlas is experiencing issues');
      console.log('   → Visit: https://status.mongodb.com/');
      console.log('\n4. Verify the connection string in .env file');
    }
    
    process.exit(1);
  }
};

testConnection();
