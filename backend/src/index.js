require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Root
app.get('/', (req, res) => res.json({ name: 'Sakhi Backend', status: 'running', docs: '/health for health check, /api/* for API routes' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/groups', require('./api/routes/groups'));
app.use('/api/members', require('./api/routes/members'));
app.use('/api/loans', require('./api/routes/loans'));
app.use('/api/transactions', require('./api/routes/transactions'));
app.use('/api/dashboard', require('./api/routes/dashboard'));
app.use('/api/reports', require('./api/routes/reports'));

app.listen(PORT, () => {
  console.log(`🚀 Sakhi backend running on http://localhost:${PORT}`);
  console.log(`📋 Dashboard API ready. Start the Telegram bot separately.`);
});
