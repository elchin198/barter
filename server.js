/**
 * BarterTap Hostinger Uyğunlaşdırılmış Express Server
 * 
 * Bu server faylı həm yerli inkişaf mühitində, həm də Hostinger kimi paylaşılan hosting mühitlərində işləmək üçün hazırlanmışdır.
 * - Yerli rejimdə tam Express server işlədir
 * - Hostinger rejimində statik faylları təqdim etmək üçün işlədilir
 */

const express = require('express');
const compression = require('compression');
const path = require('path');
const cors = require('cors');
const serveStatic = require('serve-static');
const fs = require('fs');

// Server konfiqurasiyası
const app = express();
const PORT = process.env.PORT || 3000;
const isHostinger = process.env.HOSTINGER === 'true';

// Middleware
app.use(compression()); // Sıxışdırma tətbiq et
app.use(express.json()); // JSON body parser
app.use(cors()); // CORS

// Statik fayllar
const clientBuildPath = path.join(__dirname, 'dist');
app.use(serveStatic(clientBuildPath, {
  maxAge: '1d', // Caching
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
  }
}));

// API marşrutları
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: isHostinger ? 'hostinger' : 'development' });
});

// Hostinger mühitində API simulyasiyaları
if (isHostinger) {
  console.log('Running in Hostinger-compatible mode');
  
  // Hostinger mühitində əlavə API endpoint nümunələri
  app.get('/api/hostinger-info', (req, res) => {
    res.json({
      mode: 'hostinger',
      serverTime: new Date().toISOString(),
      message: 'API endpoints available through proxy'
    });
  });
}

// Bütün digər sorğuları index.html-ə yönləndir (SPA marşrutlaması üçün)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Serveri başlat
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${isHostinger ? 'Hostinger' : 'Development'}`);
  console.log(`Static files served from: ${clientBuildPath}`);
});

// Hostinger üçün fallback informasiyası
console.log(`
====================================================
HOSTINGER DEPLOYMENT INFORMATION:
====================================================
1. Copy all files from the 'dist' directory to Hostinger's public_html folder
2. Make sure to include the .htaccess file
3. For API endpoints, use the PHP proxy included in api.php
====================================================
`);