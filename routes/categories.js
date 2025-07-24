import express from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});

// Create a new category
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('url').optional().trim().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, url } = req.body;
      
      // Check if category already exists (case insensitive)
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          error: 'Category with this name already exists' 
        });
      }

      const category = new Category({
        name,
        url: url || ''
      });

      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ 
        error: 'Failed to create category',
        details: error.message
      });
    }
  }
);

// Update a category
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('url').optional().trim().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, url } = req.body;
      
      // Check if category exists
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if name is being changed and if new name already exists
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ 
          _id: { $ne: req.params.id },
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        
        if (existingCategory) {
          return res.status(400).json({ 
            error: 'Another category with this name already exists' 
          });
        }
      }

      // Update category
      category.name = name;
      if (url !== undefined) category.url = url;
      
      await category.save();
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ 
        error: 'Failed to update category',
        details: error.message
      });
    }
  }
);

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has any subcategories
    const subcategoriesCount = await SubCategory.countDocuments({ category: req.params.id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing subcategories. Please delete subcategories first.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Failed to delete category',
      details: error.message
    });
  }
});

export default router;
