const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.post('/calculate', async (req, res) => {
  try {
    const { usdAmount, zwAmount, interbankRate, appropriation, period, aidsLevy } = req.body;
    
    const taxDataPath = path.join(__dirname, '../tax-tables.json');
    const taxData = JSON.parse(await fs.readFile(taxDataPath, 'utf8'));
    
    let usdTax = 0, zwTax = 0, totalTax = 0;
    
    const usdFromZW = zwAmount ? parseFloat(zwAmount) / parseFloat(interbankRate) : 0;
    const total = parseFloat(usdAmount || 0) + usdFromZW;

    console.log(`USD: ${usdAmount}, ZW: ${zwAmount}, Total: ${total.toFixed(2)}, Period: ${period}`);

    if (zwAmount && appropriation) {
      const brackets = taxData.tax_brackets_by_period[period];
      
      // ✅ FIXED: Handle max: null (unlimited upper bracket)
      const bracket = brackets.find(b => {
        const inRange = (total >= b.min) && 
                       (b.max === null || total <= b.max);
        return inRange;
      });
      
      if (!bracket) {
        return res.json({ 
          message: `No matching bracket found for $${total.toFixed(2)} in ${period} period`
        });
      }

      totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;
      
      usdTax = (parseFloat(usdAmount || 0) / total) * totalTax;
      zwTax = (usdFromZW / total) * totalTax;

      if (aidsLevy) {
        usdTax *= 1.03;
        zwTax *= 1.03;
      }

      res.json({ 
        usdTax: parseFloat(usdTax.toFixed(2)), 
        zwTax: parseFloat(zwTax.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        bracketUsed: `${bracket.tax_rate}% (${bracket.min}-${bracket.max || '∞'})`
      });

    } else if (usdAmount || zwAmount) {
      const brackets = taxData.tax_brackets_by_period['Monthly'];
      const bracket = brackets.find(b => {
        return (total >= b.min) && (b.max === null || total <= b.max);
      });
      
      if (bracket) {
        totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;
        if (aidsLevy) totalTax *= 1.03;
        res.json({ totalTax: parseFloat(totalTax.toFixed(2)) });
      } else {
        res.json({ message: 'total is not taxable' });
      }
    } else {
      res.status(400).json({ error: 'USD or ZW amount required' });
    }
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ✅ NEW: Add endpoint to fetch tax brackets
router.get('/tax-brackets', (req, res) => {
  try {
    res.json(taxData.tax_brackets_by_period);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tax brackets' });
  }
});


module.exports = router;
