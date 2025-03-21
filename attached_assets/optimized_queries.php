<?php
/**
 * BarterTap.az - Optimallaşdırılmış SQL Sorğuları
 * Bu fayl performansı artırmaq və serverin yüklənməsini azaltmaq üçün optimallaşdırılmış SQL sorğuları təmin edir.
 */

/**
 * Ən son əlavə edilmiş elanları əldə et
 * Performansı artırmaq üçün alt sorğuların sayını azaldaraq birləşdirmə əməliyyatlarından istifadə edir
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $limit Əldə ediləcək elan sayı
 * @return array Elanlar massivi
 */
function getRecentItems($pdo, $limit = 8) {
    $stmt = $pdo->prepare("
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               u.username as owner_username,
               img.file_path as main_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE i.status = 'active'
        ORDER BY i.created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

/**
 * Ən çox baxılan elanları əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $limit Əldə ediləcək elan sayı
 * @return array Elanlar massivi
 */
function getPopularItems($pdo, $limit = 4) {
    $stmt = $pdo->prepare("
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               u.username as owner_username,
               img.file_path as main_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE i.status = 'active'
        ORDER BY i.views DESC, i.created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

/**
 * Bir kateqoriyaya aid elanları əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $categoryId Kateqoriya ID-si
 * @param int $limit Əldə ediləcək elan sayı
 * @param int $offset Səhifələmə üçün offset
 * @return array Elanlar massivi
 */
function getItemsByCategory($pdo, $categoryId, $limit = 20, $offset = 0) {
    $stmt = $pdo->prepare("
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               u.username as owner_username,
               img.file_path as main_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE i.status = 'active' AND (i.category_id = ? OR c.parent_id = ?)
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$categoryId, $categoryId, $limit, $offset]);
    return $stmt->fetchAll();
}

/**
 * Axtarış sorğusuna uyğun elanları tapır
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param string $query Axtarış sözü
 * @param string|null $category Kateqoriya
 * @param string|null $location Yer
 * @param int $limit Əldə ediləcək elan sayı
 * @param int $offset Səhifələmə üçün offset
 * @return array Elanlar massivi
 */
function searchItems($pdo, $query, $category = null, $location = null, $limit = 20, $offset = 0) {
    $params = [];
    $sql = "
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               u.username as owner_username,
               img.file_path as main_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE i.status = 'active'
    ";
    
    // Axtarış şərtlərini əlavə et
    if (!empty($query)) {
        $sql .= " AND (i.title LIKE ? OR i.description LIKE ?)";
        $searchTerm = "%" . $query . "%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if (!empty($category)) {
        // Əsas kateqoriya və alt kateqoriyaları əhatə et
        $sql .= " AND (c.name = ? OR c.parent_id = (SELECT id FROM categories WHERE name = ?))";
        $params[] = $category;
        $params[] = $category;
    }
    
    if (!empty($location)) {
        $sql .= " AND i.location LIKE ?";
        $params[] = "%" . $location . "%";
    }
    
    $sql .= " ORDER BY i.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * İstifadəçinin elanlarını əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $userId İstifadəçi ID-si
 * @param string|null $status Elan statusu ('active', 'pending', 'completed', 'inactive')
 * @return array Elanlar massivi
 */
function getUserItems($pdo, $userId, $status = null) {
    $params = [$userId];
    $sql = "
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               img.file_path as main_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE i.user_id = ?
    ";
    
    if ($status) {
        $sql .= " AND i.status = ?";
        $params[] = $status;
    }
    
    $sql .= " ORDER BY i.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * İstifadəçinin söhbətlərini əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $userId İstifadəçi ID-si
 * @param int $limit Əldə ediləcək söhbət sayı
 * @param int $offset Səhifələmə üçün offset
 * @return array Söhbətlər massivi
 */
function getUserConversations($pdo, $userId, $limit = 20, $offset = 0) {
    $stmt = $pdo->prepare("
        SELECT c.*, 
               i.id as item_id,
               i.title as item_title,
               i.status as item_status,
               img.file_path as item_image,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND status = 'sent') as unread_count,
               lm.content as last_message,
               lm.created_at as last_message_time,
               lm.sender_id as last_message_sender_id
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN items i ON c.item_id = i.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        LEFT JOIN (
            SELECT conversation_id, content, created_at, sender_id
            FROM messages
            WHERE id IN (
                SELECT MAX(id) FROM messages
                GROUP BY conversation_id
            )
        ) lm ON c.id = lm.conversation_id
        WHERE cp.user_id = ? AND c.status != 'deleted'
        GROUP BY c.id
        ORDER BY lm.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$userId, $userId, $limit, $offset]);
    $conversations = $stmt->fetchAll();
    
    // Digər iştirakçı məlumatlarını əlavə et
    foreach ($conversations as &$conversation) {
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.full_name, u.avatar 
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ? AND cp.user_id != ?
            LIMIT 1
        ");
        $stmt->execute([$conversation['id'], $userId]);
        $conversation['other_participant'] = $stmt->fetch();
    }
    
    return $conversations;
}

/**
 * Bir söhbətdəki mesajları əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $conversationId Söhbət ID-si
 * @param int $userId Cari istifadəçi ID-si (giriş yoxlaması üçün)
 * @param int $limit Əldə ediləcək mesaj sayı
 * @param int $offset Səhifələmə üçün offset
 * @return array|false Mesajlar massivi və ya istifadəçinin giriş icazəsi yoxdursa false
 */
function getConversationMessages($pdo, $conversationId, $userId, $limit = 50, $offset = 0) {
    // İstifadəçinin bu söhbətə girişi olub-olmadığını yoxla
    $stmt = $pdo->prepare("
        SELECT c.id FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE c.id = ? AND cp.user_id = ?
    ");
    $stmt->execute([$conversationId, $userId]);
    if (!$stmt->fetch()) {
        return false; // İstifadəçinin bu söhbətə girişi yoxdur
    }
    
    // Mesajları əldə et
    $stmt = $pdo->prepare("
        SELECT m.*,
              u.username as sender_username,
              u.full_name as sender_full_name,
              u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$conversationId, $limit, $offset]);
    $messages = $stmt->fetchAll();
    
    // Oxunmamış mesajları oxundu kimi qeyd et
    $stmt = $pdo->prepare("
        UPDATE messages m
        SET m.status = 'read'
        WHERE m.conversation_id = ? 
        AND m.sender_id != ?
        AND m.status != 'read'
    ");
    $stmt->execute([$conversationId, $userId]);
    
    // Son oxuma zamanını yenilə
    $stmt = $pdo->prepare("
        UPDATE conversation_participants 
        SET last_read_at = NOW() 
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$conversationId, $userId]);
    
    return $messages;
}

/**
 * İstifadəçinin oxunmamış mesajlarının sayını əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $userId İstifadəçi ID-si
 * @return int Oxunmamış mesaj sayı
 */
function getUnreadMessageCount($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = ? AND m.sender_id != ? AND m.status = 'sent'
    ");
    $stmt->execute([$userId, $userId]);
    return $stmt->fetchColumn();
}

/**
 * İstifadəçi üçün barter təkliflərini əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $userId İstifadəçi ID-si
 * @param string $type Təklif növü ('sent', 'received', 'all')
 * @param string|null $status Təklif statusu ('pending', 'accepted', 'rejected', 'all')
 * @return array Təkliflər massivi
 */
function getUserOffers($pdo, $userId, $type = 'all', $status = null) {
    $params = [];
    $sql = "
        SELECT o.*,
               si.title as sender_item_title,
               si.description as sender_item_description,
               (SELECT file_path FROM images WHERE item_id = o.offered_item_id AND is_main = 1 LIMIT 1) as sender_item_image,
               ri.title as recipient_item_title,
               ri.description as recipient_item_description,
               (SELECT file_path FROM images WHERE item_id = o.wanted_item_id AND is_main = 1 LIMIT 1) as recipient_item_image,
               su.username as sender_username,
               su.full_name as sender_fullname,
               su.avatar as sender_avatar,
               ru.username as recipient_username,
               ru.full_name as recipient_fullname,
               ru.avatar as recipient_avatar,
               c.id as conversation_id
        FROM offers o
        JOIN items si ON o.offered_item_id = si.id
        JOIN items ri ON o.wanted_item_id = ri.id
        JOIN users su ON o.sender_id = su.id
        JOIN users ru ON o.recipient_id = ru.id
        JOIN conversations c ON o.conversation_id = c.id
        WHERE 
    ";
    
    // Təklif növünə görə filter
    if ($type === 'sent') {
        $sql .= " o.sender_id = ?";
        $params[] = $userId;
    } else if ($type === 'received') {
        $sql .= " o.recipient_id = ?";
        $params[] = $userId;
    } else {
        $sql .= " (o.sender_id = ? OR o.recipient_id = ?)";
        $params[] = $userId;
        $params[] = $userId;
    }
    
    // Status filtri
    if ($status && $status !== 'all') {
        $sql .= " AND o.status = ?";
        $params[] = $status;
    }
    
    $sql .= " ORDER BY o.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Kateqoriyaları və onlara aid aktiv elan sayısını əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param bool $onlyParents Yalnız ana kateqoriyaları göstər
 * @return array Kateqoriyalar massivi
 */
function getCategoriesWithCounts($pdo, $onlyParents = true) {
    $sql = "
        SELECT c.*, 
               (SELECT COUNT(*) FROM items WHERE category_id = c.id AND status = 'active') as item_count
        FROM categories c
    ";
    
    if ($onlyParents) {
        $sql .= " WHERE c.parent_id IS NULL OR c.parent_id = 0";
    }
    
    $sql .= " ORDER BY c.order_num ASC, c.display_name ASC";
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll();
}

/**
 * İstifadəçinin favori elanlarını əldə et
 * 
 * @param PDO $pdo Verilənlər bazası bağlantısı
 * @param int $userId İstifadəçi ID-si
 * @return array Favori elanlar massivi
 */
function getUserFavorites($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT i.*, 
               c.name as category_name, 
               c.display_name as category_display_name,
               c.icon as category_icon,
               u.username as owner_username,
               img.file_path as main_image,
               f.created_at as favorited_at
        FROM favorites f
        JOIN items i ON f.item_id = i.id
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN (
            SELECT item_id, file_path 
            FROM images 
            WHERE is_main = 1
        ) img ON i.id = img.item_id
        WHERE f.user_id = ? AND i.status = 'active'
        ORDER BY f.created_at DESC
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}
?>