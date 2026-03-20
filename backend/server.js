const express = require('express');
const cors = require('cors');
const taxRoutes = require('./routes/tax');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/api/tax', taxRoutes);

app.use('/uploads', express.static('uploads'));

//MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taxcalc');

//Routes
ap.use('/api/auth', require('./routes/auth'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/tax', require('./routes/tax'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
