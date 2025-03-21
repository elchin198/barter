<?php
// Mesaj göndərmək üçün köməkçi səhifə
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Parametrləri əldə et
$recipient_id = isset($_GET['user']) ? (int)$_GET['user'] : 0;
$item_id = isset($_GET['item']) ? (int)$_GET['item'] : 0;
$reply_id = isset($_GET['reply']) ? (int)$_GET['reply'] : 0;

// Əgər recipient və ya item parametrləri verilməyibsə
if ($recipient_id <= 0 && $item_id <= 0 && $reply_id <= 0) {
    setErrorMessage("Mesaj göndərmək üçün lazımi parametrlər verilməyib.");
    header("Location: index.php");
    exit;
}

// Özünüzə mesaj göndərə bilməzsiniz
if ($recipient_id == $current_user['id']) {
    setErrorMessage("Özünüzə mesaj göndərə bilməzsiniz.");
    header("Location: profile.php");
    exit;
}

// Recipient istifadəçisini əldə et (əgər birbaşa istifadəçiyə yazılırsa)
$recipient = null;
if ($recipient_id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$recipient_id]);
    $recipient = $stmt->fetch();
    
    if (!$recipient) {
        setErrorMessage("Qəbuledici istifadəçi tapılmadı.");
        header("Location: index.php");
        exit;
    }
}

// Elanı əldə et (əgər item ilə əlaqəli mesajdırsa)
$item = null;
if ($item_id > 0) {
    $stmt = $pdo->prepare("
        SELECT i.*, 
               u.id as owner_id,
               u.username as owner_username,
               c.name as category_name, 
               c.display_name as category_display_name,
               (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
        FROM items i
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = ?
    ");
    $stmt->execute([$item_id]);
    $item = $stmt->fetch();
    
    if (!$item) {
        setErrorMessage("Elan tapılmadı.");
        header("Location: index.php");
        exit;
    }
    
    // Əgər recipient göstərilməyibsə, elanın sahibini recipient kimi təyin et
    if ($recipient_id <= 0) {
        $recipient_id = $item['owner_id'];
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$recipient_id]);
        $recipient = $stmt->fetch();
    }
    
    // Özünüzün elanına mesaj göndərə bilməzsiniz
    if ($item['owner_id'] == $current_user['id']) {
        setErrorMessage("Öz elanınıza mesaj göndərə bilməzsiniz.");
        header("Location: item.php?id=" . $item_id);
        exit;
    }
}

