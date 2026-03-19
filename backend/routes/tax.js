const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.post('/calculate', async (req, res) => {
  try {
    const {
      usdAmount,
      zwAmount,
      interbankRate,
      appropriation,
      period,
      aidsLevy
    } = req.body;

    // Load tax tables
    const taxDataPath = path.join(__dirname, '../tax-tables.json');
    const taxData = JSON.parse(await fs.readFile(taxDataPath, 'utf8'));
    
    let total = 0;
    let usdTax = 0;
    let zwTax = 0;

    // Convert ZW to USD if provided
    const usdFromZW = zwAmount ? zwAmount / interbankRate : 0;
    total = (usdAmount || 0) + usdFromZW;

    // Case 1: ZW provided AND appropriation checked
    if (zwAmount && appropriation) {
      if (!period) {
        return res.status(400).json({ error: 'Period is required for appropriation' });
      }

      // Find matching tax bracket
      const brackets = taxData.tax_brackets_by_period[period];
      if (!brackets) {
        return res.status(400).json({ error: `Invalid period: ${period}` });
      }

      const bracket = brackets.find(b => total >= b.min && total <= b.max);
      if (!bracket) {
        return res.json({ message: 'total is not taxable' });
      }

      // Calculate total tax
      const totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;

      // Appropriate tax to USD and ZW
      usdTax = (usdAmount / total) * totalTax;
      zwTax = (usdFromZW / total) * totalTax;

      // Apply AIDS levy if checked
      if (aidsLevy) {
        usdTax = usdTax * 0.03;
        zwTax = zwTax * 0.03;
      }

      res.json({ usdTax: parseFloat(usdTax.toFixed(2)), zwTax: parseFloat(zwTax.toFixed(2)) });

    // Case 2: ZW provided but no appropriation
    } else if (zwAmount) {
      const brackets = taxData.tax_brackets_by_period['Monthly']; // default period
      const bracket = brackets.find(b => total >= b.min && total <= b.max);
      
      if (bracket) {
        const totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;
        if (aidsLevy) totalTax *= 1.03;
        res.json({ totalTax: parseFloat(totalTax.toFixed(2)) });
      } else {
        res.json({ message: 'total is not taxable' });
      }

    // Case 3: Only USD provided
    } else if (usdAmount) {
      const brackets = taxData.tax_brackets_by_period['Monthly']; // default
      const bracket = brackets.find(b => total >= b.min && total <= b.max);
      
      if (bracket) {
        const totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;
        if (aidsLevy) totalTax *= 1.03;
        res.json({ usdTax: parseFloat(totalTax.toFixed(2)) });
      } else {
        res.json({ message: 'total is not taxable' });
      }

    } else {
      res.status(400).json({ error: 'USD or ZW amount is required' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
