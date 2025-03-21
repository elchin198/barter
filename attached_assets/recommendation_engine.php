<?php
/**
 * BarterTap.az - Tövsiyə Sistemi
 * 
 * Bu fayl, istifadəçilərə müxtəlif tövsiyələr (elanlar, istifadəçilər, barterlər və s.) vermək üçün 
 * tövsiyə alqoritmlərini təmin edir.
 */

/**
 * İstifadəçiyə uyğun elanları təklif et
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @param int $limit Təklif ediləcək elanların maksimum sayı
 * @return array Tövsiyə edilən elanlar massivi
 */
function getRecommendedItems($pdo, $user_id, $limit = 10) {
    try {
        // İstifadəçinin maraqlarını (kateqoriyalar, əvvəlcədən baxdığı elanlar, favorilər və s.) əldə et
        $user_interests = getUserInterests($pdo, $user_id);
        
        // Tövsiyə ediləcək elanlar üçün SQL sorğusunu qur
        $sql = "
            SELECT i.*, 
                   c.name as category_name, 
                   c.display_name as category_display_name,
                   c.icon as category_icon,
                   u.username,
                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image,
                   (
                       CASE 
                           WHEN i.category_id IN (" . implode(',', $user_interests['category_ids']) . ") THEN 50
                           ELSE 0
                       END
                       +
                       CASE
                           WHEN i.user_id IN (" . implode(',', $user_interests['visited_user_ids']) . ") THEN 30
                           ELSE 0
                       END
                       +
                       CASE
                           WHEN i.city = ? THEN 20
                           ELSE 0
                       END
                   ) as score
            FROM items i
            JOIN categories c ON i.category_id = c.id
            JOIN users u ON i.user_id = u.id
            WHERE i.status = 'active'
            AND i.user_id != ?
            AND i.id NOT IN (
                SELECT offered_item_id FROM offers WHERE sender_id = ?
                UNION
                SELECT wanted_item_id FROM offers WHERE recipient_id = ?
            )
            ORDER BY score DESC, i.created_at DESC
            LIMIT ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user_interests['user_city'],
            $user_id,
            $user_id,
            $user_id,
            $limit
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Tövsiyə edilən elanlar əldə edilə bilmədi: " . $e->getMessage());
        return [];
    }
}

/**
 * İstifadəçiyə uyğun digər istifadəçiləri təklif et
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @param int $limit Təklif ediləcək istifadəçilərin maksimum sayı
 * @return array Tövsiyə edilən istifadəçilər massivi
 */
function getRecommendedUsers($pdo, $user_id, $limit = 10) {
    try {
        // İstifadəçinin maraqlarını əldə et
        $user_interests = getUserInterests($pdo, $user_id);
        
        // Tövsiyə ediləcək istifadəçilər üçün SQL sorğusunu qur
        $sql = "
            SELECT u.*, 
                   (
                       CASE 
                           WHEN u.id IN (" . implode(',', $user_interests['partner_user_ids']) . ") THEN 50
                           ELSE 0
                       END
                       +
                       CASE
                           WHEN u.city = ? THEN 30
                           ELSE 0
                       END
                       +
                       (
                           SELECT COUNT(*) 
                           FROM items i 
                           WHERE i.user_id = u.id 
                           AND i.category_id IN (" . implode(',', $user_interests['category_ids']) . ")
                       ) * 5
                   ) as score
            FROM users u
            WHERE u.id != ?
            AND u.id NOT IN (
                SELECT DISTINCT
                    CASE
                        WHEN o.sender_id = ? THEN o.recipient_id
                        WHEN o.recipient_id = ? THEN o.sender_id
                    END
                FROM offers o
                WHERE (o.sender_id = ? OR o.recipient_id = ?)
                AND o.status IN ('completed', 'cancelled', 'rejected')
            )
            ORDER BY score DESC, u.rating DESC
            LIMIT ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user_interests['user_city'],
            $user_id,
            $user_id,
            $user_id,
            $user_id,
            $user_id,
            $limit
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Tövsiyə edilən istifadəçilər əldə edilə bilmədi: " . $e->getMessage());
        return [];
    }
}

/**
 * İstifadəçiyə təklif edə biləcəyi elanlar tövsiyə et
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @param int $item_id Qarşı tərəfin elan ID-si
 * @param int $limit Təklif ediləcək elanların maksimum sayı
 * @return array Təklif üçün tövsiyə edilən elanlar massivi
 */
