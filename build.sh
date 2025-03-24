#!/bin/bash

# Build frontend
echo "Building frontend..."
npm run build

# Create dist directory
mkdir -p dist

# Copy built frontend files
echo "Copying frontend files..."
cp -r dist/* dist/

# Create server directory
mkdir -p dist/server

# Copy server files
echo "Copying server files..."
cp -r server/* dist/server/
cp -r shared dist/
cp package.json dist/
cp .env.production dist/.env

# Create .htaccess file
echo "Creating .htaccess file..."
cat > dist/.htaccess << 'EOF'
# Enable the rewrite engine
RewriteEngine On

# Serving Brotli compressed CSS/JS if available and the client accepts it
<IfModule mod_headers.c>
  # Serve brotli compressed CSS and JS files if they exist and the client accepts br encoding
  RewriteCond %{HTTP:Accept-encoding} br
  RewriteCond %{REQUEST_FILENAME}\.br -f
  RewriteRule ^(.*)\.css $1\.css\.br [QSA]
  RewriteRule ^(.*)\.js $1\.js\.br [QSA]

  # Serve correct content types and encodings
  RewriteRule \.css\.br$ - [T=text/css,E=no-gzip:1,E=BROTLI]
  RewriteRule \.js\.br$ - [T=text/javascript,E=no-gzip:1,E=BROTLI]

  <FilesMatch "(\.js\.br|\.css\.br)$">
    Header set Content-Encoding br
    Header append Vary Accept-Encoding
  </FilesMatch>
</IfModule>

# Handle front-end routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # API and WebSocket requests
  # If the request is for the API or WebSocket, send to Node.js server
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/ws
  # If you have a Node.js server running on port 8080
  RewriteRule ^(.*)$ http://localhost:8080/$1 [P,L]
  
  # For all static files
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # For all other requests, route to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  # XSS Protection
  Header set X-XSS-Protection "1; mode=block"
  
  # Prevent MIME-sniffing
  Header set X-Content-Type-Options "nosniff"
  
  # Referrer Policy
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  
  # HSTS (optional - enable once SSL is properly configured)
  # Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>

# Disable directory listing
Options -Indexes

# PHP settings (if using PHP)
<IfModule mod_php7.c>
  # Hide PHP version
  php_flag expose_php Off
  
  # Increase memory limit
  php_value memory_limit 256M
  
  # Max upload file size
  php_value upload_max_filesize 16M
  php_value post_max_size 32M
  
  # Max execution time
  php_value max_execution_time 300
</IfModule>

# In case of 500 errors, show an error page
ErrorDocument 500 /500.html
ErrorDocument 404 /404.html
ErrorDocument 403 /403.html
EOF

# Create index.php file for PHP hosting
echo "Creating index.php file..."
cat > dist/index.php << 'EOF'
<?php
// This file is needed for PHP hosting environments
// It simply forwards to the index.html file
include_once('index.html');
?>
EOF

# Create index.html file
echo "Creating index.html file..."
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarterTap - Barter Mübadilə Platformu</title>
  <meta name="description" content="BarterTap - Azərbaycanda əşyaların barter mübadiləsi üçün platformadır. Burada istifadə etmədiyiniz əşyaları sizə lazım olan əşyalara səmərəli şəkildə dəyişə bilərsiniz." />
  <meta name="keywords" content="barter, mübadilə, əşya mübadiləsi, ikinci əl, Azerbaijan, tapıntı, dəyişmə, barter platform, elektron mübadilə" />
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOF

echo "Build complete. Upload contents of 'dist' directory to Hostinger."