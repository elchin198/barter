/**
 * BarterTap.az - Service Worker
 * Push bildirişlərini və offline istifadəçi təcrübəsini idarə edir
 */

const CACHE_NAME = 'bartertap-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.php',
    '/assets/css/styles.css',
    '/assets/css/responsive.css',
    '/assets/js/main.js',
    '/assets/js/mobile.js',
    '/assets/js/push-notifications.js',
    '/assets/images/logo.png',
    '/assets/images/default-avatar.jpg',
    '/assets/images/placeholder.jpg'
];

// Service Worker quraşdırılarkən əsas fayl və resursları keşə əlavə et
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Service Worker aktivləşərkən köhnə keşləri təmizlə
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// Push bildirişi gəldikdə
self.addEventListener('push', event => {
    console.log('Service Worker: Push Notification received', event);
    
    let notificationData = {};
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData = {
                title: 'BarterTap.az',
                body: event.data.text(),
                icon: '/assets/images/logo.png'
            };
        }
    } else {
        notificationData = {
            title: 'BarterTap.az',
            body: 'Yeni bildiriş var!',
            icon: '/assets/images/logo.png'
        };
    }
    
    const title = notificationData.title || 'BarterTap.az';
    const options = {
        body: notificationData.body || 'Yeni bildiriş var!',
        icon: notificationData.icon || '/assets/images/logo.png',
        badge: '/assets/images/logo.png',
        data: notificationData.data || {},
        vibrate: [100, 50, 100],
        actions: notificationData.actions || []
    };
    
    if (notificationData.tag) {
        options.tag = notificationData.tag;
    }
    
    if (notificationData.url) {
        options.data.url = notificationData.url;
    }
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Push bildirişinə kliklədikdə
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification click received', event);
    
    event.notification.close();
    
    // URL-ə yönləndir (əgər varsa)
    const url = event.notification.data && event.notification.data.url 
        ? event.notification.data.url 
        : '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(windowClients => {
                // Əgər açıq pəncərə varsa, onu aktivləşdir və URL-ə yönləndir
                for (let client of windowClients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Əks halda, yeni pəncərə aç
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Offline rejim üçün şəbəkə tələblərini keşləmə
self.addEventListener('fetch', event => {
    // Yalnız GET tələblərini keşlə
    if (event.request.method !== 'GET') return;
    
    // API tələblərini keşləmə
    if (event.request.url.includes('/api/')) return;
    
    // PHP sessiya cookie-ləri olan tələbləri keşləmə
    if (event.request.url.includes('PHPSESSID=')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Keşdən qaytarma
                if (response) {
                    return response;
                }
                
                // Əks halda şəbəkədən əldə et və keşə əlavə et
                return fetch(event.request)
                    .then(networkResponse => {
                        // Cavabı kopyala (bir dəfə istifadə edilə bilər)
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        const responseToCache = networkResponse.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // Şəbəkə xətası və keşdə də yoxdursa
                        // Offline səhifəyə yönləndirmə edə bilərik
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.php');
                        }
                        
                        // Digər resurslar üçün xəta qaytarın
                        return new Response('Offline mode: Resource not available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});