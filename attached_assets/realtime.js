/**
 * BarterTap.az - Realtime WebSocket və bildiriş funksionallığı
 * 
 * Bu skript real-time bildiriş və mesajlaşma funksionallığını təmin edir.
 * WebSocket vasitəsilə serverə qoşulur və bildirişləri real-time göstərir.
 */

class BarterapRealtime {
    constructor(options = {}) {
        // Konfiqurasiya parametrləri
        this.options = Object.assign({
            websocketUrl: null, // WebSocket server ünvanı (null olarsa avtomatik qurulur)
            autoReconnect: true, // Əlaqə kəsildikdə avtomatik yenidən qoşulmaq
            reconnectInterval: 5000, // Yenidən qoşulma cəhdləri arasındakı interval (ms)
            reconnectAttempts: 5, // Maksimum yenidən qoşulma cəhdi sayı
            debug: false, // Debug rejimi
            pingInterval: 30000, // Ping/pong interval (ms)
            onNotification: null, // Bildiriş gəldikdə çağırılacaq callback funksiya
            onMessage: null, // Mesaj gəldikdə çağırılacaq callback funksiya
            onTyping: null, // Yazır bildirişi gəldikdə çağırılacaq callback funksiya
            onUserStatus: null, // İstifadəçi statusu dəyişdikdə çağırılacaq callback funksiya
            onConnect: null, // WebSocket qoşulduqda çağırılacaq callback funksiya
            onDisconnect: null, // WebSocket əlaqəsi kəsildikdə çağırılacaq callback funksiya
            token: null, // Auth token
            userId: null // Cari istifadəçi ID-si
        }, options);
        
        // WebSocket URL-ni təyin et
        if (!this.options.websocketUrl) {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = window.location.host;
            this.options.websocketUrl = `${protocol}//${host}/ws`;
        }
        
        this.connected = false; // WebSocket əlaqəsi qurulub?
        this.reconnectAttempt = 0; // Cari yenidən qoşulma cəhdi sayı
        this.socket = null; // WebSocket əlaqəsi
        this.pingTimer = null; // Ping timer
        this.authenticated = false; // İstifadəçi autentifikasiya olunub?
        
        // Event callback-lərini saxlayan obyekt
        this.callbacks = {
            notification: [],
            message: [],
            typing: [],
            userStatus: [],
            connect: [],
            disconnect: []
        };
        
        // Başlanğıc callback-ləri əlavə et
        if (this.options.onNotification) this.on('notification', this.options.onNotification);
        if (this.options.onMessage) this.on('message', this.options.onMessage);
        if (this.options.onTyping) this.on('typing', this.options.onTyping);
        if (this.options.onUserStatus) this.on('userStatus', this.options.onUserStatus);
        if (this.options.onConnect) this.on('connect', this.options.onConnect);
        if (this.options.onDisconnect) this.on('disconnect', this.options.onDisconnect);
        
        // WebSocket əlaqəsini başlat
        if (this.options.token && this.options.userId) {
            this.connect();
        }
    }
    
    /**
     * WebSocket serverinə qoşul
     */
    connect() {
        if (this.socket) {
            this.socket.close();
        }
        
        try {
            this.socket = new WebSocket(this.options.websocketUrl);
            
            // WebSocket əlaqəsi açıldıqda
            this.socket.onopen = () => {
                this.log('WebSocket əlaqəsi quruldu');
                this.connected = true;
                this.reconnectAttempt = 0;
                
                // Ping/pong başlat
                this.startPingTimer();
                
                // Autentifikasiya et
                if (this.options.token && this.options.userId) {
                    this.authenticate(this.options.token, this.options.userId);
                }
                
                // Connect event-lərini çağır
                this._triggerCallbacks('connect');
            };
            
            // WebSocket əlaqəsi bağlandıqda
            this.socket.onclose = (event) => {
                this.log(`WebSocket əlaqəsi bağlandı: ${event.code} ${event.reason}`);
                this.connected = false;
                this.authenticated = false;
                this.stopPingTimer();
                
                // Disconnect event-lərini çağır
                this._triggerCallbacks('disconnect');
                
                // Yenidən qoşulma
                if (this.options.autoReconnect && this.reconnectAttempt < this.options.reconnectAttempts) {
                    this.reconnectAttempt++;
                    this.log(`Yenidən qoşulma cəhdi: ${this.reconnectAttempt}/${this.options.reconnectAttempts}`);
                    
                    setTimeout(() => {
                        this.connect();
                    }, this.options.reconnectInterval);
                }
            };
            
            // WebSocket mesajı alındıqda
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    this.log(`Mesaj emal edilə bilmədi: ${e.message}`, 'error');
                }
            };
            
