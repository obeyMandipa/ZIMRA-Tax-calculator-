// Interbank.js
// Routes for managing interbank rates, allowing authenticated users to add new rates and anyone to view the latest rates, with proper error handling and data validation

const express = require('express');
const InterbankRate = require('../models/interbankRate');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all rates (latest 20)
router.get('/', async (req, res) => {
  try {
    const rates = await InterbankRate.find()
      .sort({ date: -1 })
      .limit(20)
      .populate('userId', 'name email');
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// POST new rate
router.post('/', auth, async (req, res) => {
  try {
    const { rate, description } = req.body;
    const newRate = new InterbankRate({ 
      rate, 
      description, 
      date: new Date(req.body.date || Date.now()),
      userId: req.user._id 
    });
    await newRate.save();
    res.status(201).json(newRate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE rate by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const rate = await InterbankRate.findByIdAndDelete(req.params.id);
    if (!rate) {
      return res.status(404).json({ error: 'Rate not found' });
    }
    res.json({ message: 'Rate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rate' });
  }
});

module.exports = router;
