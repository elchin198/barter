<?php
/**
 * BarterTap.az - WebSocket Server
 * 
 * Real-time bildiriş və mesajlaşma üçün WebSocket server
 * Ratchet kütübxanasından istifadə edir
 */

namespace BarterTap;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

/**
 * WebSocket əsas sinfi
 */
class WebSocketServer implements MessageComponentInterface {
    protected $clients;
    protected $userConnections = [];
    protected $pdo;

    /**
     * Constructor - bazanı və müştəri kolleksiyasını işə salır
     */
    public function __construct($pdo) {
        $this->clients = new \SplObjectStorage;
        $this->pdo = $pdo;
        echo "WebSocket server başladıldı...\n";
    }

    /**
     * Yeni əlaqə qurulduqda
     */
    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "Yeni əlaqə: {$conn->resourceId}\n";
    }

    /**
     * Müştəridən mesaj alındıqda
     */
    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (!$data || !isset($data['action'])) {
            echo "Yanlış format: $msg\n";
            return;
        }
        
        echo "Mesaj alındı ({$data['action']}): {$from->resourceId}\n";
        
        switch ($data['action']) {
            case 'auth':
                $this->handleAuth($from, $data);
                break;
                
            case 'typing':
                $this->handleTyping($from, $data);
                break;
                
            case 'read_message':
                $this->handleReadMessage($from, $data);
                break;
                
            case 'activity':
                $this->handleActivity($from, $data);
                break;
                
            case 'ping':
                $this->handlePing($from);
                break;
                
            default:
                echo "Bilinməyən əməliyyat: {$data['action']}\n";
        }
    }

    /**
     * Əlaqə bağlandıqda
     */
    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        
        // İstifadəçi əlaqəsini userConnections massivindən sil
        foreach ($this->userConnections as $userId => $connections) {
            if (($key = array_search($conn, $connections)) !== false) {
                unset($this->userConnections[$userId][$key]);
                
                // Əgər istifadəçinin bütün əlaqələri bağlanıbsa, massivdən tamamilə sil
                if (empty($this->userConnections[$userId])) {
                    unset($this->userConnections[$userId]);
                    
                    // İstifadəçinin offline olduğunu bildirən məlumatı göndər
                    $this->broadcastUserStatus($userId, 'offline');
                }
                
                break;
            }
        }
        
        echo "Əlaqə bağlandı: {$conn->resourceId}\n";
    }

    /**
     * Xəta baş verdikdə
     */
    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Xəta: {$e->getMessage()}\n";
        $conn->close();
    }

    /**
     * İstifadəçi autentifikasiyası
     */
    protected function handleAuth(ConnectionInterface $conn, $data) {
        if (!isset($data['token']) || !isset($data['user_id'])) {
            $this->sendError($conn, 'auth', 'Token və ya istifadəçi ID-si təqdim edilməyib');
            return;
        }
        
        $token = $data['token'];
        $userId = (int)$data['user_id'];
        
        // Token yoxlanışı
        try {
            $stmt = $this->pdo->prepare("SELECT id, username FROM users WHERE id = ? AND session_token = ?");
            $stmt->execute([$userId, $token]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$user) {
                $this->sendError($conn, 'auth', 'Yanlış autentifikasiya məlumatları');
                return;
            }
            
            // İstifadəçini əlaqələr siyahısına əlavə et
            if (!isset($this->userConnections[$userId])) {
                $this->userConnections[$userId] = [];
            }
            $this->userConnections[$userId][] = $conn;
            
            // Əlaqəyə istifadəçi İD-sini əlavə et
            $conn->userId = $userId;
            $conn->username = $user['username'];
            
            // Uğurlu cavab göndər
            $this->sendSuccess($conn, 'auth', [
                'user_id' => $userId,
                'username' => $user['username']
            ]);
            
            // İstifadəçinin online olduğunu bildirən məlumatı göndər
            $this->broadcastUserStatus($userId, 'online');
            
            // Oxunmamış bildirişləri göndər
            $this->sendUnreadNotifications($conn, $userId);
            
            echo "İstifadəçi autentifikasiya olundu: $userId (conn: {$conn->resourceId})\n";
        } catch (\PDOException $e) {
            $this->sendError($conn, 'auth', 'Verilənlər bazası xətası: ' . $e->getMessage());
        }
    }

    /**
     * İstifadəçinin oxunmamış bildirişlərini göndər
     */
    protected function sendUnreadNotifications(ConnectionInterface $conn, $userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, type, title, body, data, created_at 
                FROM notifications 
                WHERE user_id = ? AND is_read = 0
                ORDER BY created_at DESC
                LIMIT 20
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            if ($notifications) {
                $this->send($conn, [
                    'action' => 'notifications',
                    'status' => 'success',
                    'unread_count' => count($notifications),
                    'notifications' => $notifications
                ]);
            }
        } catch (\PDOException $e) {
            $this->sendError($conn, 'notifications', 'Verilənlər bazası xətası: ' . $e->getMessage());
        }
    }

    /**
     * İstifadəçi yazır bildirişini emal et
     */
    protected function handleTyping(ConnectionInterface $from, $data) {
        if (!isset($from->userId) || !isset($data['conversation_id']) || !isset($data['recipient_id'])) {
            $this->sendError($from, 'typing', 'Tələb olunan parametrlər təqdim edilməyib');
            return;
        }
        
        $conversationId = (int)$data['conversation_id'];
        $recipientId = (int)$data['recipient_id'];
        $isTyping = isset($data['is_typing']) ? (bool)$data['is_typing'] : true;
        
        // Qəbul edənə əlaqə var?
        if (isset($this->userConnections[$recipientId])) {
            // Qəbul edənin bütün aktiv əlaqələrinə bildiriş göndər
            foreach ($this->userConnections[$recipientId] as $conn) {
                $this->send($conn, [
                    'action' => 'typing',
                    'conversation_id' => $conversationId,
                    'user_id' => $from->userId,
                    'username' => $from->username,
                    'is_typing' => $isTyping
                ]);
            }
        }
    }

    /**
     * Mesaj oxundu bildirişini emal et
     */
    protected function handleReadMessage(ConnectionInterface $from, $data) {
        if (!isset($from->userId) || !isset($data['message_ids']) || !isset($data['conversation_id']) || !isset($data['sender_id'])) {
            $this->sendError($from, 'read_message', 'Tələb olunan parametrlər təqdim edilməyib');
            return;
        }
        
        $messageIds = $data['message_ids'];
        $conversationId = (int)$data['conversation_id'];
        $senderId = (int)$data['sender_id'];
        
        if (!is_array($messageIds) || empty($messageIds)) {
            $this->sendError($from, 'read_message', 'Mesaj ID-ləri düzgün formatda deyil');
            return;
        }
        
        try {
            // Mesajları oxunmuş kimi işarələ
            $placeholders = implode(',', array_fill(0, count($messageIds), '?'));
            $stmt = $this->pdo->prepare("
                UPDATE messages 
                SET status = 'read', updated_at = NOW() 
                WHERE id IN ($placeholders) AND conversation_id = ? AND sender_id = ? AND recipient_id = ?
            ");
            
            $params = array_merge($messageIds, [$conversationId, $senderId, $from->userId]);
            $stmt->execute($params);
            
            // Göndərənə bildiriş göndər
            if (isset($this->userConnections[$senderId])) {
                foreach ($this->userConnections[$senderId] as $conn) {
                    $this->send($conn, [
                        'action' => 'message_read',
                        'status' => 'success',
                        'conversation_id' => $conversationId,
                        'message_ids' => $messageIds,
                        'reader_id' => $from->userId,
                        'reader_username' => $from->username
                    ]);
                }
            }
        } catch (\PDOException $e) {
            $this->sendError($from, 'read_message', 'Verilənlər bazası xətası: ' . $e->getMessage());
        }
    }

    /**
     * İstifadəçi aktivliyi bildirişini emal et
     */
    protected function handleActivity(ConnectionInterface $from, $data) {
        if (!isset($from->userId) || !isset($data['type'])) {
            $this->sendError($from, 'activity', 'Tələb olunan parametrlər təqdim edilməyib');
            return;
        }
        
        $activityType = $data['type'];
        $activityData = isset($data['data']) ? $data['data'] : [];
        
        // Aktivlik məlumatını yadda saxla
        try {
            $stmt = $this->pdo->prepare("
                UPDATE users 
                SET last_activity = NOW(), last_activity_type = ? 
                WHERE id = ?
            ");
            $stmt->execute([$activityType, $from->userId]);
            
            // İstifadəçini izləyənlərə bildiriş göndər (əgər lazımdırsa)
            if (in_array($activityType, ['new_item', 'profile_updated', 'completed_barter'])) {
                $this->notifyFollowers($from->userId, $activityType, $activityData);
            }
        } catch (\PDOException $e) {
            $this->sendError($from, 'activity', 'Verilənlər bazası xətası: ' . $e->getMessage());
        }
    }

    /**
     * İstifadəçini izləyənlərə bildiriş göndər
     */
    protected function notifyFollowers($userId, $activityType, $activityData) {
        try {
            // İstifadəçini izləyənləri tap
            $stmt = $this->pdo->prepare("
                SELECT uc.user_id, u.username
                FROM user_connections uc
                JOIN users u ON uc.user_id = u.id
                WHERE uc.followed_user_id = ?
            ");
            $stmt->execute([$userId]);
            $followers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            if (empty($followers)) {
                return;
            }
            
            // İzləyən istifadəçinin məlumatlarını əldə et
            $stmt = $this->pdo->prepare("
                SELECT id, username, full_name, avatar
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$user) {
                return;
            }
            
            // Aktivlik növünə görə bildiriş mətnini hazırla
            $title = '';
            $body = '';
            $type = '';
            
            switch ($activityType) {
                case 'new_item':
                    $type = 'follow_new_item';
                    $title = 'Yeni elan';
                    $body = $user['username'] . ' yeni elan əlavə etdi';
                    break;
                    
                case 'profile_updated':
                    $type = 'follow_profile_update';
                    $title = 'Profil yeniləmə';
                    $body = $user['username'] . ' profilini yenilədi';
                    break;
                    
                case 'completed_barter':
                    $type = 'follow_completed_barter';
                    $title = 'Tamamlanmış barter';
                    $body = $user['username'] . ' bir barter tamamladı';
                    break;
                    
                default:
                    return;
            }
            
            // Bildirişləri göndər
            foreach ($followers as $follower) {
                // Verilənlər bazasında bildirişi yadda saxla
                $notificationData = json_encode(array_merge([
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'avatar' => $user['avatar'],
                    'activity_type' => $activityType
                ], $activityData));
                
                $stmt = $this->pdo->prepare("
                    INSERT INTO notifications (user_id, type, title, body, data, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$follower['user_id'], $type, $title, $body, $notificationData]);
                $notificationId = $this->pdo->lastInsertId();
                
                // Əgər istifadəçi indi online-dırsa, real-time bildiriş göndər
                if (isset($this->userConnections[$follower['user_id']])) {
                    foreach ($this->userConnections[$follower['user_id']] as $conn) {
                        $this->send($conn, [
                            'action' => 'new_notification',
                            'notification' => [
                                'id' => $notificationId,
                                'type' => $type,
                                'title' => $title,
                                'body' => $body,
                                'data' => json_decode($notificationData, true),
                                'created_at' => date('Y-m-d H:i:s')
                            ]
                        ]);
                    }
                }
            }
        } catch (\PDOException $e) {
            echo "İzləyənlərə bildiriş göndərilməsi zamanı xəta: " . $e->getMessage() . "\n";
        }
    }

    /**
     * İstifadəçinin online statusunu yayımla
     */
    protected function broadcastUserStatus($userId, $status) {
        try {
            // İstifadəçini izləyənləri tap
            $stmt = $this->pdo->prepare("
                SELECT uc.user_id 
                FROM user_connections uc
                WHERE uc.followed_user_id = ?
            ");
            $stmt->execute([$userId]);
            $followers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            if (empty($followers)) {
                return;
            }
            
            // İstifadəçi məlumatlarını əldə et
            $stmt = $this->pdo->prepare("
                SELECT username, full_name, avatar, profile_status
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$user) {
                return;
            }
            
            // İzləyicilərə istifadəçinin statusunu göndər
            foreach ($followers as $follower) {
                if (isset($this->userConnections[$follower['user_id']])) {
                    foreach ($this->userConnections[$follower['user_id']] as $conn) {
                        $this->send($conn, [
                            'action' => 'user_status',
                            'user_id' => $userId,
                            'username' => $user['username'],
                            'full_name' => $user['full_name'],
                            'avatar' => $user['avatar'],
                            'profile_status' => $user['profile_status'],
                            'status' => $status, // 'online' və ya 'offline'
                            'last_activity' => date('Y-m-d H:i:s')
                        ]);
                    }
                }
            }
        } catch (\PDOException $e) {
            echo "İstifadəçi statusunun yayımlanması zamanı xəta: " . $e->getMessage() . "\n";
        }
    }

    /**
     * Ping sorğusuna cavab ver
     */
    protected function handlePing(ConnectionInterface $conn) {
        $this->send($conn, [
            'action' => 'pong',
            'time' => time()
        ]);
    }

    /**
     * Uğurlu cavab göndər
     */
    protected function sendSuccess(ConnectionInterface $conn, $action, $data = []) {
        $this->send($conn, array_merge([
            'action' => $action,
            'status' => 'success'
        ], $data));
    }

    /**
     * Xəta mesajı göndər
     */
    protected function sendError(ConnectionInterface $conn, $action, $message) {
        $this->send($conn, [
            'action' => $action,
            'status' => 'error',
            'message' => $message
        ]);
    }

    /**
     * İstifadəçiyə mesaj göndər
     */
    protected function send(ConnectionInterface $conn, $data) {
        $conn->send(json_encode($data));
    }

    /**
     * Yayım - bütün istifadəçilərə mesaj göndər
     */
    protected function broadcast($data, $exceptConnectionId = null) {
        foreach ($this->clients as $client) {
            if ($exceptConnectionId === null || $client->resourceId != $exceptConnectionId) {
                $client->send(json_encode($data));
            }
        }
    }
}

/**
 * WebSocket serveri başlat
 */
function startWebSocketServer($host, $port, $pdo) {
    $server = IoServer::factory(
        new HttpServer(
            new WsServer(
                new WebSocketServer($pdo)
            )
        ),
        $port,
        $host
    );

    echo "WebSocket server dinlənilir: $host:$port\n";
    $server->run();
}
?>