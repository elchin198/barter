#!/bin/bash

# Hostinger deployment script for BarterTap.az

# Set environment variables
export NODE_ENV=production

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build the application
echo "Building the application..."
npm run build

# Create PM2 config if not exists
if [ ! -f "ecosystem.config.js" ]; then
  echo "Creating PM2 ecosystem.config.js..."
  cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bartertap',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
EOF
fi

# Start/restart the application with PM2
if pm2 list | grep -q "bartertap"; then
  echo "Restarting application with PM2..."
  pm2 restart bartertap
else
  echo "Starting application with PM2..."
  pm2 start ecosystem.config.js
fi

echo "Deployment completed successfully!"