#!/bin/bash

# Exit on error
set -e

echo "=== BarterTap.az Hostinger Installation Script ==="
echo "This script will set up the Node.js application on Hostinger"

# 1. Check if we're on the right server
if [ "$(whoami)" != "u726371272" ]; then
  echo "This script must be run on the Hostinger server as user u726371272"
  echo "Connect via SSH first, then run this script"
  exit 1
fi

# 2. Create necessary directories
echo "Creating necessary directories..."
mkdir -p ~/public_html/logs
mkdir -p ~/public_html/uploads/avatars
mkdir -p ~/public_html/uploads/items

# 3. Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd ~/public_html
npm install --production

# 4. Set up environment variables
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production

# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=u726371272_barter_db
# DB_PASSWORD will be set manually
DB_NAME=u726371272_barter_db

# Session Secret
SESSION_SECRET=bartertap-production-secret-key

# Website Settings
BASE_URL=https://bartertap.az
UPLOAD_DIR=/home/u726371272/public_html/uploads
EOF

  echo "Please edit .env file and set DB_PASSWORD manually"
fi

# 5. Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
  echo "PM2 is not installed. Installing PM2 globally..."
  npm install -g pm2
fi

# 6. Start the application with PM2
echo "Starting the application with PM2..."
pm2 start ecosystem.config.js

# 7. Save the PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# 8. Set up PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo -e "\n=== BarterTap.az installation complete ==="
echo "The application should now be running."
echo "You can check the status with: pm2 status"
echo "View logs with: pm2 logs bartertap"