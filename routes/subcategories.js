import express from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';

const router = express.Router();

// Get all subcategories with category details
router.get('/', async (req, res) => {
  try {
    const subcategories = await SubCategory.find().populate('category', 'name url');
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subcategories',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get subcategory by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subcategory ID' });
    }
    
    const subcategory = await SubCategory.findById(req.params.id).populate('category', 'name url');
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

// Get subcategories by category ID
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const subcategories = await SubCategory.find({ category: categoryId });
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories by category:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subcategories',
      details: error.message
    });
  }
});

// Create a new subcategory
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Subcategory name is required'),
    body('categoryId').notEmpty().withMessage('Category ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid category ID format');
        }
        const category = await Category.findById(value);
        if (!category) {
          throw new Error('Category not found');
        }
        return true;
      }),
    body('description').optional().trim().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, categoryId, description } = req.body;
      
      // Check if subcategory already exists in this category (case insensitive)
      const existingSubCategory = await SubCategory.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        category: categoryId
      });
      
      if (existingSubCategory) {
        return res.status(400).json({ 
          error: 'A subcategory with this name already exists in the specified category' 
        });
      }

      const subcategory = new SubCategory({
        name,
        category: categoryId,
        description: description || ''
      });

      await subcategory.save();
      
      // Populate the category field before sending response
      const populatedSubcategory = await SubCategory
        .findById(subcategory._id)
        .populate('category', 'name url');
      
      res.status(201).json(populatedSubcategory);
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({ 
        error: 'Failed to create subcategory',
        details: error.message
      });
    }
  }
);

// Update a subcategory
router.put(
  '/:id',
  [
    param('id').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid subcategory ID format');
      }
      return true;
    }),
    body('name').trim().notEmpty().withMessage('Subcategory name is required'),
    body('categoryId').notEmpty().withMessage('Category ID is required')
      .custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid category ID format');
        }
        const category = await Category.findById(value);
        if (!category) {
          throw new Error('Category not found');
        }
        return true;
      }),
    body('description').optional().trim().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, categoryId, description } = req.body;
      const subcategoryId = req.params.id;
      
      // Check if subcategory exists
      const subcategory = await SubCategory.findById(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategory not found' });
      }
      
      // Check if name is being changed and if new name already exists in the same category
      if (name && (name !== subcategory.name || categoryId !== subcategory.category.toString())) {
        const existingSubCategory = await SubCategory.findOne({
          _id: { $ne: subcategoryId },
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          category: categoryId
        });
        
        if (existingSubCategory) {
          return res.status(400).json({ 
            error: 'A subcategory with this name already exists in the specified category' 
          });
        }
      }

      // Update subcategory
      subcategory.name = name;
      subcategory.category = categoryId;
      if (description !== undefined) subcategory.description = description;
      
      await subcategory.save();
      
      // Populate the category field before sending response
      const populatedSubcategory = await SubCategory
        .findById(subcategory._id)
        .populate('category', 'name url');
      
      res.json(populatedSubcategory);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      res.status(500).json({ 
        error: 'Failed to update subcategory',
        details: error.message
      });
    }
  }
);

// Delete a subcategory
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subcategory ID' });
    }
    
    const subcategory = await SubCategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    // Check if subcategory is being used in any customers
    // Note: You'll need to implement this check based on your Customer model
    // const customerCount = await Customer.countDocuments({ 'services.subCategory': req.params.id });
    // if (customerCount > 0) {
    //   return res.status(400).json({ 
    //     error: 'Cannot delete subcategory as it is being used by one or more customers' 
    //   });
    // }
    
    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ 
      error: 'Failed to delete subcategory',
      details: error.message
    });
  }
});

export default router;
