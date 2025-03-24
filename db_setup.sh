#!/bin/bash

# This script sets up the MySQL database on Hostinger
# It should be run on the Hostinger server

# Database connection settings
# You need to replace these with your actual credentials
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="u726371272_barter_db"
DB_NAME="u726371272_barter_db"

# Check if create_tables.sql exists
if [ ! -f "create_tables.sql" ]; then
  echo "Error: create_tables.sql not found in current directory"
  exit 1
fi

# Ask for the database password
read -sp "Enter the database password for $DB_USER: " DB_PASS
echo ""

# Create .env file with database credentials if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file with database credentials..."
  cat > .env << EOF
# Database configuration
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Node environment
NODE_ENV=production
PORT=8080
SESSION_SECRET=bartertap_production_$(date +%s)
EOF
  echo ".env file created successfully"
else
  echo ".env file already exists, updating DATABASE_URL..."
  # Update DATABASE_URL in .env file
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}|" .env
  echo "DATABASE_URL updated successfully"
fi

# Run the database initialization script
echo "Setting up database tables..."
if command -v node &> /dev/null; then
  # Try to use Node.js script if available
  if [ -f "server/init_db.js" ]; then
    node server/init_db.js
  else
    echo "Node.js initialization script not found, falling back to direct SQL import"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < create_tables.sql
  fi
else
  echo "Node.js not found, using direct SQL import"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < create_tables.sql
fi

# Check exit status
if [ $? -eq 0 ]; then
  echo "Database setup completed successfully"
else
  echo "Error: Database setup failed"
  exit 1
fi

echo "Database is now ready for use with BarterTap"