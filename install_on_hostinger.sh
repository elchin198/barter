#!/bin/bash

# This script helps install the application on Hostinger
# Run it on your local machine after cloning the repository

# Build the production-ready files
echo "Building application..."
npm run build

# Create necessary server files
echo "Setting up server files..."

# Create package.json for the server
cat > package.json << 'EOF'
{
  "name": "bartertap",
  "version": "1.0.0",
  "description": "BarterTap Platform",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.6.0",
    "connect-pg-simple": "^9.0.0",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "drizzle-orm": "^0.27.2",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.0",
    "ws": "^8.13.0",
    "zod": "^3.21.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create .env file
cat > .env << 'EOF'
# Database URL (will be overridden by Hostinger MySQL credentials)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bartertap
NODE_ENV=production
PORT=8080
SESSION_SECRET=bartertap_secret_key_replace_this_in_production
EOF

# Create .htaccess file
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # If the request is for an existing file, directory or symlink, serve it directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d [OR]
  RewriteCond %{REQUEST_FILENAME} -l
  RewriteRule ^ - [L]
  
  # For API requests, forward to Node.js server
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/ws
  RewriteRule ^(.*)$ http://localhost:8080/$1 [P,L]
  
  # For all other requests, serve the built frontend
  RewriteRule ^ index.html [L]
</IfModule>

# Don't show directory listings
Options -Indexes

# PHP settings
<IfModule mod_php7.c>
  php_flag display_errors Off
  php_value max_execution_time 300
  php_value memory_limit 256M
  php_value post_max_size 64M
  php_value upload_max_filesize 16M
</IfModule>
EOF

# Create Hostinger setup instructions
cat > hostinger_setup.md << 'EOF'
# Hostinger Setup Instructions

## Basic Setup

1. Log into your Hostinger control panel
2. Navigate to the "Website" section
3. Select "File Manager" or use FTP access
4. Upload all files from the dist directory to the public_html directory

## Database Setup

1. Go to "Databases" in the Hostinger control panel
2. Create a new MySQL database
3. Note down the database name, username, password, and host
4. Open the .env file and update the DATABASE_URL with your Hostinger MySQL credentials:
   ```
   DATABASE_URL=mysql://{username}:{password}@{host}:3306/{database}
   ```

## Node.js Setup

Hostinger supports Node.js applications through their hPanel:

1. Go to "Website" → "Node.js"
2. Create a new Node.js application
3. Set the following:
   - Entry point: server/index.js
   - Node.js version: 18.x (LTS)
   - NPM version: Latest
4. Click "Enable Node.js"
5. After enabling, go to the Terminal tab
6. Run the following commands:
   ```
   npm install
   node server/index.js
   ```

## Troubleshooting

If you encounter 403 Forbidden errors:
1. Ensure all files have proper permissions (usually 644 for files, 755 for directories)
2. Check if .htaccess is correctly uploaded and has the proper permissions
3. Verify that mod_rewrite is enabled on the server
4. Contact Hostinger support if issues persist
EOF

# Create a "dist" directory for deployment
mkdir -p dist
cp -r dist/* dist/
cp .env dist/
cp .htaccess dist/
cp package.json dist/
cp -r server dist/
cp -r shared dist/
mkdir -p dist/public/uploads/{avatars,items}

echo "Installation files created. Upload the contents of the 'dist' directory to your Hostinger hosting."
echo "Follow the instructions in hostinger_setup.md for further configuration."