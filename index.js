require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/profiles', profileRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