            // WebSocket xətası baş verdikdə
            this.socket.onerror = (error) => {
                this.log(`WebSocket xətası: ${error.message}`, 'error');
            };
        } catch (e) {
            this.log(`WebSocket əlaqəsi qurula bilmədi: ${e.message}`, 'error');
        }
    }
    
    /**
     * WebSocket əlaqəsini bağla
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.connected = false;
        this.authenticated = false;
        this.stopPingTimer();
        this._triggerCallbacks('disconnect');
    }
    
    /**
     * İstifadəçi autentifikasiyası
     * 
     * @param {string} token Auth token
     * @param {number} userId İstifadəçi ID-si
     */
    authenticate(token, userId) {
        if (!this.connected) {
            this.options.token = token;
            this.options.userId = userId;
            this.connect();
            return;
        }
        
        this.send({
            action: 'auth',
            token: token,
            user_id: userId
        });
    }
    
    /**
     * Mesaj göndər
     * 
     * @param {object} data Göndəriləcək məlumat
     */
    send(data) {
        if (!this.connected) {
            this.log('WebSocket əlaqəsi qurulmayıb, mesaj göndərilə bilməz', 'warn');
            return false;
        }
        
        try {
            this.socket.send(JSON.stringify(data));
            return true;
        } catch (e) {
            this.log(`Mesaj göndərilə bilmədi: ${e.message}`, 'error');
            return false;
        }
    }
    
    /**
     * "Yazır" bildirişi göndər
     * 
     * @param {number} conversationId Söhbət ID-si
     * @param {number} recipientId Qəbul edən istifadəçi ID-si
     * @param {boolean} isTyping Yazır?
     */
    sendTypingIndicator(conversationId, recipientId, isTyping = true) {
        return this.send({
            action: 'typing',
            conversation_id: conversationId,
            recipient_id: recipientId,
            is_typing: isTyping
        });
    }
    
    /**
     * Mesajların oxunması bildirişi göndər
     * 
     * @param {array} messageIds Mesaj ID-ləri
     * @param {number} conversationId Söhbət ID-si
     * @param {number} senderId Göndərən istifadəçi ID-si
     */
    sendReadReceipt(messageIds, conversationId, senderId) {
        return this.send({
            action: 'read_message',
            message_ids: messageIds,
            conversation_id: conversationId,
            sender_id: senderId
        });
    }
    
    /**
     * İstifadəçi aktivliyi bildirişi göndər
     * 
     * @param {string} type Aktivlik növü
     * @param {object} data Əlavə məlumat
     */
    sendActivity(type, data = {}) {
        return this.send({
            action: 'activity',
            type: type,
            data: data
        });
    }
    
    /**
     * Ping göndər
     */
    sendPing() {
        return this.send({
            action: 'ping',
            time: Date.now()
        });
    }
    
    /**
     * Ping timer başlat
     */
    startPingTimer() {
        this.stopPingTimer();
        
        this.pingTimer = setInterval(() => {
            if (this.connected) {
                this.sendPing();
            }
        }, this.options.pingInterval);
    }
    
    /**
     * Ping timer dayandır
     */
    stopPingTimer() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    
    /**
     * WebSocket mesajını emal et
     * 
     * @param {object} data Alınmış məlumat
     */
    handleMessage(data) {
        if (!data || !data.action) {
            this.log('Yanlış formatda mesaj alındı', 'warn');
            return;
        }
        
        this.log(`Mesaj alındı: ${data.action}`);
        
        switch (data.action) {
            // Autentifikasiya cavabı
            case 'auth':
                if (data.status === 'success') {
                    this.authenticated = true;
                    this.log('Autentifikasiya uğurlu oldu');
                } else {
                    this.authenticated = false;
                    this.log(`Autentifikasiya xətası: ${data.message}`, 'error');
                }
                break;
            
            // Ping/pong
            case 'pong':
                this.log('Pong alındı, gecikmə: ' + (Date.now() - data.time) + 'ms', 'debug');
                break;
            
            // Yeni bildiriş
            case 'new_notification':
                this._triggerCallbacks('notification', data.notification);
                this.updateNotificationCount();
                this.showDesktopNotification(data.notification);
                break;
            
            // Bildirişlər siyahısı
            case 'notifications':
                if (data.status === 'success' && data.notifications) {
                    data.notifications.forEach(notification => {
                        this._triggerCallbacks('notification', notification);
                    });
                    this.updateNotificationCount(data.unread_count);
                }
                break;
            
            // Yazır bildirişi
            case 'typing':
                this._triggerCallbacks('typing', {
                    conversationId: data.conversation_id,
                    userId: data.user_id,
                    username: data.username,
                    isTyping: data.is_typing
                });
                break;
            
            // İstifadəçi statusu
            case 'user_status':
                this._triggerCallbacks('userStatus', {
                    userId: data.user_id,
                    username: data.username,
                    fullName: data.full_name,
                    avatar: data.avatar,
                    profileStatus: data.profile_status,
                    status: data.status,
                    lastActivity: data.last_activity
                });
                break;
            
            // Mesaj oxundu bildirişi
            case 'message_read':
                if (data.status === 'success') {
                    this._triggerCallbacks('messageRead', {
                        conversationId: data.conversation_id,
                        messageIds: data.message_ids,
                        readerId: data.reader_id,
                        readerUsername: data.reader_username
                    });
                }
                break;
            
            // Yeni mesaj
            case 'new_message':
                this._triggerCallbacks('message', data.message);
                break;
            
            // Xəta
            case 'error':
                this.log(`Server xətası: ${data.message}`, 'error');
                break;
            
            // Bilinməyən əməliyyat
            default:
                this.log(`Bilinməyən əməliyyat: ${data.action}`, 'warn');
        }
    }
    
    /**
     * Bildiriş sayğacını yenilə
     * 
     * @param {number} count Oxunmamış bildiriş sayı (null olarsa serverə sorğu göndərilir)
     */
    updateNotificationCount(count = null) {
        // Bildiriş sayğacını göstərən elementlər
        const notificationCounters = document.querySelectorAll('.notification-counter');
        
        if (count !== null) {
            // Sayğacı yenilə
            notificationCounters.forEach(counter => {
                if (count > 0) {
                    counter.textContent = count;
                    counter.classList.remove('hidden');
                } else {
                    counter.textContent = '';
                    counter.classList.add('hidden');
                }
            });
        } else {
            // Server tərəfdən oxunmamış bildiriş sayını əldə et
            fetch('/api/notifications/count')
                .then(response => response.json())
                .then(data => {
                    const unreadCount = data.count || 0;
                    
                    notificationCounters.forEach(counter => {
                        if (unreadCount > 0) {
                            counter.textContent = unreadCount;
                            counter.classList.remove('hidden');
                        } else {
                            counter.textContent = '';
                            counter.classList.add('hidden');
                        }
                    });
                })
                .catch(error => {
                    this.log(`Bildiriş sayı əldə edilə bilmədi: ${error.message}`, 'error');
                });
        }
    }
    
    /**
     * Bildirişi desktop notification olaraq göstər
     * 
     * @param {object} notification Bildiriş məlumatları
     */
    showDesktopNotification(notification) {
        // Bildiriş icazəsini yoxla
        if (!('Notification' in window)) {
            this.log('Bu brauzer desktop bildirişləri dəstəkləmir', 'warn');
            return;
        }
        
        if (Notification.permission === 'granted') {
            this.createNotification(notification);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.createNotification(notification);
                }
            });
        }
    }
    
    /**
     * Desktop notification yarat
     * 
     * @param {object} notification Bildiriş məlumatları
     */
    createNotification(notification) {
        const title = notification.title || 'BarterTap.az';
        const body = notification.body || '';
        let icon = '/assets/images/favicon.png'; // Default ikon
        let clickUrl = '/notifications';
        
        // Notification növü əsasında fərqli ikonlar və yönləndirmə URL-ləri təyin et
        if (notification.data) {
            switch (notification.type) {
                case 'new_message':
                    icon = '/assets/images/notification-message.png';
                    clickUrl = `/messages?conversation=${notification.data.conversation_id}`;
                    break;
                    
                case 'new_offer':
                    icon = '/assets/images/notification-offer.png';
                    clickUrl = `/offer?id=${notification.data.offer_id}`;
                    break;
                    
                case 'new_follower':
                    icon = notification.data.follower_avatar || '/assets/images/notification-user.png';
                    clickUrl = `/profile?id=${notification.data.follower_id}`;
                    break;
                    
                // Digər bildiriş növləri
                // ...
            }
        }
        
        // Desktop notification yarat
        const notif = new Notification(title, {
            body: body,
            icon: icon,
            tag: `bartertap-${notification.id}`,
            requireInteraction: false,
            silent: false
        });
        
        // Bildirişə klik edildikdə
        notif.onclick = function() {
            window.focus();
            window.location.href = clickUrl;
            this.close();
        };
        
        // Bildiriş avtomatik bağlandıqda
        notif.onclose = function() {
            // bir şey etmə
        };
    }
    
    /**
     * Event-i dinlə
     * 
     * @param {string} event Event adı
     * @param {function} callback Callback funksiya
     */
    on(event, callback) {
        if (typeof callback !== 'function') {
            return;
        }
        
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        
        this.callbacks[event].push(callback);
    }
    
    /**
     * Event dinləməni dayandır
     * 
     * @param {string} event Event adı
     * @param {function} callback Callback funksiya (null olarsa, bütün callback-lər silinir)
     */
    off(event, callback = null) {
        if (!this.callbacks[event]) {
            return;
        }
        
        if (callback === null) {
            this.callbacks[event] = [];
        } else {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Event üçün callback funksiyaları çağır
     * 
     * @param {string} event Event adı
     * @param {any} data Event məlumatları
     * @private
     */
    _triggerCallbacks(event, data = null) {
        if (!this.callbacks[event]) {
            return;
        }
        
        this.callbacks[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                this.log(`Callback xətası (${event}): ${e.message}`, 'error');
            }
        });
    }
    
    /**
     * Log mesajı yaz
     * 
     * @param {string} message Mesaj
     * @param {string} level Log səviyyəsi (log, warn, error, debug)
     * @private
     */
    log(message, level = 'log') {
        if (!this.options.debug && level === 'debug') {
            return;
        }
        
        const prefix = '[BarterTap Realtime]';
        
        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
                
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
                
            case 'debug':
                console.debug(`${prefix} ${message}`);
                break;
                
            default:
                console.log(`${prefix} ${message}`);
        }
    }
}

