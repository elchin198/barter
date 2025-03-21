<?php
/**
 * Bildirişlər API
 * Bu API endpointi bildirişləri idarə edir
 */

require_once '../includes/config.php';
require_once '../includes/notifications.php';

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

// GET tələbi - bildirişləri əldə et
if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'list';
    
    switch ($action) {
        case 'count':
            // Oxunmamış bildiriş sayını əldə et
            $count = getUnreadNotificationsCount($pdo, $current_user['id']);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'count' => $count
            ]);
            break;
            
        case 'list':
        default:
            // Bildirişləri əldə et
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $include_read = isset($_GET['include_read']) ? (bool)$_GET['include_read'] : true;
            
            $notifications = getUserNotifications($pdo, $current_user['id'], $limit, $offset, $include_read);
            
            // HTML formatında qaytarma
            $format = isset($_GET['format']) ? $_GET['format'] : 'json';
            
            if ($format === 'html') {
                echo renderNotifications($notifications);
            } else {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'notifications' => $notifications
                ]);
            }
            break;
    }
}
// POST tələbi - bildirişləri yenilə
else if ($method === 'POST') {
    // JSON gövdəsini al
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        // Form data kimi göndərilmiş ola bilər
        $data = $_POST;
    }
    
    $action = isset($data['action']) ? $data['action'] : '';
    
    switch ($action) {
        case 'mark_read':
            // Bildirişi oxundu kimi işarələ
            $notification_id = isset($data['notification_id']) ? (int)$data['notification_id'] : 0;
            
            if ($notification_id <= 0) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Bildiriş ID göstərilməyib'
                ]);
                break;
            }
            
            $success = markNotificationAsRead($pdo, $notification_id, $current_user['id']);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => $success,
                'message' => $success ? 'Bildiriş oxundu kimi işarələndi' : 'Bildiriş işarələnə bilmədi'
            ]);
            break;
            
        case 'mark_all_read':
            // Bütün bildirişləri oxundu kimi işarələ
            $success = markAllNotificationsAsRead($pdo, $current_user['id']);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => $success,
                'message' => $success ? 'Bütün bildirişlər oxundu kimi işarələndi' : 'Bildirişlər işarələnə bilmədi'
            ]);
            break;
            
        case 'subscribe_push':
            // Push bildirişlərinə abunə ol
            $subscription = isset($data['subscription']) ? $data['subscription'] : null;
            
            if (!$subscription) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Abunəlik məlumatları göstərilməyib'
                ]);
                break;
            }
            
            try {
                // İstifadəçinin abunəlik məlumatlarını yadda saxla
                $stmt = $pdo->prepare("
                    INSERT INTO push_subscriptions (user_id, subscription, created_at)
                    VALUES (?, ?, NOW())
                    ON DUPLICATE KEY UPDATE subscription = ?, updated_at = NOW()
                ");
                
                $subscription_json = json_encode($subscription);
                $stmt->execute([$current_user['id'], $subscription_json, $subscription_json]);
                
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'Push bildirişlərinə uğurla abunə oldunuz'
                ]);
            } catch (Exception $e) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Xəta baş verdi: ' . $e->getMessage()
                ]);
            }
            break;
            
        case 'unsubscribe_push':
            // Push bildirişlərindən imtina et
            try {
                $stmt = $pdo->prepare("
                    DELETE FROM push_subscriptions 
                    WHERE user_id = ?
                ");
                
                $stmt->execute([$current_user['id']]);
                
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'message' => 'Push bildirişlərindən uğurla imtina etdiniz'
                ]);
            } catch (Exception $e) {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Xəta baş verdi: ' . $e->getMessage()
                ]);
            }
            break;
            
        default:
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Naməlum əməliyyat'
            ]);
    }
}
// Digər metodlar
else {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'İcazə verilməyən metod'
    ]);
}
?>