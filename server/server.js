const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend
const clientDist = path.join(__dirname, '..', 'client', 'dist');
console.log('Serving static files from:', clientDist);
app.use(express.static(clientDist));

// All non-API routes return index.html (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      console.error('sendFile error:', err.message, '| path:', clientDist);
      res.status(500).send('Frontend not found. Path: ' + clientDist);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Budget Planner running on http://localhost:${PORT}`);
});
