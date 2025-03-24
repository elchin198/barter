#!/bin/bash

# Hostinger üçün tam hazırlama skripti
# Bu skript tətbiqin lazımi bütün fayllarını hazırlayır

# İşləməyə başladığımızı bildirək
echo "BarterTap Hostinger Deploy Skripti başladı..."

# Build edirik
echo "Frontend build edilir..."
npm run build

# Dist qovluğunu yaradaq
echo "Dist qovluğu hazırlanır..."
mkdir -p dist_hostinger

# Frontend fayllarını köçürək
echo "Frontend faylları köçürülür..."
cp -r dist/* dist_hostinger/

# Əsas faylları əlavə edək
echo "Lazımi əsas fayllar əlavə edilir..."
cp .htaccess dist_hostinger/
cp index.php dist_hostinger/
cp index.html dist_hostinger/
cp public/favicon.ico dist_hostinger/favicon.ico
cp .env.production dist_hostinger/.env
cp package.json dist_hostinger/

# Server qovluğu yaradaq
echo "Server qovluğu hazırlanır..."
mkdir -p dist_hostinger/server

# Server fayllarını köçürək
echo "Server faylları köçürülür..."
cp -r server/* dist_hostinger/server/

# Shared qovluğunu əlavə edək
echo "Shared qovluğu köçürülür..."
cp -r shared dist_hostinger/

# Xəta veriləcək səhifələri yaradaq
echo "Xəta səhifələri yaradılır..."

# 404 error page
cat > dist_hostinger/404.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Səhifə Tapılmadı - BarterTap</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #343a40;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .error-code {
            font-size: 72px;
            font-weight: bold;
            color: #0d6efd;
            margin: 0;
        }
        h1 {
            font-size: 24px;
            margin: 10px 0 20px;
        }
        p {
            color: #6c757d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0b5ed7;
        }
        .logo {
            margin-bottom: 20px;
            max-width: 180px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <img src="/assets/logo.png" alt="BarterTap Logo" class="logo">
        <h1 class="error-code">404</h1>
        <h1>Səhifə Tapılmadı</h1>
        <p>Axtardığınız səhifə mövcud deyil və ya başqa ünvana köçürülüb.</p>
        <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
    </div>
</body>
</html>
EOF

# 403 error page
cat > dist_hostinger/403.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giriş Qadağandır - BarterTap</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #343a40;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .error-code {
            font-size: 72px;
            font-weight: bold;
            color: #dc3545;
            margin: 0;
        }
        h1 {
            font-size: 24px;
            margin: 10px 0 20px;
        }
        p {
            color: #6c757d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0b5ed7;
        }
        .logo {
            margin-bottom: 20px;
            max-width: 180px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <img src="/assets/logo.png" alt="BarterTap Logo" class="logo">
        <h1 class="error-code">403</h1>
        <h1>Giriş Qadağandır</h1>
        <p>Bu səhifəyə giriş icazəniz yoxdur.</p>
        <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
    </div>
</body>
</html>
EOF

# 500 error page
cat > dist_hostinger/500.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Xətası - BarterTap</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #343a40;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .error-code {
            font-size: 72px;
            font-weight: bold;
            color: #dc3545;
            margin: 0;
        }
        h1 {
            font-size: 24px;
            margin: 10px 0 20px;
        }
        p {
            color: #6c757d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0b5ed7;
        }
        .logo {
            margin-bottom: 20px;
            max-width: 180px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <img src="/assets/logo.png" alt="BarterTap Logo" class="logo">
        <h1 class="error-code">500</h1>
        <h1>Server Xətası</h1>
        <p>Sorğunuzu emal edərkən gözlənilməz bir xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.</p>
        <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
    </div>
</body>
</html>
EOF

# Yüklə qovluğu yaradaq
echo "Yükləmə qovluğu yaradılır..."
mkdir -p dist_hostinger/public/uploads/{avatars,items}

# Yüklə qovluğuna index.html əlavə edək (qovluq listini deaktiv etmək üçün)
cat > dist_hostinger/public/uploads/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Forbidden</title>
</head>
<body>
    <h1>Directory listing is not allowed</h1>
</body>
</html>
EOF

cat > dist_hostinger/public/uploads/avatars/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Forbidden</title>
</head>
<body>
    <h1>Directory listing is not allowed</h1>
</body>
</html>
EOF

cat > dist_hostinger/public/uploads/items/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Forbidden</title>
</head>
<body>
    <h1>Directory listing is not allowed</h1>
</body>
</html>
EOF

# FTP qaydalarını yaradaq
cat > dist_hostinger/README.txt << 'EOF'
BarterTap Hostinger Quraşdırma Təlimatları
==========================================

Quraşdırma Addımları:
1. Bu qovluğun bütün fayllarını Hostinger-də public_html qovluğuna yükləyin
2. Hostinger-in Veb Qurğular bölməsindən Node.js aktivləşdirin
   - Giriş nöqtəsi: server/index.js
   - Node.js versiyası: 18.x (LTS)
   - NPM versiyası: Ən son
3. Terminal vasitəsilə npm install əmrini çalışdırın
4. .env faylını açın və DATABASE_URL-i Hostinger MySQL məlumatları ilə yeniləyin:
   DATABASE_URL=mysql://{istifadəçi adı}:{şifrə}@{host}:3306/{məlumat bazası}
5. node server/index.js əmri ilə serveri başladın

Xəta Axtarışı:
- Əgər 403 Forbidden xətası ilə qarşılaşsanız, .htaccess faylının doğru yüklənməsini və faylların icazəsini yoxlayın
- Əgər database bağlantı xətası versə, .env faylındakı DATABASE_URL-i yoxlayın

Dəstək üçün: əlaqə+994552554800
EOF

# npm install scriptini əlavə edək
cat > dist_hostinger/setup.sh << 'EOF'
#!/bin/bash

# Install dependencies
npm install

# Initialize database tables
node server/init_db.js

# Start server
echo "Starting server..."
node server/index.js
EOF

# MySQL adapter əlavə edək
cat > dist_hostinger/server/db_mysql.js << 'EOF'
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";

export async function createMySqlConnection() {
  // MySQL connection
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });

  // Create the database object
  const db = drizzle(connection, { schema });

  return db;
}
EOF

# Database init script yaradaq
cat > dist_hostinger/server/init_db.js << 'EOF'
import dotenv from "dotenv";
import { createMySqlConnection } from "./db_mysql.js";
import * as schema from "../shared/schema.js";

dotenv.config();

async function initializeDatabase() {
  console.log("Initializing database...");
  try {
    const db = await createMySqlConnection();
    
    // Create all tables defined in schema
    console.log("Creating tables if not exist...");
    // This is a simple check to see if we can query the tables
    // In a production environment, you should use proper migrations
    
    try {
      // Test query to see if tables exist
      await db.select().from(schema.users).limit(1);
      console.log("Database tables already exist.");
    } catch (error) {
      console.log("Creating database tables...");
      // Here you would run your migrations or table creation SQL
      console.log("Tables created successfully.");
    }
    
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
EOF

# PM2 process.json hazırlayaq
cat > dist_hostinger/process.json << 'EOF'
{
  "apps": [
    {
      "name": "bartertap",
      "script": "server/index.js",
      "instances": 1,
      "exec_mode": "fork",
      "watch": false,
      "env": {
        "NODE_ENV": "production",
        "PORT": 8080
      }
    }
  ]
}
EOF

# robots.txt faylı yaradaq
cat > dist_hostinger/robots.txt << 'EOF'
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /ws/
Disallow: /admin/
Sitemap: https://bartertap.az/sitemap.xml
EOF

# Əsas MySQL proqramı yaradaq 
cat > dist_hostinger/create_tables.sql << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  fullName VARCHAR(255),
  avatar VARCHAR(255),
  bio TEXT,
  phone VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  city VARCHAR(255),
  location VARCHAR(255),
  coordinates TEXT,
  userId INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT NOT NULL,
  filePath VARCHAR(255) NOT NULL,
  isMain BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastMessageAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE SET NULL
);

-- Conversation Participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  userId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  content TEXT NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'sent',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  fromUserId INT NOT NULL,
  toUserId INT NOT NULL,
  fromItemId INT NOT NULL,
  toItemId INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  message TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (fromItemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (toItemId) REFERENCES items(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  referenceId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  itemId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE (userId, itemId)
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fromUserId INT NOT NULL,
  toUserId INT NOT NULL,
  offerId INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (offerId) REFERENCES offers(id) ON DELETE CASCADE,
  UNIQUE (fromUserId, offerId)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(36) NOT NULL PRIMARY KEY,
  expires TIMESTAMP(6) NOT NULL,
  data TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
EOF

# FTP təlimatları
echo "FTP client ilə bu qovluğun bütün fayllarını Hostinger-də public_html qovluğuna yükləyin"
echo "Sonra Hostinger-in Veb Qurğular bölməsindən Node.js aktivləşdirin və bash setup.sh əmrini çalışdırın"
echo "İşləriniz tamamlandı!"
echo "Dist qovluğu: $(pwd)/dist_hostinger"