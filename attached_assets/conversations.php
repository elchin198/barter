<?php
/**
 * Söhbətlər API
 * Bu API endpointi istifadəçinin söhbətlərini qaytarır
 */

require_once '../includes/config.php';

// Giriş yoxlaması
if (!isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'İcazə yoxdur'
    ]);
    exit;
}

// AJAX tələbi olduğunu yoxla
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Bu API yalnız AJAX tələbləri üçün nəzərdə tutulub'
    ]);
    exit;
}

// Cari istifadəçi
$current_user = getCurrentUser();

// Yalnız GET tələbi
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Yalnız GET tələbi qəbul edilir'
    ]);
    exit;
}

try {
    // İstifadəçinin söhbətlərini əldə et
    $stmt = $pdo->prepare("
        SELECT c.*, 
               i.id as item_id,
               i.title as item_title,
               (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as item_image,
               (
                   SELECT COUNT(*) 
                   FROM messages m 
                   WHERE m.conversation_id = c.id 
                   AND m.sender_id != ? 
                   AND m.status != 'read'
               ) as unread_count
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN items i ON c.item_id = i.id
        WHERE cp.user_id = ?
        ORDER BY c.last_message_at DESC
    ");
    $stmt->execute([$current_user['id'], $current_user['id']]);
    $conversations = $stmt->fetchAll();
    
    // Əlavə məlumatları əldə et (son mesaj, iştirakçılar)
    foreach ($conversations as &$conversation) {
        // Son mesajı əldə et
        $stmt = $pdo->prepare("
            SELECT m.*, u.username as sender_username
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$conversation['id']]);
        $conversation['last_message'] = $stmt->fetch();
        
        // İştirakçıları əldə et
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.full_name, u.avatar
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ?
        ");
        $stmt->execute([$conversation['id']]);
        $participants = $stmt->fetchAll();
        
        // Digər iştirakçını müəyyən et
        $conversation['participants'] = $participants;
        $conversation['other_participant'] = null;
        
        foreach ($participants as $participant) {
            if ($participant['id'] != $current_user['id']) {
                $conversation['other_participant'] = $participant;
                break;
            }
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Söhbətlər əldə edildi',
        'conversations' => $conversations
    ]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Xəta baş verdi: ' . $e->getMessage()
    ]);
}
?>