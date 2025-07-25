import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from './models/Customer.js';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Try to fetch customers
    const customers = await Customer.find({}).limit(5);
    console.log('\n📋 Found customers:', customers.length);
    console.log('Sample customer:', customers[0] || 'No customers found');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
