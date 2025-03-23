#!/bin/bash

# Exit on error
set -e

# Variables
HOSTINGER_USER="u726371272"
HOSTINGER_HOST="ftp.bartertap.az"
HOSTINGER_TARGET="/home/$HOSTINGER_USER/public_html"
BUILD_DIR="dist"

echo "=== BarterTap.az Deployment Script ==="
echo "This script will build and deploy the application to Hostinger"

# 1. Build the application
echo -e "\n=== Building application ==="
npm install
npm run build

# 2. Prepare the production files
echo -e "\n=== Preparing production files ==="

# Ensure the pm2 config exists
if [ ! -f ecosystem.config.js ]; then
  echo "Creating PM2 ecosystem.config.js file"
  cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "bartertap",
    script: "dist/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork"
  }]
};
EOF
fi

# Copy .env.production to .env in the build directory
if [ -f .env.production ]; then
  echo "Copying .env.production to $BUILD_DIR/.env"
  cp .env.production $BUILD_DIR/.env
fi

# Create placeholder directories in the build folder for uploads
mkdir -p $BUILD_DIR/public/uploads/avatars
mkdir -p $BUILD_DIR/public/uploads/items

# 3. Upload to Hostinger
echo -e "\n=== Uploading to Hostinger ==="
echo "This step should be performed manually via FTP client or Hostinger file manager"
echo "Upload the following directories and files to $HOSTINGER_TARGET:"
echo "- dist/ (all contents)"
echo "- ecosystem.config.js"
echo "- package.json"
echo "- package-lock.json"

# 4. Instructions for setting up on Hostinger
echo -e "\n=== Post-deployment steps ==="
echo "1. SSH into your Hostinger server"
echo "2. Navigate to $HOSTINGER_TARGET"
echo "3. Install dependencies: npm install --production"
echo "4. Start the application with PM2: pm2 start ecosystem.config.js"
echo "5. Ensure that the database has been set up correctly"

echo -e "\n=== Deployment preparation complete ==="
echo "You can now upload the files to Hostinger and follow the post-deployment steps."