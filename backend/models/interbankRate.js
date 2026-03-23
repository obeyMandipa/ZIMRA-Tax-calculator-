// InterbankRate.js
// Schema for storing interbank rates with validation for required fields and data types

const mongoose = require('mongoose');

const interbankRateSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('InterbankRate', interbankRateSchema);
