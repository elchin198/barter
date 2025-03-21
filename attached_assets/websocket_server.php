<?php
/**
 * BarterTap.az - WebSocket Server
 * 
 * Bu fayl, real-time mesajlaşma imkanı üçün WebSocket serveri təmin edir.
 * Ratchet kitabxanasından istifadə edir.
 * 
 * İstifadə: php websocket_server.php
 */

// Autoloader
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/config.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

/**
 * WebSocket əsas sinifi
 */
class BarterChatServer implements MessageComponentInterface {
    protected $clients;
    protected $users = [];
    protected $pdo;
    
    public function __construct($pdo) {
        $this->clients = new \SplObjectStorage;
        $this->pdo = $pdo;
        echo "WebSocket server başladıldı.\n";
    }
    
    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "Yeni bağlantı! ({$conn->resourceId})\n";
    }
    
    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        // Data formatı yoxlaması
        if (!$data || !isset($data['type'])) {
            return;
        }
        
        echo "Qəbul edilmiş mesaj: {$data['type']} ({$from->resourceId})\n";
        
        switch ($data['type']) {
            case 'auth':
                // İstifadəçi girişini qeyd et
                if (isset($data['userId'])) {
                    $userId = (int) $data['userId'];
                    $this->users[$from->resourceId] = $userId;
                    
                    // İstifadəçi məlumatlarını əldə et
                    $stmt = $this->pdo->prepare("SELECT username FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    // Uğurlu giriş bildirişi göndər
                    $from->send(json_encode([
                        'type' => 'auth_success',
                        'message' => 'Uğurla bağlantı quruldu'
                    ]));
                    
                    echo "İstifadəçi bağlandı: {$userId} ({$user['username']})\n";
                }
                break;
                
            case 'message':
                // Yeni mesaj göndər
                if (isset($data['conversationId'], $data['content']) && isset($this->users[$from->resourceId])) {
                    $userId = $this->users[$from->resourceId];
                    $conversationId = (int) $data['conversationId'];
                    $content = trim($data['content']);
                    
                    if (empty($content)) {
                        break;
                    }
                    
                    try {
                        // İstifadəçinin bu söhbətə qoşulduğunu yoxla
                        $stmt = $this->pdo->prepare("
                            SELECT cp.user_id 
                            FROM conversation_participants cp 
                            WHERE cp.conversation_id = ? AND cp.user_id = ?
                        ");
                        $stmt->execute([$conversationId, $userId]);
                        
                        if (!$stmt->fetch()) {
                            $from->send(json_encode([
                                'type' => 'error',
                                'message' => 'Bu söhbətə qoşulmamısınız'
                            ]));
                            break;
                        }
                        
                        // Mesajı əlavə et
                        $stmt = $this->pdo->prepare("
                            INSERT INTO messages (conversation_id, sender_id, content, status, created_at)
                            VALUES (?, ?, ?, 'sent', NOW())
                        ");
                        $stmt->execute([$conversationId, $userId, $content]);
                        
                        $messageId = $this->pdo->lastInsertId();
                        
                        // Söhbət son mesaj vaxtını yenilə
                        $stmt = $this->pdo->prepare("
                            UPDATE conversations SET last_message_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$conversationId]);
                        
                        // Yeni mesaj məlumatlarını əldə et
                        $stmt = $this->pdo->prepare("
                            SELECT m.*, u.username as sender_username
                            FROM messages m
                            JOIN users u ON m.sender_id = u.id
                            WHERE m.id = ?
                        ");
                        $stmt->execute([$messageId]);
                        $message = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        // Söhbət iştirakçılarına göndər
                        $this->sendToConversationParticipants($conversationId, [
                            'type' => 'new_message',
                            'conversationId' => $conversationId,
                            'message' => $message
                        ]);
                        
                        echo "Yeni mesaj göndərildi: {$messageId} ({$userId} tərəfindən)\n";
                    } catch (\Exception $e) {
                        echo "Mesaj göndərmə xətası: " . $e->getMessage() . "\n";
                        $from->send(json_encode([
                            'type' => 'error',
                            'message' => 'Mesaj göndərilə bilmədi'
                        ]));
                    }
                }
                break;
                
            case 'typing':
                // Yazır indikatoru
                if (isset($data['conversationId']) && isset($this->users[$from->resourceId])) {
                    $userId = $this->users[$from->resourceId];
                    $conversationId = (int) $data['conversationId'];
                    
                    // İstifadəçi məlumatlarını əldə et
                    $stmt = $this->pdo->prepare("SELECT username FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    // Söhbət iştirakçılarına göndər
                    $this->sendToConversationParticipants($conversationId, [
                        'type' => 'typing',
                        'conversationId' => $conversationId,
                        'userId' => $userId,
                        'username' => $user['username']
                    ], [$userId]); // Göndərənə göndərmə
                    
                    echo "Yazır indikatoru: {$userId} ({$user['username']})\n";
                }
                break;
                
            case 'read':
                // Mesajları oxundu olaraq işarələ
                if (isset($data['conversationId']) && isset($this->users[$from->resourceId])) {
                    $userId = $this->users[$from->resourceId];
                    $conversationId = (int) $data['conversationId'];
                    
                    try {
                        // İstifadəçinin bu söhbətə qoşulduğunu yoxla
                        $stmt = $this->pdo->prepare("
                            SELECT cp.user_id 
                            FROM conversation_participants cp 
                            WHERE cp.conversation_id = ? AND cp.user_id = ?
                        ");
                        $stmt->execute([$conversationId, $userId]);
                        
                        if (!$stmt->fetch()) {
                            break;
                        }
                        
                        // Digər istifadəçilərin mesajlarını oxundu olaraq işarələ
                        $stmt = $this->pdo->prepare("
                            UPDATE messages 
                            SET status = 'read' 
                            WHERE conversation_id = ? AND sender_id != ? AND status != 'read'
                        ");
                        $stmt->execute([$conversationId, $userId]);
                        
                        // Yenilənmiş mesajları əldə et
                        $stmt = $this->pdo->prepare("
                            SELECT id 
                            FROM messages 
                            WHERE conversation_id = ? AND sender_id != ? AND status = 'read'
                        ");
                        $stmt->execute([$conversationId, $userId]);
                        $readMessageIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                        
                        // Söhbət iştirakçılarına mesaj statusu dəyişikliyini göndər
                        foreach ($readMessageIds as $messageId) {
                            $this->sendToConversationParticipants($conversationId, [
                                'type' => 'message_status',
                                'messageId' => $messageId,
                                'status' => 'read'
                            ]);
                        }
                        
                        echo "Mesajlar oxundu olaraq işarələndi: {$conversationId} ({$userId} tərəfindən)\n";
                    } catch (\Exception $e) {
                        echo "Mesaj oxunma xətası: " . $e->getMessage() . "\n";
                    }
                }
                break;
        }
    }
    
    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        
        // İstifadəçi əlaqəsini sil
        if (isset($this->users[$conn->resourceId])) {
            $userId = $this->users[$conn->resourceId];
            unset($this->users[$conn->resourceId]);
            echo "İstifadəçi bağlantısı kəsildi: {$userId} ({$conn->resourceId})\n";
        } else {
            echo "Bağlantı bağlandı: {$conn->resourceId}\n";
        }
    }
    
    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Xəta: {$e->getMessage()}\n";
        $conn->close();
    }
    
    /**
     * Söhbət iştirakçılarına mesaj göndər
     */
    protected function sendToConversationParticipants($conversationId, $data, $excludeUserIds = []) {
        try {
            // Söhbət iştirakçılarını əldə et
            $stmt = $this->pdo->prepare("
                SELECT user_id 
                FROM conversation_participants 
                WHERE conversation_id = ?
            ");
            $stmt->execute([$conversationId]);
            $participantIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Məlumatı JSON-a çevir
            $encodedData = json_encode($data);
            
            // İştirakçılara göndər
            foreach ($this->clients as $client) {
                $resourceId = $client->resourceId;
                
                if (isset($this->users[$resourceId])) {
                    $clientUserId = $this->users[$resourceId];
                    
                    // İstifadəçi söhbətin iştirakçısıdır və istisna listdə deyil
                    if (in_array($clientUserId, $participantIds) && !in_array($clientUserId, $excludeUserIds)) {
                        $client->send($encodedData);
                    }
                }
            }
        } catch (\Exception $e) {
            echo "Mesaj göndərmə xətası: " . $e->getMessage() . "\n";
        }
    }
}

// PDO bağlantısı bir daha initialize
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (\PDOException $e) {
    echo "Verilənlər bazası bağlantı xətası: " . $e->getMessage() . "\n";
    exit(1);
}

// WebSocket serveri başlat
$port = 8080;
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new BarterChatServer($pdo)
        )
    ),
    $port
);

echo "WebSocket serveri başladıldı - Port: {$port}\n";
$server->run();
?>