function getRecommendedItemsForOffer($pdo, $user_id, $item_id, $limit = 5) {
    try {
        // Hədəf elanın məlumatlarını əldə et
        $stmt = $pdo->prepare("
            SELECT i.*, c.id as category_id, c.name as category_name
            FROM items i
            JOIN categories c ON i.category_id = c.id
            WHERE i.id = ?
        ");
        $stmt->execute([$item_id]);
        $target_item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$target_item) {
            return [];
        }
        
        // Hədəf elanın sahibinin istədiyi mübadilə
        $wanted_exchange = $target_item['wanted_exchange'];
        
        // İstifadəçinin elanlarını tövsiyə sırası ilə əldə et
        $sql = "
            SELECT i.*, 
                   c.name as category_name, 
                   c.display_name as category_display_name,
                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image,
                   (
                       CASE 
                           WHEN i.category_id = ? THEN 50
                           ELSE 0
                       END
                       +
                       CASE
                           WHEN i.category_id IN (
                               SELECT related_category_id 
                               FROM category_relations 
                               WHERE category_id = ?
                           ) THEN 30
                           ELSE 0
                       END
                       +
                       CASE
                           WHEN LOWER(i.title) LIKE CONCAT('%', LOWER(?), '%') 
                                OR LOWER(i.description) LIKE CONCAT('%', LOWER(?), '%') THEN 20
                           ELSE 0
                       END
                   ) as score
            FROM items i
            JOIN categories c ON i.category_id = c.id
            WHERE i.user_id = ?
            AND i.status = 'active'
            AND i.id NOT IN (
                SELECT offered_item_id FROM offers WHERE wanted_item_id = ?
            )
            ORDER BY score DESC, i.created_at DESC
            LIMIT ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $target_item['category_id'],
            $target_item['category_id'],
            $wanted_exchange,
            $wanted_exchange,
            $user_id,
            $item_id,
            $limit
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Təklif üçün tövsiyə edilən elanlar əldə edilə bilmədi: " . $e->getMessage());
        return [];
    }
}

/**
 * İstifadəçinin maraqlarını və davranışlarını əldə et
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @return array İstifadəçinin maraqları və davranış məlumatları
 */
