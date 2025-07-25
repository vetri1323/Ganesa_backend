import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';

dotenv.config();

async function checkCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the categories collection
    const Category = mongoose.model('Category');
    
    // Find all categories
    const categories = await Category.find({});
    console.log('Found categories:', categories);
    
    // Check the schema of the first category
    if (categories.length > 0) {
      console.log('First category schema:', Object.keys(categories[0]._doc));
      console.log('First category data:', JSON.stringify(categories[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking categories:', error);
    process.exit(1);
  }
}

checkCategories();
