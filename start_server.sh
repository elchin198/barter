#!/bin/bash

# This script starts the Node.js server in production mode on Hostinger
# It also sets up basic environment variables if not already set

# Set environment variables if not already set
export NODE_ENV=production
export PORT=${PORT:-8080}
export SESSION_SECRET=${SESSION_SECRET:-"bartertap_secure_session_key_$(date +%s)"}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set. Please set it in .env file or environment variables."
fi

# Attempt to read DATABASE_URL from .env file if exists and not set in environment
if [ -z "$DATABASE_URL" ] && [ -f ".env" ]; then
  export DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
  echo "Read DATABASE_URL from .env file"
fi

# Display startup information
echo "Starting BarterTap Server"
echo "========================="
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database URL: ${DATABASE_URL:0:10}..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Node modules not found, installing dependencies..."
  npm install
fi

# Initialize database tables
echo "Initializing database..."
node server/init_db.js

# Start the server
echo "Starting server..."
node server/index.js