// Cavab verilən söhbəti əldə et (əgər mövcuddursa)
$conversation = null;
if ($reply_id > 0) {
    $stmt = $pdo->prepare("
        SELECT c.*, i.id as item_id, i.title as item_title, i.user_id as item_owner_id
        FROM conversations c
        LEFT JOIN items i ON c.item_id = i.id
        WHERE c.id = ?
    ");
    $stmt->execute([$reply_id]);
    $conversation = $stmt->fetch();
    
    if (!$conversation) {
        setErrorMessage("Cavab vermək istədiyiniz söhbət tapılmadı.");
        header("Location: messages.php");
        exit;
    }
    
    // İstifadəçinin bu söhbətə giriş hüququnun olduğunu yoxla
    $stmt = $pdo->prepare("
        SELECT * FROM conversation_participants
        WHERE conversation_id = ? AND user_id = ?
    ");
    $stmt->execute([$reply_id, $current_user['id']]);
    if (!$stmt->fetch()) {
        setErrorMessage("Bu söhbətə giriş icazəniz yoxdur.");
        header("Location: messages.php");
        exit;
    }
    
    // Digər iştirakçını recipient kimi təyin et
    $stmt = $pdo->prepare("
        SELECT u.* 
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.user_id != ?
    ");
    $stmt->execute([$reply_id, $current_user['id']]);
    $recipient = $stmt->fetch();
    $recipient_id = $recipient['id'];
    
    // Elanı əldə et
    if ($conversation['item_id']) {
        $item_id = $conversation['item_id'];
        
        $stmt = $pdo->prepare("
            SELECT i.*, 
                  u.id as owner_id,
                  u.username as owner_username,
                  c.name as category_name, 
                  c.display_name as category_display_name,
                  (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
            FROM items i
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = ?
        ");
        $stmt->execute([$item_id]);
        $item = $stmt->fetch();
    }
}

// Mövcud söhbəti yoxla
$existing_conversation = null;
if ($recipient_id > 0 && $reply_id <= 0) {
    $stmt = $pdo->prepare("
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
        WHERE (c.item_id = ? OR c.item_id IS NULL)
        LIMIT 1
    ");
    $stmt->execute([$current_user['id'], $recipient_id, $item_id]);
    $existing_conversation = $stmt->fetch();
}

// Form göndərildikdə
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    $message = trim($_POST['message']);
    
    if (empty($message)) {
        $error = "Mesaj mətni boş ola bilməz.";
    } else {
        try {
            $pdo->beginTransaction();
            
            $conversation_id = null;
            
            // Əgər cavab verirsinizsə, mövcud söhbəti istifadə et
            if ($reply_id > 0) {
                $conversation_id = $reply_id;
            } 
            // Əgər mövcud söhbət varsa, onu istifadə et
            elseif ($existing_conversation) {
                $conversation_id = $existing_conversation['id'];
            } 
            // Yeni söhbət yarat
            else {
                $stmt = $pdo->prepare("
                    INSERT INTO conversations (item_id, initiated_by, created_at, last_message_at)
                    VALUES (?, ?, NOW(), NOW())
                ");
                $stmt->execute([$item_id, $current_user['id']]);
                $conversation_id = $pdo->lastInsertId();
                
                // Söhbət iştirakçılarını əlavə et
                $stmt = $pdo->prepare("
                    INSERT INTO conversation_participants (conversation_id, user_id)
                    VALUES (?, ?)
                ");
                $stmt->execute([$conversation_id, $current_user['id']]);
                $stmt->execute([$conversation_id, $recipient_id]);
            }
            
            // Mesajı əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO messages (conversation_id, sender_id, content, status, created_at)
                VALUES (?, ?, ?, 'sent', NOW())
            ");
            $stmt->execute([$conversation_id, $current_user['id'], $message]);
            
            // Söhbət son mesaj vaxtını yenilə
            $stmt = $pdo->prepare("
                UPDATE conversations SET last_message_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$conversation_id]);
            
            // Bildiriş əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, type, reference_id, content, is_read, created_at)
                VALUES (?, 'message', ?, ?, 0, NOW())
            ");
            
            $notification_content = $current_user['username'] . " sizə yeni mesaj göndərdi.";
            
            if ($item) {
                $notification_content .= " Elan: " . $item['title'];
            }
            
            $stmt->execute([$recipient_id, $conversation_id, $notification_content]);
            
            $pdo->commit();
            
            // Mesajlaşma səhifəsinə yönləndir
            setSuccessMessage("Mesaj uğurla göndərildi!");
            header("Location: messages.php?conversation=" . $conversation_id);
            exit;
            
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
}

// Səhifə başlığı və açıqlaması
$page_title = "Mesaj göndər | BarterTap.az";
$page_description = "BarterTap.az platformasında digər istifadəçilərə mesaj göndərin.";

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto">
            <!-- Geriyə qayıtma linki -->
            <div class="mb-4">
                <?php if ($item): ?>
                    <a href="item.php?id=<?php echo $item['id']; ?>" class="text-primary hover:underline flex items-center">
                        <i class="fas fa-arrow-left mr-1"></i> Elana qayıt
                    </a>
                <?php elseif ($reply_id): ?>
                    <a href="messages.php?conversation=<?php echo $reply_id; ?>" class="text-primary hover:underline flex items-center">
                        <i class="fas fa-arrow-left mr-1"></i> Söhbətə qayıt
                    </a>
                <?php else: ?>
                    <a href="javascript:history.back()" class="text-primary hover:underline flex items-center">
                        <i class="fas fa-arrow-left mr-1"></i> Geri qayıt
                    </a>
                <?php endif; ?>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-5 bg-gray-50 border-b border-gray-200">
                    <h1 class="text-xl font-bold text-gray-900">
                        <?php if ($reply_id): ?>
                            Söhbəti davam et
                        <?php else: ?>
                            Yeni mesaj
                        <?php endif; ?>
                    </h1>
                </div>
                
                <?php if ($error): ?>
                    <div class="p-4 bg-red-50 border-b border-red-100 text-red-700">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            <span><?php echo $error; ?></span>
                        </div>
                    </div>
                <?php endif; ?>
                
                <div class="p-5">
                    <!-- Qəbuledici istifadəçi məlumatları -->
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                            <?php if ($recipient && !empty($recipient['avatar'])): ?>
                                <img src="<?php echo htmlspecialchars($recipient['avatar']); ?>" 
                                    alt="<?php echo htmlspecialchars($recipient['username']); ?>" 
                                    class="w-full h-full object-cover">
                            <?php else: ?>
                                <i class="fas fa-user text-gray-400 text-xl"></i>
                            <?php endif; ?>
                        </div>
                        
                        <div>
                            <h2 class="font-medium text-gray-900">
                                <?php echo $recipient ? htmlspecialchars($recipient['username']) : 'Naməlum istifadəçi'; ?>
                            </h2>
                            <?php if ($recipient && !empty($recipient['full_name'])): ?>
                                <p class="text-sm text-gray-600">
                                    <?php echo htmlspecialchars($recipient['full_name']); ?>
                                </p>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <!-- Elan haqqında məlumat (əgər varsa) -->
                    <?php if ($item): ?>
                    <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 mr-3">
                                <?php if (!empty($item['main_image'])): ?>
                                    <img src="<?php echo htmlspecialchars($item['main_image']); ?>" 
                                         alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                         class="w-16 h-16 object-cover rounded">
                                <?php else: ?>
                                    <div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                        <i class="fas fa-image text-gray-400"></i>
                                    </div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="flex-1">
                                <h3 class="font-medium text-gray-900">
                                    <?php echo htmlspecialchars($item['title']); ?>
                                </h3>
                                <p class="text-sm text-gray-600">
                                    <i class="<?php echo !empty($item['category_icon']) ? htmlspecialchars($item['category_icon']) : 'fas fa-tag'; ?> mr-1"></i>
                                    <?php echo htmlspecialchars($item['category_display_name'] ?? 'Kateqoriya'); ?>
                                </p>
                                <a href="item.php?id=<?php echo $item['id']; ?>" class="text-primary text-sm hover:underline">
                                    Elana bax
                                </a>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Mesaj formu -->
                    <form method="POST" action="">
                        <?php echo csrf_field(); ?>
                        
                        <div class="mb-4">
                            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Mesajınız:</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                class="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                placeholder="Mesajınızı buraya yazın..."
                                required
                            ><?php echo isset($_POST['message']) ? htmlspecialchars($_POST['message']) : ''; ?></textarea>
                            <p class="mt-1 text-sm text-gray-500">
                                İstifadəçiyə göndərmək istədiyiniz mesajı yazın.
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <a href="javascript:history.back()" class="text-gray-500 hover:text-gray-700">
                                Ləğv et
                            </a>
                            
                            <button
                                type="submit"
                                class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-paper-plane mr-1"></i> Göndər
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<?php
require_once 'includes/footer.php';
?>