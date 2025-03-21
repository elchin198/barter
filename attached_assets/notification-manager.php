<?php
/**
 * BarterTap.az - Bildiriş İdarəetmə Sistemi
 * 
 * Bu sinif istifadəçi bildirişlərini yaratmaq, oxumaq və idarə etmək üçün müxtəlif funksiyalar təmin edir.
 * Push və in-app bildirişləri dəstəkləyir.
 */

namespace BarterTap;

class NotificationManager {
    protected $pdo;
    protected $currentUser;
    
    // Bildiriş növləri və mətn şablonları
    protected $notificationTemplates = [
        // Barter əlaqəli bildirişlər
        'new_offer' => [
            'title' => 'Yeni barter təklifi',
            'body' => '{sender_name} sizə {item_title} üçün barter təklif etdi.'
        ],
        'offer_accepted' => [
            'title' => 'Təklif qəbul edildi',
            'body' => '{recipient_name} təklifinizi qəbul etdi.'
        ],
        'offer_rejected' => [
            'title' => 'Təklif rədd edildi',
            'body' => '{recipient_name} təklifinizi qəbul etmədi.'
        ],
        'offer_canceled' => [
            'title' => 'Təklif ləğv edildi',
            'body' => '{sender_name} təklifini geri götürdü.'
        ],
        'offer_expired' => [
            'title' => 'Təklif vaxtı bitdi',
            'body' => '{item_title} üçün barter təklifinin vaxtı bitdi.'
        ],
        'barter_completed' => [
            'title' => 'Barter tamamlandı',
            'body' => '{item_title} üçün barter mübadiləsi uğurla tamamlandı.'
        ],
        
        // Mesajlaşma bildirişləri
        'new_message' => [
            'title' => 'Yeni mesaj',
            'body' => '{sender_name}: {message_preview}'
        ],
        
        // İzləmə bildirişləri
        'new_follower' => [
            'title' => 'Yeni izləyici',
            'body' => '{follower_name} sizi izləməyə başladı.'
        ],
        'follow_new_item' => [
            'title' => 'Yeni elan',
            'body' => '{username} yeni elan əlavə etdi: {item_title}'
        ],
        'follow_profile_update' => [
            'title' => 'Profil yeniləmə',
            'body' => '{username} profilini yenilədi'
        ],
        'follow_completed_barter' => [
            'title' => 'Barter tamamlandı',
            'body' => '{username} bir barter tamamladı'
        ],
        
        // Elan əlaqəli bildirişlər
        'item_favorite' => [
            'title' => 'Elanınız favorit edildi',
            'body' => '{user_name} {item_title} elanınızı favoritlərə əlavə etdi.'
        ],
        'item_view' => [
            'title' => 'Elanınıza baxıldı',
            'body' => '{item_title} elanınız {view_count} dəfə baxıldı!'
        ],
        'item_expiring' => [
            'title' => 'Elan müddəti bitir',
            'body' => '{item_title} elanınızın müddəti 3 gün sonra bitəcək.'
        ],
        'item_expired' => [
            'title' => 'Elan müddəti bitdi',
            'body' => '{item_title} elanınızın müddəti bitdi və artıq aktiv deyil.'
        ],
        
        // Sistem bildirişləri
        'system_maintenance' => [
            'title' => 'Sistem saxlama',
            'body' => 'Platforma {maintenance_time} tarixində texniki xidmət üçün müvəqqəti olaraq əlçatan olmayacaq.'
        ],
        'system_update' => [
            'title' => 'Sistem yeniləməsi',
            'body' => 'Platforma yeniləndi! Yeni xüsusiyyətləri kəşf edin.'
        ],
        'account_security' => [
            'title' => 'Hesab təhlükəsizliyi',
            'body' => 'Hesabınıza yeni bir cihazdan giriş edildi. Siz deyilsinizsə, dərhal şifrənizi dəyişdirin.'
        ]
    ];
    
    /**
     * Constructor
     */
    public function __construct($pdo, $currentUser = null) {
        $this->pdo = $pdo;
        $this->currentUser = $currentUser;
    }
    