// Global instance
let bartertapRealtime = null;

// İstifadəçi məlumatları varsa, realtime əlaqəsini başlat
document.addEventListener('DOMContentLoaded', function() {
    // Əgər bartertapUser global dəyişəni varsa və istifadəçi giriş edibsə
    if (typeof bartertapUser !== 'undefined' && bartertapUser && bartertapUser.id) {
        initializeRealtime(bartertapUser.id, bartertapUser.sessionToken);
    }
    
    // Bildiriş icazələrini yoxla və istə
    checkNotificationPermission();
});

/**
 * Realtime əlaqəsini başlat
 * 
 * @param {number} userId İstifadəçi ID-si
 * @param {string} token Auth token
 */
function initializeRealtime(userId, token) {
    // WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const websocketUrl = `${protocol}//${host}/ws`;
    
    // Realtime əlaqəsini yarat
    bartertapRealtime = new BarterapRealtime({
        websocketUrl: websocketUrl,
        autoReconnect: true,
        debug: false,
        token: token,
        userId: userId,
        
        // Bildiriş gəldikdə
        onNotification: function(notification) {
            console.log('Yeni bildiriş:', notification);
            
            // Bildiriş mərkəzini yenilə (əgər açıqdırsa)
            updateNotificationCenter();
            
            // In-app bildiriş göstər
            showInAppNotification(notification);
        },
        
        // Mesaj gəldikdə
        onMessage: function(message) {
            console.log('Yeni mesaj:', message);
            
            // Mesaj mərkəzini yenilə (əgər açıqdırsa)
            updateMessageCenter();
            
            // Əgər cari söhbətdə isə, mesajı əlavə et
            if (typeof currentConversationId !== 'undefined' && currentConversationId == message.conversation_id) {
                appendNewMessage(message);
            } else {
                // In-app bildiriş göstər
                showInAppNotification({
                    title: 'Yeni mesaj',
                    body: `${message.sender_username}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                    type: 'new_message',
                    data: {
                        conversation_id: message.conversation_id,
                        sender_id: message.sender_id
                    }
                });
            }
        },
        
        // Yazmağa başladı bildirişi gəldikdə
        onTyping: function(data) {
            // Əgər cari söhbətdə isə, yazır indikatorunu göstər
            if (typeof currentConversationId !== 'undefined' && currentConversationId == data.conversationId) {
                showTypingIndicator(data.userId, data.username, data.isTyping);
            }
        },
        
        // İstifadəçi statusu dəyişdikdə
        onUserStatus: function(data) {
            // İstifadəçi statusunu yenilə
            updateUserStatus(data.userId, data.status);
        },
        
        // WebSocket qoşulduqda
        onConnect: function() {
            console.log('Realtime əlaqəsi quruldu');
        },
        
        // WebSocket əlaqəsi kəsildikdə
        onDisconnect: function() {
            console.log('Realtime əlaqəsi kəsildi');
        }
    });
}

/**
 * Bildiriş icazələrini yoxla və istə
 */
function checkNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Bu brauzer desktop bildirişləri dəstəkləmir');
        return;
    }
    
    // Əgər istifadəçi icazə verməyibsə, icazə istə
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Bildiriş icazə düyməsi
        const notificationPermissionButton = document.getElementById('notification-permission-button');
        
        if (notificationPermissionButton) {
            // Düyməni göstər
            notificationPermissionButton.classList.remove('hidden');
            
            // Düyməyə klik edildikdə icazə istə
            notificationPermissionButton.addEventListener('click', function() {
                requestNotificationPermission();
            });
        } else {
            // Düymə yoxdursa, avtomatik icazə istə
            setTimeout(() => {
                requestNotificationPermission();
            }, 5000);
        }
    }
}

/**
 * Bildiriş icazəsi istə
 */
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Bildiriş icazəsi verildi');
            
            // Bildiriş icazə düyməsini gizlət
            const notificationPermissionButton = document.getElementById('notification-permission-button');
            if (notificationPermissionButton) {
                notificationPermissionButton.classList.add('hidden');
            }
            
            // Push token-i qeyd et
            registerPushToken();
        } else {
            console.warn('Bildiriş icazəsi rədd edildi');
        }
    });
}

/**
 * Push token-i serverə qeyd et
 */
function registerPushToken() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Bu brauzer push bildirişləri dəstəkləmir');
        return;
    }
    
    // Service Worker qeyd et
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            // Push abunəliyini əldə et
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        })
        .then(subscription => {
            // Abunəliyi serverə göndər
            return fetch('/api/notifications/register-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: JSON.stringify(subscription),
                    platform: 'web'
                }),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Push token qeyd edilə bilmədi');
            }
            
            console.log('Push token uğurla qeyd edildi');
        })
        .catch(error => {
            console.error('Push abunəliyi zamanı xəta:', error);
        });
}

/**
 * Base64 URL-i Uint8Array-ə çevir
 * 
 * @param {string} base64String Base64 URL
 * @return {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

/**
 * Bildiriş mərkəzini yenilə
 */
function updateNotificationCenter() {
    const notificationCenter = document.getElementById('notification-center');
    
    if (!notificationCenter || notificationCenter.classList.contains('hidden')) {
        return;
    }
    
    // Bildirişləri serverden əldə et
    fetch('/api/notifications')
        .then(response => response.json())
        .then(data => {
            if (!data.notifications || !Array.isArray(data.notifications)) {
                return;
            }
            
            const notificationList = notificationCenter.querySelector('.notification-list');
            
            if (!notificationList) {
                return;
            }
            
            // Bildirişləri göstər
            notificationList.innerHTML = '';
            
            if (data.notifications.length === 0) {
                notificationList.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-gray-400 mb-2">
                            <i class="fas fa-bell-slash text-3xl"></i>
                        </div>
                        <p class="text-gray-500">Bildirişiniz yoxdur</p>
                    </div>
                `;
                return;
            }
            
            data.notifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = `notification-item p-3 ${notification.is_read ? '' : 'bg-blue-50'} hover:bg-gray-100 border-b border-gray-200`;
                notificationItem.dataset.id = notification.id;
                
                // İkon təyin et
                let icon = '';
                switch (notification.type) {
                    case 'new_message':
                        icon = '<i class="fas fa-comment text-primary"></i>';
                        break;
                    case 'new_offer':
                        icon = '<i class="fas fa-exchange-alt text-green-500"></i>';
                        break;
                    case 'new_follower':
                        icon = '<i class="fas fa-user-plus text-purple-500"></i>';
                        break;
                    case 'system_update':
                    case 'system_maintenance':
                        icon = '<i class="fas fa-cog text-gray-500"></i>';
                        break;
                    default:
                        icon = '<i class="fas fa-bell text-blue-500"></i>';
                }
                
                // Bildiriş və keçid URL-i təyin et
                let clickUrl = '/notifications';
                
                if (notification.data) {
                    switch (notification.type) {
                        case 'new_message':
                            clickUrl = `/messages?conversation=${notification.data.conversation_id}`;
                            break;
                        case 'new_offer':
                            clickUrl = `/offer?id=${notification.data.offer_id}`;
                            break;
                        case 'new_follower':
                            clickUrl = `/profile?id=${notification.data.follower_id}`;
                            break;
                        // Digər keçidlər
                    }
                }
                
                notificationItem.innerHTML = `
                    <div class="flex">
                        <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                            ${icon}
                        </div>
                        <div class="ml-3 flex-1">
                            <div class="flex justify-between items-start">
                                <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                                <span class="text-xs text-gray-500">${timeAgo(notification.created_at)}</span>
                            </div>
                            <p class="text-sm text-gray-600">${notification.body}</p>
                            <div class="mt-1 flex space-x-3">
                                <a href="${clickUrl}" class="text-xs text-primary hover:underline">Keçid</a>
                                <button type="button" class="text-xs text-gray-500 hover:text-gray-700 mark-as-read" data-id="${notification.id}">
                                    ${notification.is_read ? 'Oxunub' : 'Oxundu kimi işarələ'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                notificationList.appendChild(notificationItem);
            });
            
            // Oxundu kimi işarələmə düymələri
            notificationList.querySelectorAll('.mark-as-read').forEach(button => {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    const notificationId = this.dataset.id;
                    
                    fetch(`/api/notifications/${notificationId}/read`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Bildirişi oxunmuş kimi işarələ
                            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                            if (notificationItem) {
                                notificationItem.classList.remove('bg-blue-50');
                                this.textContent = 'Oxunub';
                            }
                            
                            // Bildiriş sayğacını yenilə
                            if (bartertapRealtime) {
                                bartertapRealtime.updateNotificationCount();
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Bildiriş oxunma xətası:', error);
                    });
                });
            });
        })
        .catch(error => {
            console.error('Bildirişlər əldə edilə bilmədi:', error);
        });
}

/**
 * In-app bildiriş göstər
 * 
 * @param {object} notification Bildiriş məlumatları
 */
function showInAppNotification(notification) {
    // Bildiriş containeri əldə et və ya yarat
    let notificationContainer = document.getElementById('in-app-notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'in-app-notification-container';
        notificationContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2 max-w-xs w-full';
        document.body.appendChild(notificationContainer);
    }
    
    // Bildiriş elementi yarat
    const notificationElement = document.createElement('div');
    notificationElement.className = 'bg-white rounded-lg shadow-lg border border-gray-200 p-3 transform transition-transform duration-300 translate-x-full';
    
    // İkon təyin et
    let icon = '<i class="fas fa-bell text-blue-500"></i>';
    switch (notification.type) {
        case 'new_message':
            icon = '<i class="fas fa-comment text-primary"></i>';
            break;
        case 'new_offer':
            icon = '<i class="fas fa-exchange-alt text-green-500"></i>';
            break;
        case 'new_follower':
            icon = '<i class="fas fa-user-plus text-purple-500"></i>';
            break;
        case 'system_update':
        case 'system_maintenance':
            icon = '<i class="fas fa-cog text-gray-500"></i>';
            break;
    }
    
    // Bildiriş və keçid URL-i təyin et
    let clickUrl = '/notifications';
    
    if (notification.data) {
        switch (notification.type) {
            case 'new_message':
                clickUrl = `/messages?conversation=${notification.data.conversation_id}`;
                break;
            case 'new_offer':
                clickUrl = `/offer?id=${notification.data.offer_id}`;
                break;
            case 'new_follower':
                clickUrl = `/profile?id=${notification.data.follower_id}`;
                break;
            // Digər keçidlər
        }
    }
    
    // Bildiriş məzmunu
    notificationElement.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                ${icon}
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                <p class="text-xs text-gray-600">${notification.body}</p>
            </div>
            <button type="button" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500 close-notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Bildirişə klik edildikdə
    notificationElement.addEventListener('click', function(event) {
        if (!event.target.closest('.close-notification')) {
            window.location.href = clickUrl;
        }
    });
    
    // Bağla düyməsi
    const closeButton = notificationElement.querySelector('.close-notification');
    closeButton.addEventListener('click', function(event) {
        event.stopPropagation();
        hideNotification(notificationElement);
    });
    
    // Bildirişi konteynerə əlavə et
    notificationContainer.appendChild(notificationElement);
    
    // Bildirişi göstər
    setTimeout(() => {
        notificationElement.classList.remove('translate-x-full');
    }, 10);
    
    // Bildirişi 5 saniyə sonra gizlət
    setTimeout(() => {
        hideNotification(notificationElement);
    }, 5000);
}

/**
 * In-app bildirişi gizlət
 * 
 * @param {HTMLElement} notificationElement Bildiriş elementi
 */
function hideNotification(notificationElement) {
    notificationElement.classList.add('translate-x-full');
    
    setTimeout(() => {
        if (notificationElement.parentNode) {
            notificationElement.parentNode.removeChild(notificationElement);
        }
    }, 300);
}

/**
 * İstifadəçi statusunu yenilə
 * 
 * @param {number} userId İstifadəçi ID-si
 * @param {string} status Status (online, offline)
 */
function updateUserStatus(userId, status) {
    // İstifadəçi status indikatorları
    const userStatusIndicators = document.querySelectorAll(`.user-status-indicator[data-user-id="${userId}"]`);
    
    userStatusIndicators.forEach(indicator => {
        if (status === 'online') {
            indicator.classList.remove('bg-gray-300');
            indicator.classList.add('bg-green-500');
            
            if (indicator.dataset.showLabel) {
                indicator.querySelector('.status-label').textContent = 'Online';
            }
        } else {
            indicator.classList.remove('bg-green-500');
            indicator.classList.add('bg-gray-300');
            
            if (indicator.dataset.showLabel) {
                indicator.querySelector('.status-label').textContent = 'Offline';
            }
        }
    });
}

/**
 * Vaxt mətnini əldə et
 * 
 * @param {string} timestamp Timestamp
 * @return {string}
 */
function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return 'İndicə';
    } else if (minutes < 60) {
        return `${minutes} dəqiqə əvvəl`;
    } else if (hours < 24) {
        return `${hours} saat əvvəl`;
    } else if (days < 7) {
        return `${days} gün əvvəl`;
    } else {
        return date.toLocaleDateString('az-AZ', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Bildiriş mərkəzini aç/bağla
document.addEventListener('DOMContentLoaded', function() {
    const notificationButton = document.getElementById('notification-button');
    const notificationCenter = document.getElementById('notification-center');
    
    if (notificationButton && notificationCenter) {
        notificationButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const isVisible = !notificationCenter.classList.contains('hidden');
            
            // Əgər açıqdırsa, bağla
            if (isVisible) {
                notificationCenter.classList.add('hidden');
                return;
            }
            
            // Açılmamışdırsa, aç və bildirişləri yüklə
            notificationCenter.classList.remove('hidden');
            updateNotificationCenter();
            
            // Bütün bildirişləri oxunmuş kimi işarələ
            fetch('/api/notifications/mark-all-as-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Bildiriş sayğacını yenilə
                    if (bartertapRealtime) {
                        bartertapRealtime.updateNotificationCount(0);
                    }
                }
            })
            .catch(error => {
                console.error('Bildirişlər oxunmuş kimi işarələnə bilmədi:', error);
            });
        });
        
        // Bildiriş mərkəzi xaricində klik edildikdə bağla
        document.addEventListener('click', function(event) {
            if (notificationCenter && !notificationCenter.classList.contains('hidden') && !notificationCenter.contains(event.target) && !notificationButton.contains(event.target)) {
                notificationCenter.classList.add('hidden');
            }
        });
        
        // "Hamısını oxunmuş kimi işarələ" düyməsi
        const markAllAsReadButton = document.getElementById('mark-all-notifications-read');
        
        if (markAllAsReadButton) {
            markAllAsReadButton.addEventListener('click', function(event) {
                event.preventDefault();
                
                fetch('/api/notifications/mark-all-as-read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Bildiriş sayğacını yenilə
                        if (bartertapRealtime) {
                            bartertapRealtime.updateNotificationCount(0);
                        }
                        
                        // Bildiriş mərkəzini yenilə
                        updateNotificationCenter();
                    }
                })
                .catch(error => {
                    console.error('Bildirişlər oxunmuş kimi işarələnə bilmədi:', error);
                });
            });
        }
    }
});