/**
 * BarterTap.az - Push bildirişləri
 * Bu JavaScript faylı, push bildirişləri üçün Service Worker və Push API xidmətlərini təmin edir
 */

const PushNotifications = (function() {
    const applicationServerKey = 'BEFmADk9fkPdWWYt-D-0y2bJT0CzTPu0KLPnYQEbRwMM-V2sz7U1v5h7vGXkuqcnqKYhPj1XDdIE9qGH0VwHIiw'; // VAPID public key
    let swRegistration = null;
    
    /**
     * Push bildirişlərinin dəstəkləndiyini yoxla
     */
    function isPushSupported() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            return true;
        }
        return false;
    }
    
    /**
     * Service Worker-i qeydiyyatdan keçir
     */
    async function registerServiceWorker() {
        try {
            swRegistration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker qeydiyyatdan keçdi:', swRegistration);
            return swRegistration;
        } catch (error) {
            console.error('Service Worker qeydiyyat xətası:', error);
            throw error;
        }
    }
    
    /**
     * Push bildirişlərinə icazə istə və abunə ol
     */
    async function subscribeToPush() {
        try {
            if (!isPushSupported()) {
                throw new Error('Push bildirişləri bu brauzerdə dəstəklənmir.');
            }
            
            if (!swRegistration) {
                swRegistration = await registerServiceWorker();
            }
            
            // Cari abunəliyi yoxla
            const subscription = await swRegistration.pushManager.getSubscription();
            
            // Əvvəlki abunəliyi ləğv et
            if (subscription) {
                await subscription.unsubscribe();
            }
            
            // Yeni abunəlik yarat
            const newSubscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
            });
            
            console.log('Push abunəliyi yaradıldı:', newSubscription);
            
            // Abunəlik məlumatlarını serverə göndər
            await saveSubscription(newSubscription);
            
            return newSubscription;
        } catch (error) {
            console.error('Push abunəliyi xətası:', error);
            throw error;
        }
    }
    
    /**
     * Push bildirişlərindən imtina et
     */
    async function unsubscribeFromPush() {
        try {
            if (!swRegistration) {
                swRegistration = await navigator.serviceWorker.getRegistration();
            }
            
            if (!swRegistration) {
                throw new Error('Service Worker qeydiyyatı tapılmadı.');
            }
            
            const subscription = await swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                throw new Error('Push abunəliyi tapılmadı.');
            }
            
            // Serverdə abunəliyi ləğv et
            await deleteSubscription();
            
            // Brauzerdə abunəliyi ləğv et
            await subscription.unsubscribe();
            
            console.log('Push abunəliyi ləğv edildi');
            return true;
        } catch (error) {
            console.error('Push abunəliyi ləğv edilə bilmədi:', error);
            throw error;
        }
    }
    
    /**
     * Abunəlik statusunu yoxla
     */
    async function getSubscriptionStatus() {
        try {
            if (!isPushSupported()) {
                return { status: 'unsupported' };
            }
            
            if (!swRegistration) {
                swRegistration = await navigator.serviceWorker.getRegistration();
                
                if (!swRegistration) {
                    return { status: 'unregistered' };
                }
            }
            
            const subscription = await swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                return { status: 'unsubscribed' };
            }
            
            return {
                status: 'subscribed',
                subscription: subscription
            };
        } catch (error) {
            console.error('Abunəlik statusunu əldə etmək xətası:', error);
            return { status: 'error', error: error.message };
        }
    }
    
    /**
     * Abunəlik məlumatlarını serverə göndər
     */
    async function saveSubscription(subscription) {
        try {
            const response = await fetch('/api/notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'subscribe_push',
                    subscription: subscription
                })
            });
            
            if (!response.ok) {
                throw new Error('Şəbəkə cavabı uğursuz oldu');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Abunəlik məlumatları saxlanıla bilmədi');
            }
            
            return data;
        } catch (error) {
            console.error('Abunəlik məlumatları saxlanıla bilmədi:', error);
            throw error;
        }
    }
    
    /**
     * Abunəliyi serverdən sil
     */
    async function deleteSubscription() {
        try {
            const response = await fetch('/api/notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'unsubscribe_push'
                })
            });
            
            if (!response.ok) {
                throw new Error('Şəbəkə cavabı uğursuz oldu');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Abunəlik silinə bilmədi');
            }
            
            return data;
        } catch (error) {
            console.error('Abunəlik silinə bilmədi:', error);
            throw error;
        }
    }
    
    /**
     * Base64 URL-i Uint8Array-ə çevir (VAPID key üçün)
     */
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
            
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    // Push bildirişlərini açmaq/bağlamaq üçün UI elementlərini qur
    function setupPushToggle() {
        const pushToggle = document.getElementById('push-toggle');
        
        if (!pushToggle) return;
        
        // Başlanğıcda push statusunu yoxla və düyməni tənzimlə
        getSubscriptionStatus().then(status => {
            pushToggle.checked = (status.status === 'subscribed');
            pushToggle.disabled = (status.status === 'unsupported');
            
            if (status.status === 'unsupported') {
                const label = document.querySelector('label[for="push-toggle"]');
                if (label) {
                    label.title = 'Bu brauzer push bildirişlərini dəstəkləmir';
                }
            }
        });
        
        // Toggle hadisəsini dinləyiciyə əlavə et
        pushToggle.addEventListener('change', async function() {
            try {
                if (this.checked) {
                    // Push bildirişlərini aktivləşdir
                    await subscribeToPush();
                    
                    // Uğurlu mesaj
                    showNotification('Push bildirişləri aktivləşdirildi! İndi yeni mesajlar və barterlər haqqında bildirişlər alacaqsınız.', 'success');
                } else {
                    // Push bildirişlərindən imtina et
                    await unsubscribeFromPush();
                    
                    // Uğurlu mesaj
                    showNotification('Push bildirişləri deaktiv edildi.', 'info');
                }
            } catch (error) {
                // Xəta mesajı
                showNotification('Push bildiriş xətası: ' + error.message, 'error');
                
                // Düyməni əksinə çevir
                this.checked = !this.checked;
            }
        });
    }
    
    // Bildiriş göstər
    function showNotification(message, type = 'info') {
        // Əgər bu funksiya qlobal kontekstdə mövcuddursa istifadə et
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(message); // fallback
        }
    }
    
    // API
    return {
        isPushSupported,
        subscribeToPush,
        unsubscribeFromPush,
        getSubscriptionStatus,
        setupPushToggle,
        registerServiceWorker
    };
})();

// Səhifə yükləndikdə
document.addEventListener('DOMContentLoaded', function() {
    // Push bildirişləri interfeysi qur (əgər mövcuddursa)
    PushNotifications.setupPushToggle();
    
    // Əgər push dəstəklənərsə Service Worker qeydiyyat
    if (PushNotifications.isPushSupported()) {
        PushNotifications.registerServiceWorker();
    }
});