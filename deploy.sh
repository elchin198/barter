#!/bin/bash

# Hostinger deployment script for BarterTap.az

# Set environment variables
export NODE_ENV=production

# Create log and upload directories if they don't exist
echo "Creating necessary directories..."
mkdir -p /home/u726371272/bartertap.az/logs
mkdir -p /home/u726371272/bartertap.az/public_html/uploads
mkdir -p /home/u726371272/bartertap.az/public_html/dist

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build the application
echo "Building the application..."
npm run build

# Copy static files to public_html directory
echo "Copying files to public_html directory..."
cp -r dist/client/* /home/u726371272/bartertap.az/public_html/dist/client/
cp client/public/favicon.ico /home/u726371272/bartertap.az/public_html/dist/client/
cp -r client/public/images /home/u726371272/bartertap.az/public_html/dist/client/
cp public/logo.png /home/u726371272/bartertap.az/public_html/dist/client/

# Create PM2 config if not exists
if [ ! -f "ecosystem.config.js" ]; then
  echo "Creating PM2 ecosystem.config.js..."
  cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bartertap',
    script: 'dist/server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    watch: false,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/u726371272/bartertap.az/logs/app-error.log',
    out_file: '/home/u726371272/bartertap.az/logs/app-out.log',
    merge_logs: true,
    time: true
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

# Ensure nginx configuration is set
echo "Setting up Nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/bartertap.az.conf" ]; then
  echo "Creating Nginx configuration..."
  cp nginx.conf /etc/nginx/sites-available/bartertap.az.conf
  ln -sf /etc/nginx/sites-available/bartertap.az.conf /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
fi

echo "Deployment completed successfully!"
echo "BarterTap.az is now accessible at https://bartertap.az"