console.log('🚀 Starting app...');

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/content', require('./routes/video.routes'));
app.use('/api/playlists', require('./routes/playlist.routes'));
app.use('/api/watch', require('./routes/watch.routes'));
app.use('/api/admin', require('./routes/admin.routes'));


app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🎬 Suffoclix API is running!',
    version: '1.0.0'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ MySQL Connected Successfully`);
  console.log(`🚀 Suffoclix Backend running on port ${PORT}`);
});