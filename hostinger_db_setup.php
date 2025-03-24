<?php
/**
 * BarterTap.az MySQL DB Setup Script for Hostinger
 * 
 * Bu skript Hostinger mühitində MySQL verilənlər bazasını qurur.
 * 
 * İstifadə: php hostinger_db_setup.php
 */

// Database configuration
$host = $_ENV['MYSQL_HOST'] ?? 'localhost';
$user = $_ENV['MYSQL_USER'] ?? 'u726371272_barter_user'; 
$pass = $_ENV['MYSQL_PASSWORD'] ?? 'your_password';
$db   = $_ENV['MYSQL_DATABASE'] ?? 'u726371272_barter_db';

echo "==============================================\n";
echo "BarterTap.az Hostinger MySQL Quraşdırma Skripti\n";
echo "==============================================\n\n";

echo "Database connection: {$user}@{$host}/{$db}\n\n";

// Connect to MySQL
try {
    $conn = new mysqli($host, $user, $pass);
    
    if ($conn->connect_error) {
        throw new Exception("Bağlantı xətası: " . $conn->connect_error);
    }
    
    echo "MySQL-ə bağlantı uğurlu oldu.\n";
    
    // Check if database exists, create if it doesn't
    $result = $conn->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db'");
    
    if ($result->num_rows == 0) {
        echo "Verilənlər bazası '$db' mövcud deyil, yaradılır...\n";
        
        if ($conn->query("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
            echo "Verilənlər bazası '$db' uğurla yaradıldı.\n";
        } else {
            throw new Exception("Verilənlər bazası yaradıla bilmədi: " . $conn->error);
        }
    } else {
        echo "Verilənlər bazası '$db' artıq mövcuddur.\n";
    }
    
    // Use the database
    $conn->select_db($db);
    echo "Verilənlər bazası '$db' istifadəyə hazırdır.\n\n";
    
    // Create tables
    echo "Cədvəllər yaradılır...\n";
    
    // Users table
    $sql = "CREATE TABLE IF NOT EXISTS `users` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(255) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `fullName` VARCHAR(255),
        `phoneNumber` VARCHAR(255),
        `location` VARCHAR(255),
        `avatar` VARCHAR(255),
        `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        `status` ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
        `createdAt` DATETIME NOT NULL,
        `updatedAt` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'users' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'users' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Items table
    $sql = "CREATE TABLE IF NOT EXISTS `items` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NOT NULL,
        `category` VARCHAR(255) NOT NULL,
        `condition` ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL DEFAULT 'good',
        `value` DECIMAL(10, 2) DEFAULT 0,
        `city` VARCHAR(255),
        `coordinates` VARCHAR(255),
        `status` ENUM('active', 'pending', 'traded', 'inactive') NOT NULL DEFAULT 'active',
        `ownerId` INT UNSIGNED NOT NULL,
        `createdAt` DATETIME NOT NULL,
        `updatedAt` DATETIME NOT NULL,
        FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'items' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'items' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Images table
    $sql = "CREATE TABLE IF NOT EXISTS `images` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `itemId` INT UNSIGNED NOT NULL,
        `filePath` VARCHAR(255) NOT NULL,
        `isMain` BOOLEAN NOT NULL DEFAULT FALSE,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'images' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'images' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Conversations table
    $sql = "CREATE TABLE IF NOT EXISTS `conversations` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255),
        `itemId` INT UNSIGNED,
        `lastMessageAt` DATETIME,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'conversations' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'conversations' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Conversation participants table
    $sql = "CREATE TABLE IF NOT EXISTS `conversation_participants` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `conversationId` INT UNSIGNED NOT NULL,
        `userId` INT UNSIGNED NOT NULL,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        UNIQUE KEY `unique_participant` (`conversationId`, `userId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'conversation_participants' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'conversation_participants' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Messages table
    $sql = "CREATE TABLE IF NOT EXISTS `messages` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `conversationId` INT UNSIGNED NOT NULL,
        `senderId` INT UNSIGNED NOT NULL,
        `content` TEXT NOT NULL,
        `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'messages' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'messages' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Offers table
    $sql = "CREATE TABLE IF NOT EXISTS `offers` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `fromUserId` INT UNSIGNED NOT NULL,
        `toUserId` INT UNSIGNED NOT NULL,
        `fromItemId` INT UNSIGNED NOT NULL,
        `toItemId` INT UNSIGNED NOT NULL,
        `status` ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
        `message` TEXT,
        `createdAt` DATETIME NOT NULL,
        `updatedAt` DATETIME NOT NULL,
        FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`fromItemId`) REFERENCES `items`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`toItemId`) REFERENCES `items`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'offers' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'offers' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Notifications table
    $sql = "CREATE TABLE IF NOT EXISTS `notifications` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `userId` INT UNSIGNED NOT NULL,
        `type` VARCHAR(255) NOT NULL,
        `content` TEXT NOT NULL,
        `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
        `relatedId` INT UNSIGNED,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'notifications' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'notifications' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Favorites table
    $sql = "CREATE TABLE IF NOT EXISTS `favorites` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `userId` INT UNSIGNED NOT NULL,
        `itemId` INT UNSIGNED NOT NULL,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE,
        UNIQUE KEY `unique_favorite` (`userId`, `itemId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'favorites' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'favorites' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Push subscriptions table
    $sql = "CREATE TABLE IF NOT EXISTS `push_subscriptions` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `userId` INT UNSIGNED NOT NULL,
        `endpoint` TEXT NOT NULL,
        `p256dh` TEXT NOT NULL,
        `auth` TEXT NOT NULL,
        `createdAt` DATETIME NOT NULL,
        `updatedAt` DATETIME NOT NULL,
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        UNIQUE KEY `unique_subscription` (`userId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'push_subscriptions' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'push_subscriptions' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Reviews table
    $sql = "CREATE TABLE IF NOT EXISTS `reviews` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `fromUserId` INT UNSIGNED NOT NULL,
        `toUserId` INT UNSIGNED NOT NULL,
        `offerId` INT UNSIGNED NOT NULL,
        `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        `comment` TEXT,
        `createdAt` DATETIME NOT NULL,
        FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`offerId`) REFERENCES `offers`(`id`) ON DELETE CASCADE,
        UNIQUE KEY `unique_review` (`fromUserId`, `offerId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql)) {
        echo "- 'reviews' cədvəli yaradıldı.\n";
    } else {
        throw new Exception("'reviews' cədvəli yaradıla bilmədi: " . $conn->error);
    }
    
    // Create indexes for better performance
    echo "\nİndekslər yaradılır...\n";
    
    $indexSql = [
        "CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)",
        "CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)",
        "CREATE INDEX IF NOT EXISTS idx_items_owner ON items(ownerId)",
        "CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(lastMessageAt)",
        "CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId)",
        "CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(isRead)",
        "CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status)",
        "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId)",
        "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(isRead)"
    ];
    
    foreach ($indexSql as $sql) {
        if ($conn->query($sql)) {
            echo "- İndeks yaradıldı: " . substr($sql, strpos($sql, 'idx_')) . "\n";
        } else {
            echo "- İndeks yaradıla bilmədi: " . $conn->error . "\n";
        }
    }
    
    // Create default admin user
    echo "\nDefolt admin hesabı yaradılır...\n";
    
    // Check if admin user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = 'testuser'");
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Hash password
        $password = password_hash('password123', PASSWORD_DEFAULT);
        
        // Insert admin user
        $stmt = $conn->prepare("INSERT INTO users (username, password, email, fullName, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'admin', 'active', NOW(), NOW())");
        $username = 'testuser';
        $email = 'admin@bartertap.az';
        $fullName = 'Test User';
        
        $stmt->bind_param("ssss", $username, $password, $email, $fullName);
        
        if ($stmt->execute()) {
            echo "- Admin hesabı yaradıldı: username='testuser', password='password123'\n";
        } else {
            echo "- Admin hesabı yaradıla bilmədi: " . $stmt->error . "\n";
        }
    } else {
        echo "- Admin hesabı artıq mövcuddur.\n";
    }
    
    echo "\nVerilənlər bazası quraşdırması tamamlandı!\n";
    echo "==============================================\n";
    
} catch (Exception $e) {
    echo "Xəta: " . $e->getMessage() . "\n";
    exit(1);
}
?>