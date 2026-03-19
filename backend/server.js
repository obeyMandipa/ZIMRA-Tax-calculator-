const express = require('express');
const cors = require('cors');
const taxRoutes = require('./routes/tax');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/tax', taxRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