    /**
     * İstifadəçiyə bildiriş göndər
     * 
     * @param int $userId Bildiriş göndəriləcək istifadəçi ID-si
     * @param string $type Bildiriş növü
     * @param string $title Bildiriş başlığı (null olarsa şablondan götürülür)
     * @param string $body Bildiriş mətni (null olarsa şablondan götürülür)
     * @param array $data Əlavə məlumat və template dəyişənləri
     * @param bool $sendPush Push bildiriş göndərilsin?
     * @return int|false Yaradılan bildiriş ID-si və ya false
     */
    public function sendNotification($userId, $type, $title = null, $body = null, $data = [], $sendPush = true) {
        try {
            // Bildiriş növü düzgündür?
            if (!isset($this->notificationTemplates[$type]) && ($title === null || $body === null)) {
                throw new \Exception("Bildiriş növü tanınmır və ya başlıq/mətn təqdim edilməyib: $type");
            }
            
            // Şablondan title və body götür, əgər verilməyibsə
            if ($title === null) {
                $title = $this->notificationTemplates[$type]['title'];
            }
            
            if ($body === null) {
                $body = $this->notificationTemplates[$type]['body'];
            }
            
            // Şablon dəyişənlərini əvəz et
            $title = $this->parseTemplate($title, $data);
            $body = $this->parseTemplate($body, $data);
            
            // Bildirişi verilənlər bazasında saxla
            $stmt = $this->pdo->prepare("
                INSERT INTO notifications (user_id, type, title, body, data, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $userId,
                $type,
                $title,
                $body,
                !empty($data) ? json_encode($data) : null
            ]);
            
            $notificationId = $this->pdo->lastInsertId();
            
            // Oxunmamış bildiriş sayını yenilə
            $this->updateUnreadCount($userId);
            
            // Push bildirişi göndər
            if ($sendPush) {
                $this->sendPushNotification($userId, $title, $body, $type, $data);
            }
            
            return $notificationId;
        } catch (\Exception $e) {
            error_log("Bildiriş göndərilməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Bildirişi oxunmuş kimi işarələ
     * 
     * @param int $notificationId Bildiriş ID-si
     * @param int $userId İstifadəçi ID-si (təhlükəsizlik yoxlanışı üçün)
     * @return bool
     */
    public function markAsRead($notificationId, $userId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE notifications
                SET is_read = 1, read_at = NOW()
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([$notificationId, $userId]);
            
            // Oxunmamış bildiriş sayını yenilə
            $this->updateUnreadCount($userId);
            
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Bildirişi oxunmuş kimi işarələmə zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Bütün bildirişləri oxunmuş kimi işarələ
     * 
     * @param int $userId İstifadəçi ID-si
     * @return bool
     */
    public function markAllAsRead($userId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE notifications
                SET is_read = 1, read_at = NOW()
                WHERE user_id = ? AND is_read = 0
            ");
            
            $stmt->execute([$userId]);
            
            // Oxunmamış bildiriş sayını yenilə
            $this->updateUnreadCount($userId);
            
            return true;
        } catch (\Exception $e) {
            error_log("Bütün bildirişləri oxunmuş kimi işarələmə zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Bildirişi sil
     * 
     * @param int $notificationId Bildiriş ID-si
     * @param int $userId İstifadəçi ID-si (təhlükəsizlik yoxlanışı üçün)
     * @return bool
     */
    public function deleteNotification($notificationId, $userId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM notifications
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([$notificationId, $userId]);
            
            // Oxunmamış bildiriş sayını yenilə
            $this->updateUnreadCount($userId);
            
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("Bildiriş silinməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Bütün bildirişləri sil
     * 
     * @param int $userId İstifadəçi ID-si
     * @return bool
     */
    public function deleteAllNotifications($userId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM notifications
                WHERE user_id = ?
            ");
            
            $stmt->execute([$userId]);
            
            // Oxunmamış bildiriş sayını yenilə
            $this->updateUnreadCount($userId);
            
            return true;
        } catch (\Exception $e) {
            error_log("Bütün bildirişlərin silinməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * İstifadəçinin bildirişlərini əldə et
     * 
     * @param int $userId İstifadəçi ID-si
     * @param int $limit Limit
     * @param int $offset Offset
     * @param bool $unreadOnly Yalnız oxunmamış bildirişlər?
     * @return array
     */
    public function getNotifications($userId, $limit = 20, $offset = 0, $unreadOnly = false) {
        try {
            $sql = "
                SELECT id, type, title, body, data, is_read, created_at, read_at
                FROM notifications
                WHERE user_id = ?
            ";
            
            if ($unreadOnly) {
                $sql .= " AND is_read = 0";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $limit, $offset]);
            
            $notifications = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Əlavə məlumatları JSON-dan deşifrə et
            foreach ($notifications as &$notification) {
                if (!empty($notification['data'])) {
                    $notification['data'] = json_decode($notification['data'], true);
                } else {
                    $notification['data'] = [];
                }
            }
            
            return $notifications;
        } catch (\Exception $e) {
            error_log("Bildirişlərin əldə edilməsi zamanı xəta: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * İstifadəçinin oxunmamış bildiriş sayını əldə et
     * 
     * @param int $userId İstifadəçi ID-si
     * @return int
     */
    public function getUnreadCount($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count
                FROM notifications
                WHERE user_id = ? AND is_read = 0
            ");
            
            $stmt->execute([$userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            return (int)$result['count'];
        } catch (\Exception $e) {
            error_log("Oxunmamış bildiriş sayının əldə edilməsi zamanı xəta: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * İstifadəçinin bildiriş seçimlərini əldə et
     * 
     * @param int $userId İstifadəçi ID-si
     * @return array
     */
    public function getUserNotificationPreferences($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT notification_preferences
                FROM users
                WHERE id = ?
            ");
            
            $stmt->execute([$userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$result || empty($result['notification_preferences'])) {
                // Default seçimləri qaytarın
                return $this->getDefaultNotificationPreferences();
            }
            
            return json_decode($result['notification_preferences'], true);
        } catch (\Exception $e) {
            error_log("İstifadəçi bildiriş seçimlərinin əldə edilməsi zamanı xəta: " . $e->getMessage());
            return $this->getDefaultNotificationPreferences();
        }
    }
    
    /**
     * İstifadəçinin bildiriş seçimlərini yenilə
     * 
     * @param int $userId İstifadəçi ID-si
     * @param array $preferences Seçimlər
     * @return bool
     */
    public function updateUserNotificationPreferences($userId, $preferences) {
        try {
            // Default seçimlərlə birləşdirin (əksik olanları əlavə etmək üçün)
            $defaultPreferences = $this->getDefaultNotificationPreferences();
            $preferences = array_merge($defaultPreferences, $preferences);
            
            $stmt = $this->pdo->prepare("
                UPDATE users
                SET notification_preferences = ?
                WHERE id = ?
            ");
            
            $stmt->execute([json_encode($preferences), $userId]);
            
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("İstifadəçi bildiriş seçimlərinin yenilənməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * İstifadəçinin push bildiriş token-ini qeyd et
     * 
     * @param int $userId İstifadəçi ID-si
     * @param string $token Push bildiriş token-i
     * @param string $platform Platforma (web, android, ios)
     * @return bool
     */
    public function registerPushToken($userId, $token, $platform = 'web') {
        try {
            // Əvvəlcə mövcud token-i yoxlayın
            $stmt = $this->pdo->prepare("
                SELECT id FROM push_tokens
                WHERE user_id = ? AND token = ? AND platform = ?
            ");
            $stmt->execute([$userId, $token, $platform]);
            
            if ($stmt->fetch()) {
                // Token artıq mövcuddur, yenilə
                $stmt = $this->pdo->prepare("
                    UPDATE push_tokens
                    SET last_used = NOW()
                    WHERE user_id = ? AND token = ? AND platform = ?
                ");
                $stmt->execute([$userId, $token, $platform]);
            } else {
                // Yeni token əlavə et
                $stmt = $this->pdo->prepare("
                    INSERT INTO push_tokens (user_id, token, platform, created_at, last_used)
                    VALUES (?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$userId, $token, $platform]);
            }
            
            return true;
        } catch (\Exception $e) {
            error_log("Push bildiriş token-inin qeyd edilməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * İstifadəçinin push bildiriş token-ini sil
     * 
     * @param int $userId İstifadəçi ID-si
     * @param string $token Push bildiriş token-i
     * @return bool
     */
    public function unregisterPushToken($userId, $token) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM push_tokens
                WHERE user_id = ? AND token = ?
            ");
            
            $stmt->execute([$userId, $token]);
            
            return true;
        } catch (\Exception $e) {
            error_log("Push bildiriş token-inin silinməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Push bildirişi göndər
     * 
     * @param int $userId İstifadəçi ID-si
     * @param string $title Bildiriş başlığı
     * @param string $body Bildiriş mətni
     * @param string $type Bildiriş növü
     * @param array $data Əlavə məlumat
     * @return bool
     */
    protected function sendPushNotification($userId, $title, $body, $type, $data = []) {
        try {
            // İstifadəçi bildiriş seçimlərini yoxla
            $preferences = $this->getUserNotificationPreferences($userId);
            
            // Bu növ bildiriş deaktiv edilibsə, göndərmə
            if (isset($preferences[$type]) && $preferences[$type] === false) {
                return false;
            }
            
            // İstifadəçinin push token-lərini əldə et
            $stmt = $this->pdo->prepare("
                SELECT token, platform
                FROM push_tokens
                WHERE user_id = ?
            ");
            
            $stmt->execute([$userId]);
            $tokens = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            if (empty($tokens)) {
                return false;
            }
            
            // Bildiriş məlumatlarını hazırla
            $notificationData = [
                'title' => $title,
                'body' => $body,
                'type' => $type,
                'data' => $data
            ];
            
            // Hər token üçün bildiriş göndər
            foreach ($tokens as $token) {
                $this->dispatchPushNotification($token['token'], $token['platform'], $notificationData);
            }
            
            return true;
        } catch (\Exception $e) {
            error_log("Push bildirişinin göndərilməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Push bildirişini göndərmək üçün servis işlət
     * 
     * @param string $token Push bildiriş token-i
     * @param string $platform Platforma (web, android, ios)
     * @param array $notificationData Bildiriş məlumatları
     * @return bool
     */
    protected function dispatchPushNotification($token, $platform, $notificationData) {
        // Platforma əsasında müvafiq göndərmə servisini çağır
        switch ($platform) {
            case 'web':
                return $this->sendWebPushNotification($token, $notificationData);
            
            case 'android':
            case 'ios':
                return $this->sendFirebasePushNotification($token, $notificationData, $platform);
            
            default:
                return false;
        }
    }
    
    /**
     * Web Push bildirişi göndər
     * 
     * @param string $subscription Web Push subscription
     * @param array $notificationData Bildiriş məlumatları
     * @return bool
     */
    protected function sendWebPushNotification($subscription, $notificationData) {
        // Burada Web Push servisini çağıracaq kod.
        // WebPush kütübxanasından istifadə ediləcək (bu numunə üçün sadəcə placeholder olaraq qalır)
        
        return true;
    }
    
    /**
     * Firebase Push bildirişi göndər (Android və iOS üçün)
     * 
     * @param string $token FCM token
     * @param array $notificationData Bildiriş məlumatları
     * @param string $platform Platforma (android, ios)
     * @return bool
     */
    protected function sendFirebasePushNotification($token, $notificationData, $platform) {
        // Burada Firebase Cloud Messaging servisini çağıracaq kod.
        // Bu numunə üçün sadəcə placeholder olaraq qalır
        
        return true;
    }
    
    /**
     * Şablon mətnini dəyişənlərlə əvəz et
     * 
     * @param string $template Şablon
     * @param array $data Dəyişənlər
     * @return string
     */
    protected function parseTemplate($template, $data) {
        // Şablonda {key} şəklində olan dəyişənləri data massivindəki müvafiq dəyərlərlə əvəz et
        return preg_replace_callback('/\{([a-z_]+)\}/', function($matches) use ($data) {
            $key = $matches[1];
            return isset($data[$key]) ? $data[$key] : $matches[0];
        }, $template);
    }
    
    /**
     * İstifadəçinin oxunmamış bildiriş sayını yenilə
     * 
     * @param int $userId İstifadəçi ID-si
     * @return bool
     */
    protected function updateUnreadCount($userId) {
        try {
            $count = $this->getUnreadCount($userId);
            
            $stmt = $this->pdo->prepare("
                UPDATE users
                SET unread_notifications = ?
                WHERE id = ?
            ");
            
            $stmt->execute([$count, $userId]);
            
            return true;
        } catch (\Exception $e) {
            error_log("Oxunmamış bildiriş sayının yenilənməsi zamanı xəta: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Default bildiriş seçimlərini əldə et
     * 
     * @return array
     */
    protected function getDefaultNotificationPreferences() {
        return [
            // Barter əlaqəli bildirişlər
            'new_offer' => true,
            'offer_accepted' => true,
            'offer_rejected' => true,
            'offer_canceled' => true,
            'offer_expired' => true,
            'barter_completed' => true,
            
            // Mesajlaşma bildirişləri
            'new_message' => true,
            
            // İzləmə bildirişləri
            'new_follower' => true,
            'follow_new_item' => true,
            'follow_profile_update' => true,
            'follow_completed_barter' => true,
            
            // Elan əlaqəli bildirişlər
            'item_favorite' => true,
            'item_view' => true,
            'item_expiring' => true,
            'item_expired' => true,
            
            // Sistem bildirişləri
            'system_maintenance' => true,
            'system_update' => true,
            'account_security' => true,
            
            // Bildiriş kanalları
            'channels' => [
                'web' => true,
                'push' => true,
                'email' => true
            ]
        ];
    }
}
?>