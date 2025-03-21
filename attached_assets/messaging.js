/**
 * BarterTap.az - Real-time mesajlaşma sistemi
 * Bu JavaScript faylı mesajlaşma səhifəsində istifadə edilir
 */

// Mesajlaşma funksiyaları
const Messaging = (function() {
    let socket = null;
    let currentConversationId = null;
    let lastMessageId = 0;
    let isPolling = false;
    let pollingInterval = null;
    let userId = null;
    
    // WebSocket bağlantısını qur
    function initializeWebSocket() {
        // WebSocket dəstəklənir?
        if ('WebSocket' in window) {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                
                socket = new WebSocket(wsUrl);
                
                socket.onopen = function() {
                    console.log('WebSocket bağlantısı uğurla quruldu');
                    // Giriş məlumatları göndər
                    if (userId) {
                        socket.send(JSON.stringify({
                            type: 'auth',
                            userId: userId
                        }));
                    }
                };
                
                socket.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    handleSocketMessage(data);
                };
                
                socket.onerror = function(error) {
                    console.error('WebSocket xətası:', error);
                    fallbackToPolling();
                };
                
                socket.onclose = function() {
                    console.log('WebSocket bağlantısı bağlandı, polling-ə keçid edilir');
                    fallbackToPolling();
                };
                
                return true;
            } catch (error) {
                console.error('WebSocket qoşulma xətası:', error);
                fallbackToPolling();
                return false;
            }
        } else {
            console.log('Bu brauzer WebSocket-i dəstəkləmir, polling-ə keçid edilir');
            fallbackToPolling();
            return false;
        }
    }
    
    // Polling (WebSocket əvəzinə)
    function fallbackToPolling() {
        if (!isPolling) {
            isPolling = true;
            
            // Əgər artıq bir interval varsa, təmizlə
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
            
            // 3 saniyədə bir yeni mesajları yoxla
            pollingInterval = setInterval(function() {
                if (currentConversationId) {
                    fetchNewMessages();
                }
            }, 3000);
        }
    }
    
    // Socket üzərindən gələn mesajları emal et
    function handleSocketMessage(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'new_message':
                // Əgər bu söhbətə aiddirsə, mesajı əlavə et
                if (data.conversationId === currentConversationId) {
                    appendNewMessage(data.message);
                    
                    // Əgər mesaj başqa istifadəçidən gəlibsə, oxundu olaraq qeyd et
                    if (data.message.sender_id !== userId) {
                        markMessagesAsRead(currentConversationId);
                    }
                }
                
                // Söhbət siyahısını yenilə (yeni mesaj indikatoru və s.)
                updateConversationsList();
                break;
                
            case 'message_status':
                // Mesaj statusunu yenilə (göndərildi, çatdırıldı, oxundu)
                updateMessageStatus(data.messageId, data.status);
                break;
                
            case 'typing':
                // İstifadəçi yazır indikatoru
                if (data.conversationId === currentConversationId) {
                    showTypingIndicator(data.userId, data.username);
                }
                break;
                
            case 'auth_success':
                console.log('WebSocket səlahiyyətləndirmə uğurludur');
                break;
                
            default:
                console.log('Naməlum mesaj növü:', data.type);
        }
    }
    
    // Seçilmiş söhbətə yeni mesajları əldə et
    function fetchNewMessages() {
        if (!currentConversationId) return;
        
        fetch(`/api/messages.php?conversation_id=${currentConversationId}&after_id=${lastMessageId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.messages && data.messages.length > 0) {
                data.messages.forEach(message => {
                    appendNewMessage(message);
                });
                
                // Mesajları oxundu olaraq qeyd et
                markMessagesAsRead(currentConversationId);
            }
        })
        .catch(error => {
            console.error('Yeni mesajları əldə edərkən xəta:', error);
        });
    }
    
    // Yeni mesajı DOM-a əlavə et
    function appendNewMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        // Mesajın artıq əlavə edilib-edilmədiyini yoxla
        if (document.querySelector(`.message[data-id="${message.id}"]`)) {
            return;
        }
        
        const isCurrentUser = message.sender_id === userId;
        const messageHtml = `
            <div class="message ${isCurrentUser ? 'sent' : 'received'}" data-id="${message.id}">
                <div class="message-bubble ${isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}">
                    <div class="message-content">${escapeHtml(message.content)}</div>
                    <div class="message-meta ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}">
                        <span class="message-time">${formatMessageTime(message.created_at)}</span>
                        ${isCurrentUser ? `
                            <span class="message-status" data-message-id="${message.id}">
                                ${getStatusIcon(message.status)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Mesajı əlavə et
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        
        // Mesaj aşağıya sürüşdür
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Son mesaj ID-ni yenilə
        lastMessageId = Math.max(lastMessageId, message.id);
    }
    
    // Mesaj statusunu yenilə
    function updateMessageStatus(messageId, status) {
        const statusElement = document.querySelector(`.message-status[data-message-id="${messageId}"]`);
        if (statusElement) {
            statusElement.innerHTML = getStatusIcon(status);
        }
    }
    
    // Status ikonunu əldə et
    function getStatusIcon(status) {
        switch (status) {
            case 'sent':
                return '<i class="fas fa-check text-xs"></i>';
            case 'delivered':
                return '<i class="fas fa-check-double text-xs"></i>';
            case 'read':
                return '<i class="fas fa-check-double text-xs text-blue-300"></i>';
            default:
                return '<i class="fas fa-clock text-xs"></i>';
        }
    }
    
    // Yazır indikatoru göstər
    function showTypingIndicator(userId, username) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (!typingIndicator) return;
        
        typingIndicator.textContent = `${username} yazır...`;
        typingIndicator.classList.remove('hidden');
        
        // 3 saniyə sonra göstərməyi dayandır
        setTimeout(() => {
            typingIndicator.classList.add('hidden');
        }, 3000);
    }
    
    // Mesajları oxundu olaraq qeyd et
    function markMessagesAsRead(conversationId) {
        fetch('/api/mark-read.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                conversation_id: conversationId
            }),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Söhbət siyahısını yenilə
                updateConversationsList();
            }
        })
        .catch(error => {
            console.error('Mesajları oxundu olaraq qeyd edərkən xəta:', error);
        });
    }
    
    // Söhbət siyahısını yenilə
    function updateConversationsList() {
        const conversationItems = document.querySelectorAll('.conversation-item');
        
        // Əgər söhbət siyahısı yoxdursa, heç nə etmə
        if (!conversationItems.length) return;
        
        fetch('/api/conversations.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.conversations) {
                data.conversations.forEach(conversation => {
                    const conversationItem = document.querySelector(`.conversation-item[data-id="${conversation.id}"]`);
                    if (conversationItem) {
                        // Oxunmamış mesaj sayını yenilə
                        const unreadBadge = conversationItem.querySelector('.unread-badge');
                        if (unreadBadge) {
                            if (conversation.unread_count > 0) {
                                unreadBadge.textContent = conversation.unread_count;
                                unreadBadge.classList.remove('hidden');
                            } else {
                                unreadBadge.classList.add('hidden');
                            }
                        }
                        
                        // Son mesaj mətnini yenilə
                        const lastMessage = conversationItem.querySelector('.conversation-last-message');
                        if (lastMessage && conversation.last_message) {
                            lastMessage.textContent = conversation.last_message.content;
                        }
                        
                        // Son mesaj vaxtını yenilə
                        const lastMessageTime = conversationItem.querySelector('.conversation-time');
                        if (lastMessageTime && conversation.last_message) {
                            lastMessageTime.textContent = formatMessageTime(conversation.last_message.created_at);
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error('Söhbət siyahısını yenilərkən xəta:', error);
        });
    }
    
    // Mesaj göndər
    function sendMessage(content) {
        if (!currentConversationId || !content.trim()) return;
        
        // Lokal olaraq mesajı əlavə et (nikbin yanaşma)
        const tempId = 'temp_' + Date.now();
        const tempMessage = {
            id: tempId,
            sender_id: userId,
            content: content,
            status: 'sending',
            created_at: new Date().toISOString()
        };
        
        appendNewMessage(tempMessage);
        
        // Mesajı server-ə göndər
        fetch('/api/send-message.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                conversation_id: currentConversationId,
                content: content
            }),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.message) {
                // Müvəqqəti mesajı silmək
                const tempMessage = document.querySelector(`.message[data-id="${tempId}"]`);
                if (tempMessage) {
                    tempMessage.remove();
                }
                
                // Əsl mesajı əlavə et
                appendNewMessage(data.message);
                
                // Söhbət siyahısını yenilə
                updateConversationsList();
            } else {
                // Mesaj göndərilmə xətası
                const tempMessageStatus = document.querySelector(`.message-status[data-message-id="${tempId}"]`);
                if (tempMessageStatus) {
                    tempMessageStatus.innerHTML = '<i class="fas fa-exclamation-circle text-red-500 text-xs"></i>';
                }
            }
        })
        .catch(error => {
            console.error('Mesaj göndərilərkən xəta:', error);
            // Mesaj göndərilmə xətası
            const tempMessageStatus = document.querySelector(`.message-status[data-message-id="${tempId}"]`);
            if (tempMessageStatus) {
                tempMessageStatus.innerHTML = '<i class="fas fa-exclamation-circle text-red-500 text-xs"></i>';
            }
        });
    }
    
    // Yazır... siqnalını göndər
    function sendTypingIndicator() {
        if (!currentConversationId || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        socket.send(JSON.stringify({
            type: 'typing',
            conversationId: currentConversationId
        }));
    }
    
    // HTML xüsusi simvollarını təhlükəsizləşdir
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
    
    // Vaxt formatı
    function formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Eyni gün
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
        }
        // Dünən
        else if (date.toDateString() === yesterday.toDateString()) {
            return 'Dünən ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
        }
        // Bu həftə
        else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
            return days[date.getDay()] + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
        }
        // Digər
        else {
            return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    }
    
    // Mesajlaşma səhifəsini initialize et
    function initialize(options) {
        userId = options.userId;
        currentConversationId = options.conversationId;
        lastMessageId = options.lastMessageId || 0;
        
        // WebSocket ya da Polling başlat
        const wsConnected = initializeWebSocket();
        
        // WebSocket bağlantısı uğursuz oldusa, polling-ə keçid et
        if (!wsConnected) {
            fallbackToPolling();
        }
        
        // Mesaj formunu qur
        setupMessageForm();
        
        // İlk yükləmədə mesajları oxundu olaraq qeyd et
        if (currentConversationId) {
            markMessagesAsRead(currentConversationId);
        }
        
        // Söhbət seçimini qur
        setupConversationSelection();
        
        // Mesaj aşağıya sürüşdür
        scrollToBottom();
    }
    
    // Mesaj formu üçün hadisə dinləyicilərini qur
    function setupMessageForm() {
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        
        if (messageForm && messageInput) {
            // Mesaj göndərmə
            messageForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const content = messageInput.value.trim();
                if (content) {
                    sendMessage(content);
                    messageInput.value = '';
                    messageInput.focus();
                }
            });
            
            // Yazır... indikatoru
            let typingTimeout = null;
            messageInput.addEventListener('input', function() {
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                sendTypingIndicator();
                
                typingTimeout = setTimeout(() => {
                    typingTimeout = null;
                }, 1000);
            });
        }
    }
    
    // Söhbət seçimini qur
    function setupConversationSelection() {
        const conversationItems = document.querySelectorAll('.conversation-item');
        
        conversationItems.forEach(item => {
            item.addEventListener('click', function() {
                const conversationId = this.getAttribute('data-id');
                if (conversationId) {
                    window.location.href = `messages.php?conversation=${conversationId}`;
                }
            });
        });
    }
    
    // Mesajların aşağısına sürüşdür
    function scrollToBottom() {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // API
    return {
        initialize,
        sendMessage,
        scrollToBottom
    };
})();

// Səhifə yükləndikdə
document.addEventListener('DOMContentLoaded', function() {
    // messages.php səhifəsindəyiksə
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        // İstifadəçi ID-si və söhbət ID-sini əldə et
        const userId = parseInt(messagesContainer.getAttribute('data-user-id'));
        const conversationId = parseInt(messagesContainer.getAttribute('data-conversation-id'));
        const lastMessageId = parseInt(messagesContainer.getAttribute('data-last-message-id') || '0');
        
        // Mesajlaşma sistemini initialize et
        if (userId && conversationId) {
            Messaging.initialize({
                userId: userId,
                conversationId: conversationId,
                lastMessageId: lastMessageId
            });
        }
    }
});