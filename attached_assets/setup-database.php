<?php
/**
 * BarterTap.az - Verilənlər bazası quraşdırması
 * Bu skript BarterTap sisteminin verilənlər bazası strukturunu yaradır.
 */

// Config faylının mövcudluğunu yoxlayın
if (!file_exists('includes/config.php')) {
    die('Xəta: includes/config.php faylı tapılmadı.');
}

// Konfiqurasiya faylından verilənlər bazası məlumatlarını almaq üçün
// Session və istifadəçi məlumatlarını ötmək üçün müvəqqəti funksiyalar tanımlanır
if (!function_exists('sanitizeInput')) {
    function sanitizeInput($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        return $data;
    }
}

if (!function_exists('showMessage')) {
    function showMessage() {
        if (isset($_SESSION['message'])) {
            unset($_SESSION['message']);
        }
    }
}

require_once 'includes/config.php';

// Skript status məlumatlarını saxlayacaq dəyişənlər
$success = [];
$errors = [];

// Verilənlər bazasını yarat (əgər mövcud deyilsə)
try {
    $host = $db_config['host'];
    $username = $db_config['username'];
    $password = $db_config['password'];
    $dbname = $db_config['dbname'];
    
    // Sadəcə server ilə əlaqə qurun (verilənlər bazasına bağlanmadan)
    $pdo_connect = new PDO("mysql:host=$host", $username, $password);
    $pdo_connect->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Verilənlər bazası mövcuddurmu yoxlayın
    $sql = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$dbname'";
    $stmt = $pdo_connect->query($sql);
    
    if ($stmt->rowCount() == 0) {
        // Verilənlər bazası mövcud deyil, yaradın
        $sql = "CREATE DATABASE `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        $pdo_connect->exec($sql);
        $success[] = "Verilənlər bazası '$dbname' uğurla yaradıldı.";
    } else {
        $success[] = "Verilənlər bazası '$dbname' artıq mövcuddur.";
    }
    
    // Verilənlər bazasına bağlanın
    $pdo_connect->exec("USE `$dbname`");
    
} catch (PDOException $e) {
    $errors[] = "Verilənlər bazası yaradılması xətası: " . $e->getMessage();
    die();
}

