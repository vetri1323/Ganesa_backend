import express from 'express';
import Customer from '../models/Customer.js';

const router = express.Router();

// Get all statuses
router.get('/', async (req, res) => {
  try {
    const statuses = await Customer.distinct('status');
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
