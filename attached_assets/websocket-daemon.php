<?php
/**
 * BarterTap.az - WebSocket Daemon
 * 
 * WebSocket serveri işə salan daemon skripti.
 * Bu skript arxa planda işləyir və real-time bildiriş və mesajlaşma xidmətini təmin edir.
 * 
 * İstifadə: php websocket-daemon.php
 */

require_once 'vendor/autoload.php';
require_once 'includes/config.php';
require_once 'includes/websocket-server.php';

use BarterTap\WebSocketServer;

// Sabit dəyərlər
define('WS_HOST', '0.0.0.0'); // Bütün şəbəkə interfeyslərində dinlə
define('WS_PORT', 8080);      // WebSocket port

// Əsas funksiya
function main() {
    global $pdo;
    
    echo "BarterTap.az - WebSocket Daemon\n";
    echo "================================\n";
    echo "Tarix: " . date('Y-m-d H:i:s') . "\n";
    echo "Host: " . WS_HOST . "\n";
    echo "Port: " . WS_PORT . "\n";
    echo "--------------------------------\n";
    
    try {
        // WebSocket serveri başlat
        \BarterTap\startWebSocketServer(WS_HOST, WS_PORT, $pdo);
    } catch (\Exception $e) {
        die("Xəta: " . $e->getMessage() . "\n");
    }
}

// Əsas funksiyanı çağır
main();
?>