function getUserInterests($pdo, $user_id) {
    $interests = [
        'category_ids' => [0], // bütün 0 massivlərini IN klauzunda istifadə etmək üçün 0 əlavə olunur
        'visited_user_ids' => [0],
        'partner_user_ids' => [0],
        'user_city' => '',
    ];
    
    try {
        // İstifadəçinin şəhərini əldə et
        $stmt = $pdo->prepare("SELECT city FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && !empty($user['city'])) {
            $interests['user_city'] = $user['city'];
        }
        
        // İstifadəçinin baxdığı kateqoriyaları əldə et
        $stmt = $pdo->prepare("
            SELECT DISTINCT c.id
            FROM item_visits v
            JOIN items i ON v.item_id = i.id
            JOIN categories c ON i.category_id = c.id
            WHERE v.user_id = ?
            ORDER BY v.visited_at DESC
            LIMIT 20
        ");
        $stmt->execute([$user_id]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $interests['category_ids'][] = $row['id'];
        }
        
        // İstifadəçinin favorilərini əldə et
        $stmt = $pdo->prepare("
            SELECT DISTINCT c.id
            FROM favorites f
            JOIN items i ON f.item_id = i.id
            JOIN categories c ON i.category_id = c.id
            WHERE f.user_id = ?
        ");
        $stmt->execute([$user_id]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $interests['category_ids'][] = $row['id'];
        }
        
        // İstifadəçinin öz elanlarının kateqoriyalarını əldə et
        $stmt = $pdo->prepare("
            SELECT DISTINCT category_id
            FROM items
            WHERE user_id = ?
            AND status = 'active'
        ");
        $stmt->execute([$user_id]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $interests['category_ids'][] = $row['category_id'];
        }
        
        // İstifadəçinin baxdığı elanların sahiblərini əldə et
        $stmt = $pdo->prepare("
            SELECT DISTINCT i.user_id
            FROM item_visits v
            JOIN items i ON v.item_id = i.id
            WHERE v.user_id = ?
            ORDER BY v.visited_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user_id]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $interests['visited_user_ids'][] = $row['user_id'];
        }
        
        // İstifadəçinin barter partnerlərini əldə et
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                CASE
                    WHEN o.sender_id = ? THEN o.recipient_id
                    WHEN o.recipient_id = ? THEN o.sender_id
                END as partner_id
            FROM offers o
            WHERE (o.sender_id = ? OR o.recipient_id = ?)
            AND o.status = 'completed'
        ");
        $stmt->execute([$user_id, $user_id, $user_id, $user_id]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $interests['partner_user_ids'][] = $row['partner_id'];
        }
        
        // Dublikatları sil və massivləri unikal et
        $interests['category_ids'] = array_unique($interests['category_ids']);
        $interests['visited_user_ids'] = array_unique($interests['visited_user_ids']);
        $interests['partner_user_ids'] = array_unique($interests['partner_user_ids']);
        
        return $interests;
    } catch (Exception $e) {
        error_log("İstifadəçi maraqları əldə edilə bilmədi: " . $e->getMessage());
        return $interests;
    }
}

/**
 * Item davranışları əsasında oxşar istifadəçilər tap
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @param int $limit Oxşar istifadəçilərin maksimum sayı
 * @return array Oxşar istifadəçilər massivi
 */
function getSimilarUsers($pdo, $user_id, $limit = 10) {
    try {
        $sql = "
            SELECT u.id, u.username, u.full_name, u.avatar, u.rating,
                   COUNT(DISTINCT i1.category_id) as common_categories
            FROM users u
            JOIN items i1 ON u.id = i1.user_id
            JOIN items i2 ON i1.category_id = i2.category_id
            WHERE i2.user_id = ?
            AND u.id != ?
            GROUP BY u.id
            ORDER BY common_categories DESC, u.rating DESC
            LIMIT ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $user_id, $limit]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Oxşar istifadəçilər əldə edilə bilmədi: " . $e->getMessage());
        return [];
    }
}

/**
 * Kateqoriya əsasında digər elanları tapır
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $item_id Elan ID-si
 * @param int $limit Oxşar elanların maksimum sayı
 * @return array Oxşar elanlar massivi
 */
function getSimilarItems($pdo, $item_id, $limit = 8) {
    try {
        // Elanın məlumatlarını əldə et
        $stmt = $pdo->prepare("
            SELECT i.*, c.id as category_id, u.id as owner_id
            FROM items i
            JOIN categories c ON i.category_id = c.id
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        ");
        $stmt->execute([$item_id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            return [];
        }
        
        // Oxşar elanları əldə et
        $sql = "
            SELECT i.*, 
                   c.name as category_name, 
                   c.display_name as category_display_name,
                   c.icon as category_icon,
                   u.username,
                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
            FROM items i
            JOIN categories c ON i.category_id = c.id
            JOIN users u ON i.user_id = u.id
            WHERE i.status = 'active'
            AND i.id != ?
            AND i.user_id != ?
            AND (
                i.category_id = ?
                OR i.category_id IN (
                    SELECT related_category_id 
                    FROM category_relations 
                    WHERE category_id = ?
                )
                OR LOWER(i.title) LIKE CONCAT('%', LOWER(?), '%')
                OR LOWER(i.description) LIKE CONCAT('%', LOWER(?), '%')
            )
            ORDER BY 
                CASE WHEN i.category_id = ? THEN 2
                     WHEN i.city = ? THEN 1
                     ELSE 0
                END DESC,
                i.created_at DESC
            LIMIT ?
        ";
        
        $keywords = explode(' ', $item['title']);
        $keyword = count($keywords) > 0 ? $keywords[0] : '';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $item_id,
            $item['owner_id'],
            $item['category_id'],
            $item['category_id'],
            $keyword,
            $keyword,
            $item['category_id'],
            $item['city'] ?? '',
            $limit
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Oxşar elanlar əldə edilə bilmədi: " . $e->getMessage());
        return [];
    }
}

/**
 * İstifadəçi davranışlarını qeyd et
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @param int $user_id İstifadəçi ID-si
 * @param string $action Fəaliyyət növü (view_item, favorite, offer, message, etc.)
 * @param array $data Fəaliyyət məlumatları
 * @return bool Əməliyyatın uğurluluğu
 */
function logUserActivity($pdo, $user_id, $action, $data = []) {
    try {
        switch ($action) {
            case 'view_item':
                // İstifadəçinin elan baxışını qeyd et
                if (!isset($data['item_id'])) {
                    return false;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO item_visits (user_id, item_id, visited_at)
                    VALUES (?, ?, NOW())
                    ON DUPLICATE KEY UPDATE visited_at = NOW(), visit_count = visit_count + 1
                ");
                
                return $stmt->execute([$user_id, $data['item_id']]);
                
            case 'search':
                // İstifadəçinin axtarışını qeyd et
                if (!isset($data['query'])) {
                    return false;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO search_logs (user_id, query, category, created_at)
                    VALUES (?, ?, ?, NOW())
                ");
                
                return $stmt->execute([
                    $user_id, 
                    $data['query'], 
                    $data['category'] ?? null
                ]);
                
            default:
                return false;
        }
    } catch (Exception $e) {
        error_log("İstifadəçi fəaliyyəti qeydə alına bilmədi: " . $e->getMessage());
        return false;
    }
}

/**
 * İstifadəçi aktivlik izləmə cədvəllərini yarat
 * 
 * @param PDO $pdo Verilənlər bazası əlaqəsi
 * @return bool Əməliyyatın uğurluluğu
 */
function createUserActivityTables($pdo) {
    try {
        // Elan baxışları cədvəli
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS item_visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_id INT NOT NULL,
                visit_count INT DEFAULT 1,
                visited_at DATETIME NOT NULL,
                UNIQUE KEY(user_id, item_id)
            )
        ");
        
        // Axtarış cədvəli
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS search_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                query VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                created_at DATETIME NOT NULL
            )
        ");
        
        // Kateqoriya əlaqələri cədvəli
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS category_relations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_id INT NOT NULL,
                related_category_id INT NOT NULL,
                weight FLOAT DEFAULT 1.0,
                UNIQUE KEY(category_id, related_category_id)
            )
        ");
        
        // Push bildirişləri abunəlikləri cədvəli (əgər mövcud deyilsə)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                subscription TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME,
                UNIQUE KEY(user_id)
            )
        ");
        
        return true;
    } catch (Exception $e) {
        error_log("İstifadəçi aktivlik cədvəlləri yaradıla bilmədi: " . $e->getMessage());
        return false;
    }
}
?>