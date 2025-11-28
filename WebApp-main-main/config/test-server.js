const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Максимально простой CORS
app.use(cors());

// Простой тестовый endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
});