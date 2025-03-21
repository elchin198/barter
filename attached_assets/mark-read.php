<?php
/**
 * Mesajları oxundu olaraq işarələ API
 * Bu API endpointi söhbətdəki mesajları oxundu olaraq qeyd edir
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

// Yalnız POST tələbi
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Yalnız POST tələbi qəbul edilir'
    ]);
    exit;
}

// JSON gövdəsini al
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Söhbət ID-sini yoxla
if (!isset($data['conversation_id'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Söhbət ID-si təmin edilməyib'
    ]);
    exit;
}

$conversation_id = (int)$data['conversation_id'];

// İstifadəçinin bu söhbətə icazəsi olduğunu yoxla
$stmt = $pdo->prepare("
    SELECT cp.id
    FROM conversation_participants cp
    WHERE cp.conversation_id = ? AND cp.user_id = ?
");
$stmt->execute([$conversation_id, $current_user['id']]);

if (!$stmt->fetch()) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Bu söhbətə giriş icazəniz yoxdur'
    ]);
    exit;
}

try {
    // Digər istifadəçilərin mesajlarını oxundu olaraq işarələ
    $stmt = $pdo->prepare("
        UPDATE messages
        SET status = 'read'
        WHERE conversation_id = ? AND sender_id != ? AND status IN ('sent', 'delivered')
    ");
    $stmt->execute([$conversation_id, $current_user['id']]);
    
    // Yenilənmiş mesajları əldə et
    $stmt = $pdo->prepare("
        SELECT id 
        FROM messages 
        WHERE conversation_id = ? AND sender_id != ? AND status = 'read'
    ");
    $stmt->execute([$conversation_id, $current_user['id']]);
    $message_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Mesajlar oxundu olaraq işarələndi',
        'message_ids' => $message_ids
    ]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Xəta baş verdi: ' . $e->getMessage()
    ]);
}
?>