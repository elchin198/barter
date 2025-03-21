<?php
/**
 * Mesajlaşma API
 * Bu API endpointi söhbət və mesajları qaytarır
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

// Tələbi emal et
$method = $_SERVER['REQUEST_METHOD'];

// GET tələbi - mesajları əldə et
if ($method === 'GET') {
    $conversation_id = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : 0;
    $after_id = isset($_GET['after_id']) ? (int)$_GET['after_id'] : 0;
    
    // Söhbəti yoxla
    if ($conversation_id <= 0) {
        sendJsonResponse(false, 'Söhbət ID göstərilməyib');
    }
    
    // İstifadəçinin bu söhbətə icazəsi olduğunu yoxla
    $stmt = $pdo->prepare("
        SELECT cp.id
        FROM conversation_participants cp
        WHERE cp.conversation_id = ? AND cp.user_id = ?
    ");
    $stmt->execute([$conversation_id, $current_user['id']]);
    
    if (!$stmt->fetch()) {
        sendJsonResponse(false, 'Bu söhbətə giriş icazəniz yoxdur');
    }
    
    // Müəyyən ID-dən sonrakı mesajları əldə et
    if ($after_id > 0) {
        // Yalnız yeni mesajları əldə et
        $stmt = $pdo->prepare("
            SELECT m.*, 
                   u.username as sender_username,
                   u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ? AND m.id > ?
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$conversation_id, $after_id]);
        $messages = $stmt->fetchAll();
        
        // Mesajları oxundu kimi qeyd et
        if (count($messages) > 0) {
            $stmt = $pdo->prepare("
                UPDATE messages
                SET status = 'read'
                WHERE conversation_id = ? AND sender_id != ? AND status IN ('sent', 'delivered')
            ");
            $stmt->execute([$conversation_id, $current_user['id']]);
        }
        
        sendJsonResponse(true, 'Mesajlar əldə edildi', [
            'messages' => $messages
        ]);
    } else {
        // Söhbətin təfərrüatlarını əldə et
        $stmt = $pdo->prepare("
            SELECT c.*, 
                   i.id as item_id,
                   i.title as item_title,
                   i.user_id as item_owner_id,
                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as item_image
            FROM conversations c
            LEFT JOIN items i ON c.item_id = i.id
            WHERE c.id = ?
        ");
        $stmt->execute([$conversation_id]);
        $conversation = $stmt->fetch();
        
        if (!$conversation) {
            sendJsonResponse(false, 'Söhbət tapılmadı');
        }
        
        // İştirakçıları əldə et
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.full_name, u.avatar
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ?
        ");
        $stmt->execute([$conversation_id]);
        $participants = $stmt->fetchAll();
        
        // Digər iştirakçını müəyyən et
        $other_participant = null;
        foreach ($participants as $participant) {
            if ($participant['id'] != $current_user['id']) {
                $other_participant = $participant;
                break;
            }
        }
        
        // Mesajları əldə et
        $stmt = $pdo->prepare("
            SELECT m.*, 
                   u.username as sender_username,
                   u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$conversation_id]);
        $messages = $stmt->fetchAll();
        
        // Mesajları oxundu kimi qeyd et
        $stmt = $pdo->prepare("
            UPDATE messages
            SET status = 'read'
            WHERE conversation_id = ? AND sender_id != ? AND status IN ('sent', 'delivered')
        ");
        $stmt->execute([$conversation_id, $current_user['id']]);
        
        sendJsonResponse(true, 'Söhbət əldə edildi', [
            'conversation' => $conversation,
            'participants' => $participants,
            'other_participant' => $other_participant,
            'messages' => $messages
        ]);
    }
}
// POST tələbi - yeni mesaj göndər
else if ($method === 'POST') {
    // JSON gövdəsini al
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Məlumatları yoxla
    if (!isset($data['conversation_id']) || !isset($data['content'])) {
        sendJsonResponse(false, 'Lazımi məlumatlar təmin edilməyib');
    }
    
    $conversation_id = (int)$data['conversation_id'];
    $content = trim($data['content']);
    
    if (empty($content)) {
        sendJsonResponse(false, 'Mesaj mətni boş ola bilməz');
    }
    
    // İstifadəçinin bu söhbətə icazəsi olduğunu yoxla
    $stmt = $pdo->prepare("
        SELECT cp.id
        FROM conversation_participants cp
        WHERE cp.conversation_id = ? AND cp.user_id = ?
    ");
    $stmt->execute([$conversation_id, $current_user['id']]);
    
    if (!$stmt->fetch()) {
        sendJsonResponse(false, 'Bu söhbətə giriş icazəniz yoxdur');
    }
    
    try {
        $pdo->beginTransaction();
        
        // Mesajı əlavə et
        $stmt = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, content, status, created_at)
            VALUES (?, ?, ?, 'sent', NOW())
        ");
        $stmt->execute([$conversation_id, $current_user['id'], $content]);
        $message_id = $pdo->lastInsertId();
        
        // Söhbətin son mesaj vaxtını yenilə
        $stmt = $pdo->prepare("
            UPDATE conversations SET last_message_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$conversation_id]);
        
        // Mesaj məlumatlarını əldə et
        $stmt = $pdo->prepare("
            SELECT m.*, 
                   u.username as sender_username,
                   u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        ");
        $stmt->execute([$message_id]);
        $message = $stmt->fetch();
        
        // Bildiriş göndər
        // İlk öncə digər iştirakçını tap
        $stmt = $pdo->prepare("
            SELECT u.id
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = ? AND cp.user_id != ?
        ");
        $stmt->execute([$conversation_id, $current_user['id']]);
        $other_user = $stmt->fetch();
        
        if ($other_user) {
            // Söhbət haqqında məlumat
            $stmt = $pdo->prepare("
                SELECT c.*, i.title as item_title
                FROM conversations c
                LEFT JOIN items i ON c.item_id = i.id
                WHERE c.id = ?
            ");
            $stmt->execute([$conversation_id]);
            $conversation = $stmt->fetch();
            
            // Bildiriş mətni
            $notification_content = $current_user['username'] . " sizə yeni mesaj göndərdi";
            
            if (isset($conversation['item_title']) && $conversation['item_title']) {
                $notification_content .= ". Elan: " . $conversation['item_title'];
            }
            
            // Bildiriş əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, type, reference_id, content, is_read, created_at)
                VALUES (?, 'message', ?, ?, 0, NOW())
            ");
            $stmt->execute([$other_user['id'], $conversation_id, $notification_content]);
        }
        
        $pdo->commit();
        
        sendJsonResponse(true, 'Mesaj uğurla göndərildi', [
            'message' => $message
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(false, 'Mesaj göndərilərkən xəta baş verdi: ' . $e->getMessage());
    }
}
// Digər metodlar
else {
    sendJsonResponse(false, 'İcazə verilməyən metod');
}

/**
 * JSON cavabı göndər
 */
function sendJsonResponse($success, $message, $data = []) {
    header('Content-Type: application/json');
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}
?>