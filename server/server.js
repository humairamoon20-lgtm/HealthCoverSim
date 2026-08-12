const express = require('express');
const cors = require('cors');
const path = require('path');
const quotesRouter = require('./routes/quotes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/quotes', quotesRouter);

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'HealthCoverSim API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HealthCoverSim server running on http://localhost:${PORT}`);
});
