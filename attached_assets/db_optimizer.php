<?php
/**
 * BarterTap.az - Verilənlər Bazası Optimizasiyası
 * Bu fayl SQL sorğularının performansını yaxşılaşdırmaq üçün indekslər və optimallaşdırmalar təmin edir.
 */

// Bağlantı qurulması
require_once 'config.php';

// Yalnız administratorların istifadə etməsi üçün
if (!isAdmin()) {
    die("Yalnız administratorlar üçün icazə verilir!");
}

// İndekslərin yaradılması üçün funksiyalar
function createIndexesIfNotExist() {
    global $pdo;
    
    try {
        // Əvvəlcə mövcud indeksləri əldə et
        $existingIndexes = getExistingIndexes();
        
        // Yaradılacaq indekslər
        $indexes = [
            // items cədvəli indeksləri
            ['table' => 'items', 'name' => 'items_user_id_idx', 'columns' => 'user_id'],
            ['table' => 'items', 'name' => 'items_category_id_idx', 'columns' => 'category_id'],
            ['table' => 'items', 'name' => 'items_status_idx', 'columns' => 'status'],
            ['table' => 'items', 'name' => 'items_created_at_idx', 'columns' => 'created_at'],
            ['table' => 'items', 'name' => 'items_views_idx', 'columns' => 'views'],
            ['table' => 'items', 'name' => 'items_location_idx', 'columns' => 'location'],
            ['table' => 'items', 'name' => 'items_title_idx', 'columns' => 'title'],
            
            // users cədvəli indeksləri
            ['table' => 'users', 'name' => 'users_username_idx', 'columns' => 'username'],
            ['table' => 'users', 'name' => 'users_email_idx', 'columns' => 'email'],
            ['table' => 'users', 'name' => 'users_status_idx', 'columns' => 'status'],
            
            // favorites cədvəli indeksləri
            ['table' => 'favorites', 'name' => 'favorites_user_id_idx', 'columns' => 'user_id'],
            ['table' => 'favorites', 'name' => 'favorites_item_id_idx', 'columns' => 'item_id'],
            ['table' => 'favorites', 'name' => 'favorites_combined_idx', 'columns' => 'user_id, item_id'],
            
            // images cədvəli indeksləri
            ['table' => 'images', 'name' => 'images_item_id_idx', 'columns' => 'item_id'],
            ['table' => 'images', 'name' => 'images_main_idx', 'columns' => 'is_main'],
            
            // categories cədvəli indeksləri
            ['table' => 'categories', 'name' => 'categories_parent_id_idx', 'columns' => 'parent_id'],
            ['table' => 'categories', 'name' => 'categories_name_idx', 'columns' => 'name'],
            
            // conversations cədvəli indeksləri
            ['table' => 'conversations', 'name' => 'conversations_item_id_idx', 'columns' => 'item_id'],
            ['table' => 'conversations', 'name' => 'conversations_initiated_by_idx', 'columns' => 'initiated_by'],
            ['table' => 'conversations', 'name' => 'conversations_last_message_at_idx', 'columns' => 'last_message_at'],
            
            // conversation_participants cədvəli indeksləri
            ['table' => 'conversation_participants', 'name' => 'cp_conversation_id_idx', 'columns' => 'conversation_id'],
            ['table' => 'conversation_participants', 'name' => 'cp_user_id_idx', 'columns' => 'user_id'],
            ['table' => 'conversation_participants', 'name' => 'cp_combined_idx', 'columns' => 'conversation_id, user_id'],
            
            // messages cədvəli indeksləri
            ['table' => 'messages', 'name' => 'messages_conversation_id_idx', 'columns' => 'conversation_id'],
            ['table' => 'messages', 'name' => 'messages_sender_id_idx', 'columns' => 'sender_id'],
            ['table' => 'messages', 'name' => 'messages_status_idx', 'columns' => 'status'],
            ['table' => 'messages', 'name' => 'messages_created_at_idx', 'columns' => 'created_at'],
            
            // offers cədvəli indeksləri
            ['table' => 'offers', 'name' => 'offers_conversation_id_idx', 'columns' => 'conversation_id'],
            ['table' => 'offers', 'name' => 'offers_sender_id_idx', 'columns' => 'sender_id'],
            ['table' => 'offers', 'name' => 'offers_recipient_id_idx', 'columns' => 'recipient_id'],
            ['table' => 'offers', 'name' => 'offers_offered_item_idx', 'columns' => 'offered_item_id'],
            ['table' => 'offers', 'name' => 'offers_wanted_item_idx', 'columns' => 'wanted_item_id'],
            ['table' => 'offers', 'name' => 'offers_status_idx', 'columns' => 'status'],
            
            // notifications cədvəli indeksləri
            ['table' => 'notifications', 'name' => 'notifications_user_id_idx', 'columns' => 'user_id'],
            ['table' => 'notifications', 'name' => 'notifications_is_read_idx', 'columns' => 'is_read'],
            ['table' => 'notifications', 'name' => 'notifications_created_at_idx', 'columns' => 'created_at'],
        ];
        
        // İndeksləri yarat
        $createdCount = 0;
        foreach ($indexes as $index) {
            $indexKey = "{$index['table']}_{$index['name']}";
            
            // İndeks artıq mövcud deyilsə, yarat
            if (!isset($existingIndexes[$indexKey])) {
                $stmt = $pdo->prepare("
                    CREATE INDEX {$index['name']} 
                    ON {$index['table']} ({$index['columns']})
                ");
                $stmt->execute();
                $createdCount++;
                
                echo "İndeks yaradıldı: {$index['name']} ({$index['table']} cədvəlinə {$index['columns']} sütunları)\n";
            }
        }
        
        echo "Prosess tamamlandı. $createdCount yeni indeks yaradıldı.\n";
        
    } catch (PDOException $e) {
        echo "Xəta: " . $e->getMessage() . "\n";
    }
}

// Mövcud indeksləri əldə etmək üçün funksiya
function getExistingIndexes() {
    global $pdo;
    
    $indexes = [];
    
    // MySQL və MariaDB üçün
    try {
        $stmt = $pdo->query("
            SELECT DISTINCT 
                TABLE_NAME AS table_name, 
                INDEX_NAME AS index_name
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
        ");
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $indexes["{$row['table_name']}_{$row['index_name']}"] = true;
        }
    } catch (PDOException $e) {
        // PostgreSQL üçün
        try {
            $stmt = $pdo->query("
                SELECT 
                    tablename AS table_name, 
                    indexname AS index_name
                FROM pg_indexes 
                WHERE schemaname = 'public'
            ");
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $indexes["{$row['table_name']}_{$row['index_name']}"] = true;
            }
        } catch (PDOException $e2) {
            echo "İndeks məlumatları əldə edilərkən xəta baş verdi: " . $e2->getMessage() . "\n";
        }
    }
    
    return $indexes;
}

// Verilənlər bazası statistikalarını analiz et
function analyzeDatabaseStats() {
    global $pdo;
    
    echo "Verilənlər bazası statistikaları analiz edilir...\n\n";
    
    // Ölçü-böyük cədvəlləri tap
    try {
        // MySQL/MariaDB
        $stmt = $pdo->query("
            SELECT 
                TABLE_NAME AS table_name, 
                TABLE_ROWS AS row_count,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY size_mb DESC
        ");
        
        echo "Ən böyük cədvəllər:\n";
        echo "--------------------------------\n";
        echo "Cədvəl\t\tSətir Sayı\tÖlçü (MB)\n";
        echo "--------------------------------\n";
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            printf(
                "%-20s\t%d\t\t%.2f\n", 
                $row['table_name'], 
                $row['row_count'], 
                $row['size_mb']
            );
        }
        
        echo "\n";
    } catch (PDOException $e) {
        echo "Cədvəl statistikalarını əldə edərkən xəta: " . $e->getMessage() . "\n";
    }
    
    // Ən çox istifadə olunan indeksləri yoxla (MySQL üçün)
    try {
        // Ən çox istifadə olunan indekslər
        $stmt = $pdo->query("
            SHOW INDEX FROM items
        ");
        
        echo "items cədvəlində olan indekslər:\n";
        echo "------------------------------\n";
        echo "İndeks adı\t\tSütun\t\tUnique\n";
        echo "------------------------------\n";
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            printf(
                "%-20s\t%-10s\t%s\n", 
                $row['Key_name'], 
                $row['Column_name'], 
                $row['Non_unique'] ? 'No' : 'Yes'
            );
        }
        
        echo "\n";
    } catch (PDOException $e) {
        echo "İndeks istifadəsini yoxlayarkən xəta: " . $e->getMessage() . "\n";
    }
}

// Ən yavaş sorğuları optimallaşdır
function optimizeSlowQueries() {
    global $pdo;
    
    echo "Yavaş sorğular optimallaşdırılır...\n\n";
    
    // Tez-tez işlədilən sorğular üçün görünüşlər (view) yaratmaq
    $views = [
        'active_items_with_images' => "
            CREATE OR REPLACE VIEW active_items_with_images AS
            SELECT i.*, 
                   c.name as category_name, 
                   c.display_name as category_display_name,
                   c.icon as category_icon,
                   u.username as owner_username,
                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.status = 'active'
        ",
        
        'recent_messages_by_conversation' => "
            CREATE OR REPLACE VIEW recent_messages_by_conversation AS
            SELECT 
                c.id as conversation_id,
                c.item_id,
                c.status,
                m.id as last_message_id,
                m.content as last_message_content,
                m.created_at as last_message_time,
                m.sender_id as last_message_sender,
                i.title as item_title,
                (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as item_image
            FROM conversations c
            LEFT JOIN items i ON c.item_id = i.id
            LEFT JOIN messages m ON m.conversation_id = c.id
            WHERE m.id = (
                SELECT MAX(id) FROM messages 
                WHERE conversation_id = c.id
            )
        ",
        
        'user_notifications_summary' => "
            CREATE OR REPLACE VIEW user_notifications_summary AS
            SELECT 
                user_id,
                COUNT(*) as total_notifications,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
                MAX(created_at) as latest_notification_time
            FROM notifications
            GROUP BY user_id
        "
    ];
    
    foreach ($views as $name => $query) {
        try {
            $pdo->exec($query);
            echo "Görünüş yaradıldı: $name\n";
        } catch (PDOException $e) {
            echo "Görünüş yaradılarkən xəta ($name): " . $e->getMessage() . "\n";
        }
    }
    
    // Materialized görünüşlər (materialized views) yaratma
    // MySQL/MariaDB bunları rəsmi olaraq dəstəkləmir, əvəzində cədvəl yarada bilərik
    $materializedViews = [
        'item_stats' => "
            CREATE TABLE IF NOT EXISTS item_stats (
                item_id INT PRIMARY KEY,
                view_count INT DEFAULT 0,
                favorite_count INT DEFAULT 0,
                offer_count INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (view_count),
                INDEX (favorite_count),
                INDEX (offer_count)
            )
        ",
        
        'user_activity_summary' => "
            CREATE TABLE IF NOT EXISTS user_activity_summary (
                user_id INT PRIMARY KEY,
                item_count INT DEFAULT 0,
                message_count INT DEFAULT 0,
                favorite_count INT DEFAULT 0,
                last_login TIMESTAMP NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (item_count),
                INDEX (message_count)
            )
        "
    ];
    
    foreach ($materializedViews as $name => $query) {
        try {
            $pdo->exec($query);
            echo "Materializə edilmiş görünüş yaradıldı: $name\n";
        } catch (PDOException $e) {
            echo "Materializə edilmiş görünüş yaradılarkən xəta ($name): " . $e->getMessage() . "\n";
        }
    }
    
    // Procedure və trigger'lər yaratma
    $procedures = [
        'sp_update_item_stats' => "
            CREATE PROCEDURE IF NOT EXISTS sp_update_item_stats(IN p_item_id INT)
            BEGIN
                -- Views sayını əldə et
                SET @view_count = (SELECT views FROM items WHERE id = p_item_id);
                
                -- Favorites sayını tap
                SET @favorite_count = (SELECT COUNT(*) FROM favorites WHERE item_id = p_item_id);
                
                -- Offers sayını tap
                SET @offer_count = (
                    SELECT COUNT(*) FROM offers 
                    WHERE offered_item_id = p_item_id OR wanted_item_id = p_item_id
                );
                
                -- Statistikaları yenilə
                INSERT INTO item_stats (item_id, view_count, favorite_count, offer_count, last_updated)
                VALUES (p_item_id, @view_count, @favorite_count, @offer_count, NOW())
                ON DUPLICATE KEY UPDATE
                    view_count = @view_count,
                    favorite_count = @favorite_count,
                    offer_count = @offer_count,
                    last_updated = NOW();
            END
        ",
        
        'sp_update_user_activity' => "
            CREATE PROCEDURE IF NOT EXISTS sp_update_user_activity(IN p_user_id INT)
            BEGIN
                -- Elan sayını tap
                SET @item_count = (SELECT COUNT(*) FROM items WHERE user_id = p_user_id);
                
                -- Mesaj sayını tap
                SET @message_count = (SELECT COUNT(*) FROM messages WHERE sender_id = p_user_id);
                
                -- Favorilər sayını tap
                SET @favorite_count = (SELECT COUNT(*) FROM favorites WHERE user_id = p_user_id);
                
                -- Son giriş
                SET @last_login = (SELECT last_login FROM users WHERE id = p_user_id);
                
                -- Statistikaları yenilə
                INSERT INTO user_activity_summary 
                    (user_id, item_count, message_count, favorite_count, last_login, last_updated)
                VALUES 
                    (p_user_id, @item_count, @message_count, @favorite_count, @last_login, NOW())
                ON DUPLICATE KEY UPDATE
                    item_count = @item_count,
                    message_count = @message_count,
                    favorite_count = @favorite_count,
                    last_login = @last_login,
                    last_updated = NOW();
            END
        "
    ];
    
    foreach ($procedures as $name => $query) {
        try {
            $pdo->exec("DROP PROCEDURE IF EXISTS $name");
            $pdo->exec($query);
            echo "Prosedur yaradıldı: $name\n";
        } catch (PDOException $e) {
            echo "Prosedur yaradılarkən xəta ($name): " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nYavaş sorğular üçün optimizasiya tamamlandı.\n";
}

// Partisiyalama
function createPartitions() {
    global $pdo;
    
    echo "Partisiyalama tətbiq edilir...\n\n";
    
    $partitionTables = [
        // Mesajları vaxt əsasında partisiyala (ilə görə)
        'messages_partitioned' => "
            CREATE TABLE IF NOT EXISTS messages_partitioned (
                id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id INT NOT NULL,
                sender_id INT NOT NULL,
                content TEXT NOT NULL,
                status ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX (conversation_id),
                INDEX (sender_id),
                INDEX (created_at)
            )
            PARTITION BY RANGE (YEAR(created_at)) (
                PARTITION p2022 VALUES LESS THAN (2023),
                PARTITION p2023 VALUES LESS THAN (2024),
                PARTITION p2024 VALUES LESS THAN (2025),
                PARTITION p2025 VALUES LESS THAN (2026),
                PARTITION pmax VALUES LESS THAN MAXVALUE
            )
        ",
        
        // Bildirişləri istifadəçi ID-si əsasında partisiyala
        'notifications_partitioned' => "
            CREATE TABLE IF NOT EXISTS notifications_partitioned (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                reference_id INT,
                content TEXT NOT NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (is_read),
                INDEX (created_at)
            )
            PARTITION BY HASH (user_id) PARTITIONS 10
        "
    ];
    
    foreach ($partitionTables as $name => $query) {
        try {
            $pdo->exec($query);
            echo "Partisiyalama yaradıldı: $name\n";
        } catch (PDOException $e) {
            echo "Partisiyalama yaradılarkən xəta ($name): " . $e->getMessage() . "\n";
            
            // MySQL version və ya xüsusiyyət dəstəyi yoxdursa
            if (strpos($e->getMessage(), "partition") !== false) {
                echo "Serverdə partisiyalama dəstəklənmir. Standart cədvəl yaradılır.\n";
                
                // Partisiyasız cədvəli yarat
                $standardQuery = preg_replace('/PARTITION BY.*$/ms', '', $query);
                try {
                    $pdo->exec($standardQuery);
                    echo "Standart cədvəl yaradıldı: $name (partisiyasız)\n";
                } catch (PDOException $e2) {
                    echo "Standart cədvəl yaradılarkən xəta: " . $e2->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "\nPartisiyalama tamamlandı.\n";
}

// Optimizasiya işini yerinə yetir
function runOptimization() {
    echo "Verilənlər bazası optimizasiya prosesi başladı...\n\n";
    
    // İndeksləri yarat
    createIndexesIfNotExist();
    echo "\n";
    
    // Sorğuları optimallaşdır
    optimizeSlowQueries();
    echo "\n";
    
    // Partisiyaları yarat (əgər mümkünsə)
    // createPartitions();
    // echo "\n";
    
    // Statistikaları analiz et
    analyzeDatabaseStats();
    
    echo "\nOptimizasiya prosesi tamamlandı.\n";
}

// Adminlər üçün UI görüntüsü
function displayUI() {
    ?>
    <!DOCTYPE html>
    <html lang="az">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BarterTap.az - Verilənlər Bazası Optimizasiyası</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">Verilənlər Bazası Optimizasiyası</h1>
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold mb-2">Optimizasiya Əməliyyatları</h2>
                        <p class="text-gray-600 mb-4">
                            Bu əməliyyatlar verilənlər bazasının performansını yaxşılaşdırmaq üçün indekslər, 
                            statistikalar, və sorğu optimallaşdırmaları həyata keçirir.
                        </p>
                        
                        <div class="space-y-3">
                            <div class="flex items-center">
                                <div class="w-1/2">
                                    <h3 class="font-medium">İndekslər yarat</h3>
                                    <p class="text-sm text-gray-500">Mövcud olmayan indeksləri əlavə edir.</p>
                                </div>
                                <form method="post" class="w-1/2 text-right">
                                    <input type="hidden" name="action" value="create_indexes">
                                    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                                        Əməliyyatı başlat
                                    </button>
                                </form>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-1/2">
                                    <h3 class="font-medium">Sorğuları optimallaşdır</h3>
                                    <p class="text-sm text-gray-500">Görünüşlər, materiallaşmış görünüşlər və prosedurlar yaradır.</p>
                                </div>
                                <form method="post" class="w-1/2 text-right">
                                    <input type="hidden" name="action" value="optimize_queries">
                                    <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm">
                                        Əməliyyatı başlat
                                    </button>
                                </form>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-1/2">
                                    <h3 class="font-medium">Partisiyaları yarat</h3>
                                    <p class="text-sm text-gray-500">Böyük cədvəllər üçün partisiyalar yaradır.</p>
                                </div>
                                <form method="post" class="w-1/2 text-right">
                                    <input type="hidden" name="action" value="create_partitions">
                                    <button type="submit" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm">
                                        Əməliyyatı başlat
                                    </button>
                                </form>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-1/2">
                                    <h3 class="font-medium">Verilənlər bazası statistikası</h3>
                                    <p class="text-sm text-gray-500">Verilənlər bazası haqqında statistik məlumatları göstərir.</p>
                                </div>
                                <form method="post" class="w-1/2 text-right">
                                    <input type="hidden" name="action" value="analyze_stats">
                                    <button type="submit" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm">
                                        Əməliyyatı başlat
                                    </button>
                                </form>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-1/2">
                                    <h3 class="font-medium">Tam optimizasiya</h3>
                                    <p class="text-sm text-gray-500">Bütün optimizasiya əməliyyatlarını ardıcıl yerinə yetirir.</p>
                                </div>
                                <form method="post" class="w-1/2 text-right">
                                    <input type="hidden" name="action" value="run_all">
                                    <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                                        Əməliyyatı başlat
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <?php if (isset($_POST['action'])): ?>
                        <div class="mt-6 bg-gray-100 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold mb-2">Nəticə</h3>
                            <pre class="bg-black text-green-400 p-4 rounded text-sm overflow-auto max-h-96"><?php
                                switch ($_POST['action']) {
                                    case 'create_indexes':
                                        createIndexesIfNotExist();
                                        break;
                                    case 'optimize_queries':
                                        optimizeSlowQueries();
                                        break;
                                    case 'create_partitions':
                                        createPartitions();
                                        break;
                                    case 'analyze_stats':
                                        analyzeDatabaseStats();
                                        break;
                                    case 'run_all':
                                        runOptimization();
                                        break;
                                }
                            ?></pre>
                        </div>
                    <?php endif; ?>
                </div>
                
                <p class="mt-4 text-gray-500 text-sm text-center">
                    BarterTap.az - Verilənlər Bazası Optimizasiya Alətləri &copy; <?php echo date("Y"); ?>
                </p>
            </div>
        </div>
    </body>
    </html>
    <?php
}

// Əsas icra kodu
if (php_sapi_name() === 'cli') {
    // CLI mühitində işləyirsə
    if (isset($argv[1])) {
        switch ($argv[1]) {
            case 'indexes':
                createIndexesIfNotExist();
                break;
            case 'optimize':
                optimizeSlowQueries();
                break;
            case 'partitions':
                createPartitions();
                break;
            case 'analyze':
                analyzeDatabaseStats();
                break;
            case 'all':
                runOptimization();
                break;
            default:
                echo "İstifadə: php db_optimizer.php [indexes|optimize|partitions|analyze|all]\n";
        }
    } else {
        echo "İstifadə: php db_optimizer.php [indexes|optimize|partitions|analyze|all]\n";
    }
} else {
    // Web mühitində işləyirsə
    if (isset($_POST['action'])) {
        // POST əməliyyatı UI-dan gəlir
        displayUI();
    } else {
        // Sadəcə UI görüntülə
        displayUI();
    }
}
?>