// Cədvəlləri yarad
try {
    // İstifadəçilər cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `users` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `username` VARCHAR(50) NOT NULL,
        `email` VARCHAR(100) NOT NULL,
        `password` VARCHAR(255) NOT NULL,
        `full_name` VARCHAR(100) NOT NULL,
        `phone` VARCHAR(20) DEFAULT NULL,
        `city` VARCHAR(50) DEFAULT NULL,
        `avatar` VARCHAR(255) DEFAULT NULL,
        `bio` TEXT DEFAULT NULL,
        `email_verified` TINYINT(1) DEFAULT 0,
        `phone_verified` TINYINT(1) DEFAULT 0,
        `is_admin` TINYINT(1) DEFAULT 0,
        `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        `rating` DECIMAL(3,2) DEFAULT 0.00,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `username` (`username`),
        UNIQUE KEY `email` (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "İstifadəçilər cədvəli yaradıldı.";
    
    // Kateqoriyalar cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `categories` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(50) NOT NULL,
        `display_name` VARCHAR(100) NOT NULL,
        `slug` VARCHAR(100) NOT NULL,
        `icon` VARCHAR(50) DEFAULT NULL,
        `color` VARCHAR(20) DEFAULT NULL,
        `parent_id` INT(11) UNSIGNED DEFAULT NULL,
        `description` TEXT DEFAULT NULL,
        `order_num` INT(11) DEFAULT 0,
        PRIMARY KEY (`id`),
        UNIQUE KEY `name` (`name`),
        UNIQUE KEY `slug` (`slug`),
        KEY `parent_id` (`parent_id`),
        CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Kateqoriyalar cədvəli yaradıldı.";
    
    // Elanlar cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `items` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `user_id` INT(11) UNSIGNED NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `slug` VARCHAR(255) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `category_id` INT(11) UNSIGNED NOT NULL,
        `subcategory_id` INT(11) UNSIGNED DEFAULT NULL,
        `condition` ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL,
        `status` ENUM('active', 'pending', 'completed', 'inactive') DEFAULT 'active',
        `location` VARCHAR(100) DEFAULT NULL,
        `wanted_exchange` TEXT DEFAULT NULL,
        `has_price` TINYINT(1) DEFAULT 0,
        `price` DECIMAL(10,2) DEFAULT NULL,
        `views` INT(11) DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `user_id` (`user_id`),
        KEY `category_id` (`category_id`),
        KEY `subcategory_id` (`subcategory_id`),
        KEY `status` (`status`),
        KEY `created_at` (`created_at`),
        CONSTRAINT `fk_items_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
        CONSTRAINT `fk_items_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Elanlar cədvəli yaradıldı.";
    
    // Şəkillər cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `images` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `item_id` INT(11) UNSIGNED NOT NULL,
        `file_name` VARCHAR(255) NOT NULL,
        `file_path` VARCHAR(255) NOT NULL,
        `file_size` INT(11) DEFAULT NULL,
        `file_type` VARCHAR(50) DEFAULT NULL,
        `is_main` TINYINT(1) DEFAULT 0,
        `order_num` INT(11) DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `item_id` (`item_id`),
        CONSTRAINT `fk_images_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Şəkillər cədvəli yaradıldı.";
    
    // Sevimli elanlar cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `favorites` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `user_id` INT(11) UNSIGNED NOT NULL,
        `item_id` INT(11) UNSIGNED NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `user_item` (`user_id`, `item_id`),
        KEY `user_id` (`user_id`),
        KEY `item_id` (`item_id`),
        CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_favorites_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Sevimli elanlar cədvəli yaradıldı.";
    
    // Söhbətlər cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `conversations` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `item_id` INT(11) UNSIGNED DEFAULT NULL,
        `initiated_by` INT(11) UNSIGNED NOT NULL,
        `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `status` ENUM('active', 'archived', 'deleted') DEFAULT 'active',
        PRIMARY KEY (`id`),
        KEY `item_id` (`item_id`),
        KEY `initiated_by` (`initiated_by`),
        CONSTRAINT `fk_conversations_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL,
        CONSTRAINT `fk_conversations_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Söhbətlər cədvəli yaradıldı.";
    
    // Söhbət iştirakçıları cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `conversation_participants` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `conversation_id` INT(11) UNSIGNED NOT NULL,
        `user_id` INT(11) UNSIGNED NOT NULL,
        `last_read_at` TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `conversation_user` (`conversation_id`, `user_id`),
        KEY `user_id` (`user_id`),
        CONSTRAINT `fk_participants_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Söhbət iştirakçıları cədvəli yaradıldı.";
    
    // Mesajlar cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `messages` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `conversation_id` INT(11) UNSIGNED NOT NULL,
        `sender_id` INT(11) UNSIGNED NOT NULL,
        `content` TEXT NOT NULL,
        `has_attachment` TINYINT(1) DEFAULT 0,
        `attachment_path` VARCHAR(255) DEFAULT NULL,
        `status` ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `conversation_id` (`conversation_id`),
        KEY `sender_id` (`sender_id`),
        CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_messages_user` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Mesajlar cədvəli yaradıldı.";
    
    // Barter təklifləri cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `offers` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `conversation_id` INT(11) UNSIGNED NOT NULL,
        `sender_id` INT(11) UNSIGNED NOT NULL,
        `recipient_id` INT(11) UNSIGNED NOT NULL,
        `offered_item_id` INT(11) UNSIGNED NOT NULL,
        `wanted_item_id` INT(11) UNSIGNED NOT NULL,
        `note` TEXT DEFAULT NULL,
        `status` ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `conversation_id` (`conversation_id`),
        KEY `sender_id` (`sender_id`),
        KEY `recipient_id` (`recipient_id`),
        KEY `offered_item_id` (`offered_item_id`),
        KEY `wanted_item_id` (`wanted_item_id`),
        CONSTRAINT `fk_offers_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_offers_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_offers_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_offers_offered_item` FOREIGN KEY (`offered_item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_offers_wanted_item` FOREIGN KEY (`wanted_item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Barter təklifləri cədvəli yaradıldı.";
    
    // İstifadəçi qiymətləndirmələri cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `ratings` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `rater_id` INT(11) UNSIGNED NOT NULL,
        `rated_user_id` INT(11) UNSIGNED NOT NULL,
        `offer_id` INT(11) UNSIGNED DEFAULT NULL,
        `rating` INT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
        `comment` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `rating_relation` (`rater_id`, `rated_user_id`, `offer_id`),
        KEY `rater_id` (`rater_id`),
        KEY `rated_user_id` (`rated_user_id`),
        KEY `offer_id` (`offer_id`),
        CONSTRAINT `fk_ratings_rater` FOREIGN KEY (`rater_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_ratings_rated_user` FOREIGN KEY (`rated_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_ratings_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "İstifadəçi qiymətləndirmələri cədvəli yaradıldı.";
    
    // Bildirişlər cədvəli
    $sql = "CREATE TABLE IF NOT EXISTS `notifications` (
        `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
        `user_id` INT(11) UNSIGNED NOT NULL,
        `type` ENUM('message', 'offer', 'status', 'rating', 'system') NOT NULL,
        `reference_id` INT(11) UNSIGNED DEFAULT NULL,
        `content` TEXT NOT NULL,
        `is_read` TINYINT(1) DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `user_id` (`user_id`),
        KEY `type` (`type`),
        KEY `is_read` (`is_read`),
        CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo_connect->exec($sql);
    $success[] = "Bildirişlər cədvəli yaradıldı.";
    
    // Default kateqoriyaları əlavə et
    $categories = [
        [
            'name' => 'electronics',
            'display_name' => 'Elektronika',
            'slug' => 'elektronika',
            'icon' => 'fas fa-mobile-alt',
            'color' => '#4299E1'
        ],
        [
            'name' => 'clothing',
            'display_name' => 'Geyim və Aksessuarlar',
            'slug' => 'geyim-ve-aksessuarlar',
            'icon' => 'fas fa-tshirt',
            'color' => '#F56565'
        ],
        [
            'name' => 'home',
            'display_name' => 'Ev və Bağ',
            'slug' => 'ev-ve-bag',
            'icon' => 'fas fa-home',
            'color' => '#48BB78'
        ],
        [
            'name' => 'sports',
            'display_name' => 'İdman və Hobbi',
            'slug' => 'idman-ve-hobbi',
            'icon' => 'fas fa-futbol',
            'color' => '#ED8936'
        ],
        [
            'name' => 'books',
            'display_name' => 'Kitablar və Təhsil',
            'slug' => 'kitablar-ve-tehsil',
            'icon' => 'fas fa-book',
            'color' => '#9F7AEA'
        ],
        [
            'name' => 'toys',
            'display_name' => 'Uşaq Malları və Oyuncaqlar',
            'slug' => 'usaq-mallari-ve-oyuncaqlar',
            'icon' => 'fas fa-baby',
            'color' => '#38B2AC'
        ],
        [
            'name' => 'furniture',
            'display_name' => 'Mebel və İnteryer',
            'slug' => 'mebel-ve-interyer',
            'icon' => 'fas fa-couch',
            'color' => '#DD6B20'
        ],
        [
            'name' => 'beauty',
            'display_name' => 'Gözəllik və Sağlamlıq',
            'slug' => 'gozellik-ve-saglamliq',
            'icon' => 'fas fa-heart',
            'color' => '#D53F8C'
        ],
        [
            'name' => 'auto',
            'display_name' => 'Avtomobil və Nəqliyyat',
            'slug' => 'avtomobil-ve-neqliyyat',
            'icon' => 'fas fa-car',
            'color' => '#3182CE'
        ],
        [
            'name' => 'services',
            'display_name' => 'Xidmətlər və Ustalıq',
            'slug' => 'xidmetler-ve-ustaliq',
            'icon' => 'fas fa-tools',
            'color' => '#805AD5'
        ],
        [
            'name' => 'collectibles',
            'display_name' => 'Kolleksiya və Antikvar',
            'slug' => 'kolleksiya-ve-antikvar',
            'icon' => 'fas fa-gem',
            'color' => '#6B46C1'
        ],
        [
            'name' => 'other',
            'display_name' => 'Digər',
            'slug' => 'diger',
            'icon' => 'fas fa-box',
            'color' => '#718096'
        ]
    ];
    
    $stmt = $pdo_connect->prepare("SELECT * FROM categories WHERE name = ?");
    
    foreach ($categories as $category) {
        $stmt->execute([$category['name']]);
        if ($stmt->rowCount() == 0) {
            $sql = "INSERT INTO categories (name, display_name, slug, icon, color) VALUES (?, ?, ?, ?, ?)";
            $pdo_connect->prepare($sql)->execute([
                $category['name'],
                $category['display_name'],
                $category['slug'],
                $category['icon'],
                $category['color']
            ]);
        }
    }
    $success[] = "Standart kateqoriyalar əlavə edildi.";
    
    // Admin istifadəçi yaradın (əgər hələ mövcud deyilsə)
    $stmt = $pdo_connect->prepare("SELECT * FROM users WHERE username = 'admin' OR email = 'admin@bartertap.az'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        $admin_password = password_hash('admin123', PASSWORD_DEFAULT); // Demo məqsədləri üçün; istehsalda dəyişdirilməlidir
        
        $sql = "INSERT INTO users (username, email, password, full_name, is_admin, status, email_verified) 
                VALUES ('admin', 'admin@bartertap.az', ?, 'Admin İstifadəçi', 1, 'active', 1)";
        $pdo_connect->prepare($sql)->execute([$admin_password]);
        $success[] = "Admin istifadəçi yaradıldı (username: admin, password: admin123).";
    } else {
        $success[] = "Admin istifadəçi artıq mövcuddur.";
    }
    
} catch (PDOException $e) {
    $errors[] = "Cədvəl yaradılması xətası: " . $e->getMessage();
}

// HTML headers
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BarterTap.az - Verilənlər bazası quraşdırması</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="container mx-auto px-4 py-10 max-w-4xl">
        <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-gray-800">BarterTap.az - Verilənlər bazası quraşdırması</h1>
            <p class="text-gray-600 mt-2">Sistem verilənlər bazası strukturunu yaratma prosesi</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <?php if (!empty($errors)): ?>
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                    <h2 class="font-bold mb-2">Xəta baş verdi:</h2>
                    <ul class="list-disc pl-5">
                        <?php foreach ($errors as $error): ?>
                            <li><?php echo $error; ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p class="mt-2">
                        <a href="javascript:history.back()" class="underline">Geri qayıtmaq</a> üçün və ya 
                        <a href="includes/config.php" class="underline">config.php</a> faylını düzəltmək üçün klikləyin.
                    </p>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($success)): ?>
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                    <h2 class="font-bold mb-2">Quraşdırma uğurla tamamlandı!</h2>
                    <ul class="list-disc pl-5">
                        <?php foreach ($success as $message): ?>
                            <li><?php echo $message; ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                
                <div class="flex items-center justify-between mt-6">
                    <a href="index.php" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors">
                        Ana səhifəyə keçin
                    </a>
                    <a href="login.php" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors">
                        Daxil olun
                    </a>
                </div>
            <?php else: ?>
                <div class="text-center">
                    <p class="text-gray-700 mb-4">Verilənlər bazası quraşdırılır...</p>
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
                
                <script>
                    // Səhifəni yenidən yükləyin
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                </script>
            <?php endif; ?>
        </div>
        
        <div class="mt-10 text-center text-gray-500 text-sm">
            <p>BarterTap.az &copy; <?php echo date('Y'); ?> Bütün hüquqlar qorunur.</p>
        </div>
    </div>
</body>
</html>