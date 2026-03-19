const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.post('/calculate', async (req, res) => {
  try {
    const { usdAmount, zwAmount, interbankRate, appropriation, period, aidsLevy } = req.body;
    
    const taxDataPath = path.join(__dirname, '../tax-tables.json');
    const taxData = JSON.parse(await fs.readFile(taxDataPath, 'utf8'));
    
    // DECLARE VARIABLES UPFRONT
    let usdTax = 0;
    let zwTax = 0;
    let totalTax = 0;
    
    const usdFromZW = zwAmount ? parseFloat(zwAmount) / parseFloat(interbankRate) : 0;
    const total = parseFloat(usdAmount || 0) + usdFromZW;

    console.log(`USD: ${usdAmount}, ZW: ${zwAmount}, Total: ${total.toFixed(2)}, Period: ${period}`);

    if (zwAmount && appropriation) {
      const brackets = taxData.tax_brackets_by_period[period];
      
      const bracket = brackets.find(b => total >= b.min && total <= b.max);
      if (!bracket) {
        const highestMax = brackets[brackets.length-1].max;
        return res.json({ message: `Total $${total.toFixed(2)} exceeds ${period} max ($${highestMax.toFixed(2)})` });
      }

      // ✅ YOUR 675.62 → Monthly 25% bracket ✓
      totalTax = (total * (bracket.tax_rate / 100)) - bracket.deductable;
      
      usdTax = (parseFloat(usdAmount) / total) * totalTax;
      zwTax = (usdFromZW / total) * totalTax;

      if (aidsLevy) {
        usdTax *= 1.03;
        zwTax *= 1.03;
      }

      res.json({ 
        usdTax: parseFloat(usdTax.toFixed(2)), 
        zwTax: parseFloat(zwTax.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2))
      });

    } else if (usdAmount || zwAmount) {
      const brackets = taxData.tax_brackets_by_period['Monthly'];
      const bracket = brackets.find(b => total >= b.min && total <= b.max);
      
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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
