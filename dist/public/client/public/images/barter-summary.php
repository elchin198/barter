<?php
// Barter icmalı və təhlili səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Barter ID
$barter_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Səhifə başlığı və açıqlaması
$page_title = "Barter İcmalı | BarterTap.az";
$page_description = "BarterTap.az platformasında barter əməliyyatlarını izləyin və idarə edin.";

// Barterin təfərrüatlarını əldə et
$barter = null;
$offer_items = [];
$ratings = [];
$timeline = [];

if ($barter_id > 0) {
    // Əsas barter məlumatlarını əldə et
    $stmt = $pdo->prepare("
        SELECT o.*, 
               c.id as conversation_id,
               si.id as sender_item_id,
               si.title as sender_item_title,
               si.description as sender_item_description,
               si.user_id as sender_item_owner_id,
               ri.id as recipient_item_id,
               ri.title as recipient_item_title,
               ri.description as recipient_item_description,
               ri.user_id as recipient_item_owner_id,
               su.id as sender_id,
               su.username as sender_username,
               su.full_name as sender_fullname,
               su.avatar as sender_avatar,
               su.rating as sender_rating,
               su.rating_count as sender_rating_count,
               ru.id as recipient_id,
               ru.username as recipient_username,
               ru.full_name as recipient_fullname,
               ru.avatar as recipient_avatar,
               ru.rating as recipient_rating,
               ru.rating_count as recipient_rating_count
        FROM offers o
        LEFT JOIN conversations c ON o.conversation_id = c.id
        LEFT JOIN items si ON o.offered_item_id = si.id
        LEFT JOIN items ri ON o.wanted_item_id = ri.id
        LEFT JOIN users su ON o.sender_id = su.id
        LEFT JOIN users ru ON o.recipient_id = ru.id
        WHERE o.id = ?
    ");
    $stmt->execute([$barter_id]);
    $barter = $stmt->fetch();
    
    // Barter tapılmadısa veya istifadəçinin bu bartera giriş icazəsi yoxdursa
    if (!$barter || ($barter['sender_id'] != $current_user['id'] && $barter['recipient_id'] != $current_user['id'])) {
        setErrorMessage("Barter tapılmadı və ya ona giriş icazəniz yoxdur.");
        header("Location: profile.php");
        exit;
    }
    
    // Barter təklif olunan və istənilən eşyaların şəkillərini əldə et
    $stmt = $pdo->prepare("
        SELECT i.id as item_id, i.title, img.file_path
        FROM images img
        JOIN items i ON img.item_id = i.id
        WHERE i.id IN (?, ?) AND img.is_main = 1
    ");
    $stmt->execute([$barter['offered_item_id'], $barter['wanted_item_id']]);
    
    while ($row = $stmt->fetch()) {
        $offer_items[$row['item_id']] = [
            'title' => $row['title'],
            'image' => $row['file_path']
        ];
    }
    
    // Bu barterə aid reytinqləri əldə et
    $stmt = $pdo->prepare("
        SELECT r.*, 
               u.username as rater_username,
               u.avatar as rater_avatar
        FROM user_ratings r
        JOIN users u ON r.rater_id = u.id
        WHERE r.barter_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$barter_id]);
    $ratings = $stmt->fetchAll();
    
    // Barter vaxt qrafikini əldə et
    $timeline[] = [
        'event' => 'created',
        'date' => $barter['created_at'],
        'description' => $barter['sender_username'] . ' barter təklifi göndərdi'
    ];
    
    // Status dəyişiklikləri
    if ($barter['status'] != 'pending') {
        $stmt = $pdo->prepare("
            SELECT * FROM offer_status_history
            WHERE offer_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->execute([$barter_id]);
        
        while ($row = $stmt->fetch()) {
            $description = '';
            $event = $row['status'];
            
            switch ($row['status']) {
                case 'accepted':
                    $description = $barter['recipient_username'] . ' təklifi qəbul etdi';
                    break;
                case 'rejected':
                    $description = $barter['recipient_username'] . ' təklifi rədd etdi';
                    break;
                case 'cancelled':
                    $description = $row['changed_by'] == $barter['sender_id'] 
                        ? $barter['sender_username'] . ' təklifi ləğv etdi' 
                        : $barter['recipient_username'] . ' təklifi ləğv etdi';
                    break;
                case 'completed':
                    $description = 'Barter uğurla tamamlandı';
                    break;
                default:
                    $description = 'Status dəyişikliyi: ' . $row['status'];
            }
            
            $timeline[] = [
                'event' => $event,
                'date' => $row['created_at'],
                'description' => $description,
                'note' => $row['note']
            ];
        }
    }
    
    // Reytinq əlavə edilmələri
    foreach ($ratings as $rating) {
        $rater_name = $rating['rater_id'] == $barter['sender_id'] 
            ? $barter['sender_username'] 
            : $barter['recipient_username'];
        
        $rated_name = $rating['rated_user_id'] == $barter['sender_id'] 
            ? $barter['sender_username'] 
            : $barter['recipient_username'];
        
        $timeline[] = [
            'event' => 'rating',
            'date' => $rating['created_at'],
            'description' => $rater_name . ' istifadəçisi ' . $rated_name . ' istifadəçisini qiymətləndirdi',
            'rating' => $rating['rating'],
            'comment' => $rating['comment']
        ];
    }
    
    // Vaxt qrafikini tarixə görə sırala
    usort($timeline, function($a, $b) {
        return strtotime($a['date']) - strtotime($b['date']);
    });
}

// Formu submit əməliyyatları
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlaması
    validate_csrf_token();
    
    // Barter statusunun dəyişdirilməsi
    if (isset($_POST['action']) && isset($_POST['barter_id'])) {
        $action = $_POST['action'];
        $barter_id = (int)$_POST['barter_id'];
        $note = isset($_POST['note']) ? trim($_POST['note']) : '';
        
        try {
            $pdo->beginTransaction();
            
            // Hərəkət növündən asılı olaraq dəyişikliklər
            switch ($action) {
                case 'accept':
                    // Yalnız recipient təklifi qəbul edə bilər
                    if ($barter['recipient_id'] != $current_user['id']) {
                        throw new Exception("Bu barterin statusunu dəyişdirmək üçün icazəniz yoxdur.");
                    }
                    
                    if ($barter['status'] != 'pending') {
                        throw new Exception("Bu barter artıq " . translateStatus($barter['status']) . " statusundadır.");
                    }
                    
                    // Statusu dəyişdir
                    $stmt = $pdo->prepare("
                        UPDATE offers SET status = 'accepted', updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$barter_id]);
                    
                    // Status tarixinə əlavə et
                    $stmt = $pdo->prepare("
                        INSERT INTO offer_status_history (
                            offer_id, status, changed_by, note, created_at
                        )
                        VALUES (?, 'accepted', ?, ?, NOW())
                    ");
                    $stmt->execute([$barter_id, $current_user['id'], $note]);
                    
                    // Bildiriş göndər
                    $notification = "Barter təklifiniz qəbul edildi. " . 
                                    "Əşyalar: " . $barter['sender_item_title'] . " → " . $barter['recipient_item_title'];
                    
                    addNotification($pdo, $barter['sender_id'], 'barter_accepted', $barter_id, $notification);
                    
                    $success = "Barter təklifi uğurla qəbul edildi.";
                    break;
                    
                case 'reject':
                    // Yalnız recipient təklifi rədd edə bilər
                    if ($barter['recipient_id'] != $current_user['id']) {
                        throw new Exception("Bu barterin statusunu dəyişdirmək üçün icazəniz yoxdur.");
                    }
                    
                    if ($barter['status'] != 'pending') {
                        throw new Exception("Bu barter artıq " . translateStatus($barter['status']) . " statusundadır.");
                    }
                    
                    // Statusu dəyişdir
                    $stmt = $pdo->prepare("
                        UPDATE offers SET status = 'rejected', updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$barter_id]);
                    
                    // Status tarixinə əlavə et
                    $stmt = $pdo->prepare("
                        INSERT INTO offer_status_history (
                            offer_id, status, changed_by, note, created_at
                        )
                        VALUES (?, 'rejected', ?, ?, NOW())
                    ");
                    $stmt->execute([$barter_id, $current_user['id'], $note]);
                    
                    // Bildiriş göndər
                    $notification = "Barter təklifiniz rədd edildi. " . 
                                    "Əşyalar: " . $barter['sender_item_title'] . " → " . $barter['recipient_item_title'];
                    
                    if (!empty($note)) {
                        $notification .= " Səbəb: " . $note;
                    }
                    
                    addNotification($pdo, $barter['sender_id'], 'barter_rejected', $barter_id, $notification);
                    
                    $success = "Barter təklifi rədd edildi.";
                    break;
                    
                case 'cancel':
                    // Yalnız barteri göndərən və ya təklif mərhələsində rədd edən status dəyişə bilər
                    if ($barter['sender_id'] != $current_user['id'] && 
                        !($barter['recipient_id'] == $current_user['id'] && $barter['status'] == 'pending')) {
                        throw new Exception("Bu barterin statusunu dəyişdirmək üçün icazəniz yoxdur.");
                    }
                    
                    if ($barter['status'] == 'completed') {
                        throw new Exception("Tamamlanmış barteri ləğv edə bilməzsiniz.");
                    }
                    
                    // Statusu dəyişdir
                    $stmt = $pdo->prepare("
                        UPDATE offers SET status = 'cancelled', updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$barter_id]);
                    
                    // Status tarixinə əlavə et
                    $stmt = $pdo->prepare("
                        INSERT INTO offer_status_history (
                            offer_id, status, changed_by, note, created_at
                        )
                        VALUES (?, 'cancelled', ?, ?, NOW())
                    ");
                    $stmt->execute([$barter_id, $current_user['id'], $note]);
                    
                    // Bildiriş göndər
                    $recipient_id = $barter['sender_id'] == $current_user['id'] 
                        ? $barter['recipient_id'] 
                        : $barter['sender_id'];
                    
                    $notification = $current_user['username'] . " istifadəçisi barter təklifini ləğv etdi. " . 
                                   "Əşyalar: " . $barter['sender_item_title'] . " → " . $barter['recipient_item_title'];
                    
                    if (!empty($note)) {
                        $notification .= " Səbəb: " . $note;
                    }
                    
                    addNotification($pdo, $recipient_id, 'barter_cancelled', $barter_id, $notification);
                    
                    $success = "Barter təklifi ləğv edildi.";
                    break;
                    
                case 'complete':
                    // Yalnız təklifi qəbul edilmişdirsə tamamlamaq olar
                    if ($barter['status'] != 'accepted') {
                        throw new Exception("Yalnız qəbul edilmiş barterlər tamamlana bilər.");
                    }
                    
                    // Həm göndərən həm də qəbul edən təsdiqləməlidir
                    $confirm_status = '';
                    
                    if ($barter['sender_id'] == $current_user['id']) {
                        $confirm_status = 'sender_confirmed';
                    } elseif ($barter['recipient_id'] == $current_user['id']) {
                        $confirm_status = 'recipient_confirmed';
                    } else {
                        throw new Exception("Bu barterin statusunu dəyişdirmək üçün icazəniz yoxdur.");
                    }
                    
                    // Statusu əvvəlcə təsdiq edilmiş kimi qeyd et
                    $stmt = $pdo->prepare("
                        UPDATE offers 
                        SET $confirm_status = 1, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$barter_id]);
                    
                    // Yoxla görək hər iki tərəf təsdiqləyib?
                    $stmt = $pdo->prepare("
                        SELECT sender_confirmed, recipient_confirmed 
                        FROM offers WHERE id = ?
                    ");
                    $stmt->execute([$barter_id]);
                    $confirmations = $stmt->fetch();
                    
                    // Əgər hər iki tərəf təsdiqləyibsə, barteri tamamlanmış kimi qeyd et
                    if ($confirmations['sender_confirmed'] && $confirmations['recipient_confirmed']) {
                        // Statusu dəyişdir
                        $stmt = $pdo->prepare("
                            UPDATE offers SET status = 'completed', updated_at = NOW()
                            WHERE id = ?
                        ");
                        $stmt->execute([$barter_id]);
                        
                        // Status tarixinə əlavə et
                        $stmt = $pdo->prepare("
                            INSERT INTO offer_status_history (
                                offer_id, status, changed_by, note, created_at
                            )
                            VALUES (?, 'completed', ?, ?, NOW())
                        ");
                        $stmt->execute([$barter_id, $current_user['id'], $note]);
                        
                        // Hər iki tərəfə bildiriş göndər
                        $notification = "Barter uğurla tamamlandı! " . 
                                        "Əşyalar: " . $barter['sender_item_title'] . " ↔ " . $barter['recipient_item_title'] . 
                                        " Zəhmət olmasa, barterdəki iştirakçını qiymətləndirin.";
                        
                        addNotification($pdo, $barter['sender_id'], 'barter_completed', $barter_id, $notification);
                        addNotification($pdo, $barter['recipient_id'], 'barter_completed', $barter_id, $notification);
                        
                        $success = "Barter uğurla tamamlandı! İndi digər istifadəçini qiymətləndirə bilərsiniz.";
                    } else {
                        // Digər tərəfə təsdiqləmə bildirişi göndər
                        $recipient_id = $barter['sender_id'] == $current_user['id'] 
                            ? $barter['recipient_id'] 
                            : $barter['sender_id'];
                        
                        $notification = $current_user['username'] . " istifadəçisi barteri tamamlandı kimi qeyd etdi. " .
                                       "Əşyalar: " . $barter['sender_item_title'] . " ↔ " . $barter['recipient_item_title'] . 
                                       " Zəhmət olmasa, siz də təsdiqləyin.";
                        
                        addNotification($pdo, $recipient_id, 'barter_confirmation', $barter_id, $notification);
                        
                        $success = "Barter tamamlanması təsdiqləndi. Tam tamamlanması üçün digər tərəf də təsdiqləməlidir.";
                    }
                    break;
                    
                default:
                    throw new Exception("Yanlış əməliyyat.");
            }
            
            $pdo->commit();
            
            // Barter datalarını yenilə
            header("Location: barter-summary.php?id=" . $barter_id);
            exit;
            
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = $e->getMessage();
        }
    }
}

// Helper funksiyalar
function translateStatus($status) {
    $translations = [
        'pending' => 'Gözləmədə',
        'accepted' => 'Qəbul edildi',
        'rejected' => 'Rədd edildi',
        'cancelled' => 'Ləğv edildi',
        'completed' => 'Tamamlandı'
    ];
    
    return $translations[$status] ?? $status;
}

function getStatusColor($status) {
    $colors = [
        'pending' => 'bg-yellow-100 text-yellow-800',
        'accepted' => 'bg-green-100 text-green-800',
        'rejected' => 'bg-red-100 text-red-800',
        'cancelled' => 'bg-gray-100 text-gray-800',
        'completed' => 'bg-blue-100 text-blue-800'
    ];
    
    return $colors[$status] ?? 'bg-gray-100 text-gray-800';
}

function getStatusIcon($status) {
    $icons = [
        'pending' => 'fas fa-clock',
        'accepted' => 'fas fa-check',
        'rejected' => 'fas fa-times',
        'cancelled' => 'fas fa-ban',
        'completed' => 'fas fa-check-double',
        'rating' => 'fas fa-star',
        'created' => 'fas fa-plus-circle'
    ];
    
    return $icons[$status] ?? 'fas fa-circle';
}

function addNotification($pdo, $user_id, $type, $reference_id, $content) {
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, reference_id, content, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
    ");
    $stmt->execute([$user_id, $type, $reference_id, $content]);
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <?php if ($barter): ?>
            <!-- Geriyə qayıt linki -->
            <div class="mb-4">
                <a href="profile.php" class="text-primary hover:underline flex items-center">
                    <i class="fas fa-arrow-left mr-1"></i> Profilə qayıt
                </a>
            </div>
            
            <!-- Xəta və uğur mesajları -->
            <?php if ($error): ?>
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <span><?php echo $error; ?></span>
                    </div>
                </div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span><?php echo $success; ?></span>
                    </div>
                </div>
            <?php endif; ?>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-exchange-alt mr-2 text-primary"></i>
                        Barter İcmalı
                    </h1>
                    
                    <!-- Barter status indikatoru -->
                    <div class="<?php echo getStatusColor($barter['status']); ?> px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <i class="<?php echo getStatusIcon($barter['status']); ?> mr-1"></i>
                        <?php echo translateStatus($barter['status']); ?>
                    </div>
                </div>
                
                <div class="p-5">
                    <!-- İştirakçılar -->
                    <div class="mb-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">İştirakçılar</h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Göndərən -->
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <div class="flex-shrink-0 mr-3">
                                        <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            <?php if (!empty($barter['sender_avatar'])): ?>
                                                <img src="<?php echo htmlspecialchars($barter['sender_avatar']); ?>" 
                                                     alt="<?php echo htmlspecialchars($barter['sender_username']); ?>" 
                                                     class="w-full h-full object-cover">
                                            <?php else: ?>
                                                <i class="fas fa-user text-gray-400 text-xl"></i>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div class="flex items-center">
                                            <h3 class="font-medium text-gray-900">
                                                <?php echo htmlspecialchars($barter['sender_username']); ?>
                                            </h3>
                                            
                                            <?php if ($barter['sender_id'] == $current_user['id']): ?>
                                                <span class="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Siz</span>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <?php if (!empty($barter['sender_fullname'])): ?>
                                            <p class="text-sm text-gray-600">
                                                <?php echo htmlspecialchars($barter['sender_fullname']); ?>
                                            </p>
                                        <?php endif; ?>
                                        
                                        <!-- Reytinq -->
                                        <div class="flex items-center mt-1">
                                            <?php
                                            $rating = $barter['sender_rating'] ?? 0;
                                            $fullStars = floor($rating);
                                            $halfStar = $rating - $fullStars >= 0.5 ? 1 : 0;
                                            $emptyStars = 5 - $fullStars - $halfStar;
                                            
                                            for ($i = 0; $i < $fullStars; $i++) {
                                                echo '<i class="fas fa-star text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            if ($halfStar) {
                                                echo '<i class="fas fa-star-half-alt text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            for ($i = 0; $i < $emptyStars; $i++) {
                                                echo '<i class="far fa-star text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            $rating_count = $barter['sender_rating_count'] ?? 0;
                                            ?>
                                            <span class="text-xs text-gray-500 ml-1">(<?php echo $rating_count; ?>)</span>
                                        </div>
                                        
                                        <!-- Profil linki -->
                                        <a href="profile.php?id=<?php echo $barter['sender_id']; ?>" class="text-primary text-sm hover:underline mt-2 inline-block">
                                            <i class="fas fa-user mr-1"></i> Profili göstər
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Qəbul edən -->
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <div class="flex-shrink-0 mr-3">
                                        <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            <?php if (!empty($barter['recipient_avatar'])): ?>
                                                <img src="<?php echo htmlspecialchars($barter['recipient_avatar']); ?>" 
                                                     alt="<?php echo htmlspecialchars($barter['recipient_username']); ?>" 
                                                     class="w-full h-full object-cover">
                                            <?php else: ?>
                                                <i class="fas fa-user text-gray-400 text-xl"></i>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div class="flex items-center">
                                            <h3 class="font-medium text-gray-900">
                                                <?php echo htmlspecialchars($barter['recipient_username']); ?>
                                            </h3>
                                            
                                            <?php if ($barter['recipient_id'] == $current_user['id']): ?>
                                                <span class="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Siz</span>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <?php if (!empty($barter['recipient_fullname'])): ?>
                                            <p class="text-sm text-gray-600">
                                                <?php echo htmlspecialchars($barter['recipient_fullname']); ?>
                                            </p>
                                        <?php endif; ?>
                                        
                                        <!-- Reytinq -->
                                        <div class="flex items-center mt-1">
                                            <?php
                                            $rating = $barter['recipient_rating'] ?? 0;
                                            $fullStars = floor($rating);
                                            $halfStar = $rating - $fullStars >= 0.5 ? 1 : 0;
                                            $emptyStars = 5 - $fullStars - $halfStar;
                                            
                                            for ($i = 0; $i < $fullStars; $i++) {
                                                echo '<i class="fas fa-star text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            if ($halfStar) {
                                                echo '<i class="fas fa-star-half-alt text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            for ($i = 0; $i < $emptyStars; $i++) {
                                                echo '<i class="far fa-star text-yellow-400 text-sm mr-0.5"></i>';
                                            }
                                            
                                            $rating_count = $barter['recipient_rating_count'] ?? 0;
                                            ?>
                                            <span class="text-xs text-gray-500 ml-1">(<?php echo $rating_count; ?>)</span>
                                        </div>
                                        
                                        <!-- Profil linki -->
                                        <a href="profile.php?id=<?php echo $barter['recipient_id']; ?>" class="text-primary text-sm hover:underline mt-2 inline-block">
                                            <i class="fas fa-user mr-1"></i> Profili göstər
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Barter məlumatları -->
                    <div class="mb-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Barter Detalları</h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Təklif edilən -->
                            <div class="border border-gray-200 rounded-lg overflow-hidden">
                                <div class="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 class="font-medium text-gray-900">Təklif edilən əşya</h3>
                                    <p class="text-sm text-gray-600">
                                        <i class="fas fa-user mr-1"></i> <?php echo htmlspecialchars($barter['sender_username']); ?> tərəfindən
                                    </p>
                                </div>
                                
                                <div class="p-4">
                                    <div class="flex flex-col sm:flex-row sm:items-center">
                                        <div class="sm:w-1/3 mb-3 sm:mb-0 sm:mr-4">
                                            <div class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-md overflow-hidden">
                                                <?php if (isset($offer_items[$barter['offered_item_id']]['image'])): ?>
                                                    <img src="<?php echo htmlspecialchars($offer_items[$barter['offered_item_id']]['image']); ?>" 
                                                         alt="<?php echo htmlspecialchars($barter['sender_item_title']); ?>" 
                                                         class="object-cover w-full h-full">
                                                <?php else: ?>
                                                    <div class="flex items-center justify-center h-full">
                                                        <i class="fas fa-image text-gray-400 text-3xl"></i>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        
                                        <div class="sm:w-2/3">
                                            <h4 class="text-lg font-medium text-gray-900 mb-2">
                                                <?php echo htmlspecialchars($barter['sender_item_title']); ?>
                                            </h4>
                                            
                                            <?php if (!empty($barter['sender_item_description'])): ?>
                                                <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                                                    <?php echo nl2br(htmlspecialchars($barter['sender_item_description'])); ?>
                                                </p>
                                            <?php endif; ?>
                                            
                                            <a href="item.php?id=<?php echo $barter['sender_item_id']; ?>" class="text-primary text-sm hover:underline inline-flex items-center">
                                                <i class="fas fa-eye mr-1"></i> Əşyanı göstər
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- İstənilən -->
                            <div class="border border-gray-200 rounded-lg overflow-hidden">
                                <div class="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 class="font-medium text-gray-900">İstənilən əşya</h3>
                                    <p class="text-sm text-gray-600">
                                        <i class="fas fa-user mr-1"></i> <?php echo htmlspecialchars($barter['recipient_username']); ?> tərəfindən
                                    </p>
                                </div>
                                
                                <div class="p-4">
                                    <div class="flex flex-col sm:flex-row sm:items-center">
                                        <div class="sm:w-1/3 mb-3 sm:mb-0 sm:mr-4">
                                            <div class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-md overflow-hidden">
                                                <?php if (isset($offer_items[$barter['wanted_item_id']]['image'])): ?>
                                                    <img src="<?php echo htmlspecialchars($offer_items[$barter['wanted_item_id']]['image']); ?>" 
                                                         alt="<?php echo htmlspecialchars($barter['recipient_item_title']); ?>" 
                                                         class="object-cover w-full h-full">
                                                <?php else: ?>
                                                    <div class="flex items-center justify-center h-full">
                                                        <i class="fas fa-image text-gray-400 text-3xl"></i>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        
                                        <div class="sm:w-2/3">
                                            <h4 class="text-lg font-medium text-gray-900 mb-2">
                                                <?php echo htmlspecialchars($barter['recipient_item_title']); ?>
                                            </h4>
                                            
                                            <?php if (!empty($barter['recipient_item_description'])): ?>
                                                <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                                                    <?php echo nl2br(htmlspecialchars($barter['recipient_item_description'])); ?>
                                                </p>
                                            <?php endif; ?>
                                            
                                            <a href="item.php?id=<?php echo $barter['recipient_item_id']; ?>" class="text-primary text-sm hover:underline inline-flex items-center">
                                                <i class="fas fa-eye mr-1"></i> Əşyanı göstər
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Barter hərəkətləri -->
                    <?php if ($barter['status'] === 'pending' && $barter['recipient_id'] == $current_user['id']): ?>
                        <!-- Recipient üçün qəbul/rədd et düymələri -->
                        <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h2 class="text-lg font-semibold text-gray-900 mb-3">Barter Təklifi Hərəkətləri</h2>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Qəbul et -->
                                <div class="bg-white p-4 rounded-lg border border-gray-200">
                                    <h3 class="font-medium text-gray-900 mb-2">Təklifi qəbul et</h3>
                                    <p class="text-sm text-gray-600 mb-4">
                                        Təklifi qəbul etdikdən sonra, iki tərəf arasında əşya mübadiləsi prosesinə başlaya bilərsiniz.
                                    </p>
                                    
                                    <form method="POST" action="">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="action" value="accept">
                                        <input type="hidden" name="barter_id" value="<?php echo $barter_id; ?>">
                                        
                                        <div class="mb-3">
                                            <label for="accept_note" class="block text-sm font-medium text-gray-700 mb-1">Qeyd (istəyə bağlı):</label>
                                            <textarea
                                                id="accept_note"
                                                name="note"
                                                rows="2"
                                                class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="Məsələn: Barter şərtləri, görüş vaxtı və yeri və s."
                                            ></textarea>
                                        </div>
                                        
                                        <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                            <i class="fas fa-check mr-1"></i> Təklifi qəbul et
                                        </button>
                                    </form>
                                </div>
                                
                                <!-- Rədd et -->
                                <div class="bg-white p-4 rounded-lg border border-gray-200">
                                    <h3 class="font-medium text-gray-900 mb-2">Təklifi rədd et</h3>
                                    <p class="text-sm text-gray-600 mb-4">
                                        Təklifi qəbul etməmək istəyirsinizsə, rədd edə bilərsiniz. Rədd etmə səbəbini göstərmək tövsiyə olunur.
                                    </p>
                                    
                                    <form method="POST" action="">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="action" value="reject">
                                        <input type="hidden" name="barter_id" value="<?php echo $barter_id; ?>">
                                        
                                        <div class="mb-3">
                                            <label for="reject_note" class="block text-sm font-medium text-gray-700 mb-1">Rədd etmə səbəbi:</label>
                                            <textarea
                                                id="reject_note"
                                                name="note"
                                                rows="2"
                                                class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder="Məsələn: Daha uyğun bir təklif aldım, əşyanı satmağa qərar verdim və s."
                                            ></textarea>
                                        </div>
                                        
                                        <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                            <i class="fas fa-times mr-1"></i> Təklifi rədd et
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    <?php elseif ($barter['status'] === 'accepted'): ?>
                        <!-- Tamamlanma hərəkətləri -->
                        <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
                            <h2 class="text-lg font-semibold text-gray-900 mb-3">Barter Tamamlama</h2>
                            
                            <p class="text-sm text-gray-600 mb-4">
                                <i class="fas fa-info-circle mr-1 text-blue-500"></i>
                                Əgər barter prosesi tamamlandısa və əşyalar dəyişdirildisə, barteri tamamlanmış kimi qeyd edə bilərsiniz.
                                Barter tam tamamlanması üçün hər iki tərəf təsdiqləməlidir.
                            </p>
                            
                            <?php
                            // Təsdiqləmə statusunu yoxla
                            $is_sender = $barter['sender_id'] == $current_user['id'];
                            $sender_confirmed = $barter['sender_confirmed'] ?? false;
                            $recipient_confirmed = $barter['recipient_confirmed'] ?? false;
                            
                            $user_confirmed = $is_sender ? $sender_confirmed : $recipient_confirmed;
                            $other_confirmed = $is_sender ? $recipient_confirmed : $sender_confirmed;
                            ?>
                            
                            <div class="flex items-center mb-4">
                                <div class="flex-1 flex items-center">
                                    <div class="w-8 h-8 rounded-full <?php echo $sender_confirmed ? 'bg-green-500' : 'bg-gray-300'; ?> flex items-center justify-center text-white">
                                        <i class="<?php echo $sender_confirmed ? 'fas fa-check' : 'fas fa-user'; ?>"></i>
                                    </div>
                                    <div class="ml-2">
                                        <span class="text-sm font-medium"><?php echo htmlspecialchars($barter['sender_username']); ?></span>
                                        <span class="text-xs text-gray-500 block">
                                            <?php echo $sender_confirmed ? 'Təsdiqlənib' : 'Gözlənilir'; ?>
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="w-16 h-1 bg-gray-200 mx-2 relative">
                                    <div class="absolute inset-0 bg-green-500" style="width: <?php echo ($sender_confirmed && $recipient_confirmed) ? '100%' : ($sender_confirmed || $recipient_confirmed ? '50%' : '0%'); ?>%;"></div>
                                </div>
                                
                                <div class="flex-1 flex items-center">
                                    <div class="w-8 h-8 rounded-full <?php echo $recipient_confirmed ? 'bg-green-500' : 'bg-gray-300'; ?> flex items-center justify-center text-white">
                                        <i class="<?php echo $recipient_confirmed ? 'fas fa-check' : 'fas fa-user'; ?>"></i>
                                    </div>
                                    <div class="ml-2">
                                        <span class="text-sm font-medium"><?php echo htmlspecialchars($barter['recipient_username']); ?></span>
                                        <span class="text-xs text-gray-500 block">
                                            <?php echo $recipient_confirmed ? 'Təsdiqlənib' : 'Gözlənilir'; ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <?php if (!$user_confirmed): ?>
                                <form method="POST" action="" class="mt-4">
                                    <?php echo csrf_field(); ?>
                                    <input type="hidden" name="action" value="complete">
                                    <input type="hidden" name="barter_id" value="<?php echo $barter_id; ?>">
                                    
                                    <div class="mb-3">
                                        <label for="complete_note" class="block text-sm font-medium text-gray-700 mb-1">Qeyd (istəyə bağlı):</label>
                                        <textarea
                                            id="complete_note"
                                            name="note"
                                            rows="2"
                                            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Barterlə bağlı əlavə qeydlər"
                                        ></textarea>
                                    </div>
                                    
                                    <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                        <i class="fas fa-check-double mr-1"></i> Barteri tamamlanmış kimi təsdiqlə
                                    </button>
                                </form>
                            <?php elseif (!$other_confirmed): ?>
                                <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
                                    <i class="fas fa-clock mr-1"></i>
                                    Siz barteri təsdiqləmisiniz. Tam tamamlanması üçün digər tərəfin təsdiqini gözləyin.
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Ləğv et düyməsi (göndərən və ya təklif mərhələsində olan qəbul edən) -->
                    <?php if (
                        ($barter['status'] === 'pending' || $barter['status'] === 'accepted') && 
                        ($barter['sender_id'] == $current_user['id'] || 
                         ($barter['recipient_id'] == $current_user['id'] && $barter['status'] === 'pending'))
                    ): ?>
                        <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h2 class="text-lg font-semibold text-gray-900 mb-3">Barter Ləğv Etmə</h2>
                            
                            <p class="text-sm text-gray-600 mb-4">
                                <i class="fas fa-exclamation-triangle mr-1 text-yellow-500"></i>
                                Diqqət: Barteri ləğv etdikdən sonra, bu əməliyyat geri qaytarıla bilməz.
                                Əmin olduqdan sonra ləğv edin.
                            </p>
                            
                            <form method="POST" action="">
                                <?php echo csrf_field(); ?>
                                <input type="hidden" name="action" value="cancel">
                                <input type="hidden" name="barter_id" value="<?php echo $barter_id; ?>">
                                
                                <div class="mb-3">
                                    <label for="cancel_note" class="block text-sm font-medium text-gray-700 mb-1">Ləğv etmə səbəbi:</label>
                                    <textarea
                                        id="cancel_note"
                                        name="note"
                                        rows="2"
                                        class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Məsələn: Daha uyğun bir təklif aldım, əşyanı satmağa qərar verdim və s."
                                    ></textarea>
                                </div>
                                
                                <button type="submit" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                    <i class="fas fa-ban mr-1"></i> Barteri ləğv et
                                </button>
                            </form>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Reytinq bölməsi - tamamlanmış barterlər üçün -->
                    <?php if ($barter['status'] === 'completed'): ?>
                        <div class="mb-6">
                            <h2 class="text-lg font-semibold text-gray-900 mb-4">Qiymətləndirmələr</h2>
                            
                            <?php
                            // Cari istifadəçinin qiymətləndirmələrini və digər tərəfin qiymətləndirmələrini ayır
                            $user_ratings = [];
                            $other_ratings = [];
                            
                            foreach ($ratings as $rating) {
                                if ($rating['rater_id'] == $current_user['id']) {
                                    $user_ratings[] = $rating;
                                } else {
                                    $other_ratings[] = $rating;
                                }
                            }
                            
                            // Digər istifadəçinin ID-si
                            $other_user_id = $barter['sender_id'] == $current_user['id'] ? $barter['recipient_id'] : $barter['sender_id'];
                            ?>
                            
                            <!-- Əgər cari istifadəçi reytinq verməyibsə -->
                            <?php if (empty($user_ratings)): ?>
                                <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
                                    <i class="fas fa-exclamation-circle mr-1"></i>
                                    Bu barteri hələ qiymətləndirməmisiniz. 
                                    <a href="user-rating.php?user=<?php echo $other_user_id; ?>&barter=<?php echo $barter_id; ?>" class="font-medium underline">
                                        İndi qiymətləndirin
                                    </a>
                                </div>
                            <?php endif; ?>
                            
                            <div class="space-y-4">
                                <!-- İstifadəçinin verdiyi reytinqlər -->
                                <?php foreach ($user_ratings as $rating): ?>
                                    <div class="border border-gray-200 rounded-lg p-4 bg-blue-50">
                                        <div class="flex items-start">
                                            <div class="flex-shrink-0 mr-3">
                                                <div class="flex items-center justify-center">
                                                    <i class="fas fa-user text-blue-500 text-xl"></i>
                                                </div>
                                            </div>
                                            
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between">
                                                    <div>
                                                        <span class="font-medium text-gray-900">Sizin qiymətləndirməniz</span>
                                                        <span class="text-sm text-gray-500 ml-2">
                                                            (<?php echo timeAgo($rating['created_at']); ?>)
                                                        </span>
                                                    </div>
                                                    
                                                    <div class="flex items-center">
                                                        <?php for ($i = 1; $i <= 5; $i++): ?>
                                                            <i class="<?php echo $i <= $rating['rating'] ? 'fas' : 'far'; ?> fa-star text-yellow-400 ml-0.5"></i>
                                                        <?php endfor; ?>
                                                    </div>
                                                </div>
                                                
                                                <div class="mt-2 text-gray-700">
                                                    <?php echo nl2br(htmlspecialchars($rating['comment'])); ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <!-- Digər tərəfin verdiyi reytinqlər -->
                                <?php foreach ($other_ratings as $rating): ?>
                                    <div class="border border-gray-200 rounded-lg p-4">
                                        <div class="flex items-start">
                                            <div class="flex-shrink-0 mr-3">
                                                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    <?php if (!empty($rating['rater_avatar'])): ?>
                                                        <img src="<?php echo htmlspecialchars($rating['rater_avatar']); ?>" 
                                                             alt="<?php echo htmlspecialchars($rating['rater_username']); ?>" 
                                                             class="w-full h-full object-cover">
                                                    <?php else: ?>
                                                        <i class="fas fa-user text-gray-400"></i>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                            
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between">
                                                    <div>
                                                        <span class="font-medium text-gray-900"><?php echo htmlspecialchars($rating['rater_username']); ?></span>
                                                        <span class="text-sm text-gray-500 ml-2">
                                                            (<?php echo timeAgo($rating['created_at']); ?>)
                                                        </span>
                                                    </div>
                                                    
                                                    <div class="flex items-center">
                                                        <?php for ($i = 1; $i <= 5; $i++): ?>
                                                            <i class="<?php echo $i <= $rating['rating'] ? 'fas' : 'far'; ?> fa-star text-yellow-400 ml-0.5"></i>
                                                        <?php endfor; ?>
                                                    </div>
                                                </div>
                                                
                                                <div class="mt-2 text-gray-700">
                                                    <?php echo nl2br(htmlspecialchars($rating['comment'])); ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($ratings)): ?>
                                    <div class="text-center py-6 text-gray-500">
                                        <i class="far fa-star text-gray-300 text-3xl mb-2"></i>
                                        <p>Bu barter üçün hələ heç bir qiymətləndirmə yoxdur.</p>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Barter vaxt qrafiki -->
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Barter Tarixçəsi</h2>
                        
                        <div class="relative">
                            <!-- Vaxt qrafiki xətti -->
                            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            
                            <div class="space-y-6 relative">
                                <?php foreach ($timeline as $index => $event): ?>
                                    <div class="flex">
                                        <!-- İndikator nöqtəsi -->
                                        <div class="flex-shrink-0 relative z-10">
                                            <div class="w-8 h-8 rounded-full flex items-center justify-center 
                                                <?php echo getStatusColor($event['event']); ?>">
                                                <i class="<?php echo getStatusIcon($event['event']); ?>"></i>
                                            </div>
                                        </div>
                                        
                                        <!-- Məzmun -->
                                        <div class="ml-4 flex-1">
                                            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div class="flex items-center justify-between">
                                                    <h3 class="font-medium text-gray-900">
                                                        <?php echo $event['description']; ?>
                                                    </h3>
                                                    <span class="text-sm text-gray-500">
                                                        <?php echo timeAgo($event['date']); ?>
                                                    </span>
                                                </div>
                                                
                                                <?php if (!empty($event['note'])): ?>
                                                    <div class="mt-2 text-gray-600 text-sm">
                                                        <i class="fas fa-quote-left text-gray-400 mr-1"></i>
                                                        <?php echo nl2br(htmlspecialchars($event['note'])); ?>
                                                    </div>
                                                <?php endif; ?>
                                                
                                                <?php if (isset($event['rating'])): ?>
                                                    <div class="mt-2 flex items-center">
                                                        <span class="text-sm text-gray-500 mr-2">Qiymətləndirmə:</span>
                                                        <?php for ($i = 1; $i <= 5; $i++): ?>
                                                            <i class="<?php echo $i <= $event['rating'] ? 'fas' : 'far'; ?> fa-star text-yellow-400 mr-0.5 text-sm"></i>
                                                        <?php endfor; ?>
                                                    </div>
                                                    
                                                    <?php if (!empty($event['comment'])): ?>
                                                        <div class="mt-1 text-gray-600 text-sm">
                                                            <i class="fas fa-comment text-gray-400 mr-1"></i>
                                                            <?php echo nl2br(htmlspecialchars($event['comment'])); ?>
                                                        </div>
                                                    <?php endif; ?>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <?php if (empty($timeline)): ?>
                                    <div class="text-center py-6 text-gray-500">
                                        <i class="fas fa-history text-gray-300 text-3xl mb-2"></i>
                                        <p>Bu barter üçün hələ heç bir hadisə qeydə alınmayıb.</p>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mesajlaşma və digər hərəkətlər -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Mesajlaşma -->
                <div class="md:col-span-2">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-4 bg-gray-50 border-b border-gray-200">
                            <h2 class="font-semibold text-gray-900">Mesajlaşma</h2>
                        </div>
                        
                        <div class="p-4">
                            <?php if ($barter['conversation_id']): ?>
                                <a href="messages.php?conversation=<?php echo $barter['conversation_id']; ?>" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                                    <i class="fas fa-comments mr-2"></i> Mesajları göstər
                                </a>
                            <?php else: ?>
                                <div class="text-gray-500">
                                    <i class="fas fa-exclamation-circle mr-1"></i>
                                    Bu barter üçün mesajlaşma tapılmadı.
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Faydalı linklər -->
                <div>
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-4 bg-gray-50 border-b border-gray-200">
                            <h2 class="font-semibold text-gray-900">Faydalı Linklər</h2>
                        </div>
                        
                        <div class="p-4">
                            <ul class="space-y-2">
                                <li>
                                    <a href="profile.php?id=<?php echo $other_user_id; ?>" class="text-primary hover:underline flex items-center">
                                        <i class="fas fa-user mr-2"></i> Qarşı tərəfin profilini göstər
                                    </a>
                                </li>
                                <li>
                                    <a href="item.php?id=<?php echo $barter['sender_item_id']; ?>" class="text-primary hover:underline flex items-center">
                                        <i class="fas fa-tag mr-2"></i> Təklif edilən əşyanı göstər
                                    </a>
                                </li>
                                <li>
                                    <a href="item.php?id=<?php echo $barter['recipient_item_id']; ?>" class="text-primary hover:underline flex items-center">
                                        <i class="fas fa-tag mr-2"></i> İstənilən əşyanı göstər
                                    </a>
                                </li>
                                
                                <?php if ($barter['status'] === 'completed' && empty($user_ratings)): ?>
                                    <li class="pt-2 border-t border-gray-100">
                                        <a href="user-rating.php?user=<?php echo $other_user_id; ?>&barter=<?php echo $barter_id; ?>" class="text-green-600 hover:underline flex items-center font-medium">
                                            <i class="fas fa-star mr-2"></i> İstifadəçini qiymətləndir
                                        </a>
                                    </li>
                                <?php endif; ?>
                                
                                <li class="pt-2 border-t border-gray-100">
                                    <a href="search.php" class="text-gray-500 hover:underline flex items-center">
                                        <i class="fas fa-search mr-2"></i> Digər elanları göstər
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <i class="fas fa-exchange-alt text-gray-300 text-5xl mb-4"></i>
                <h2 class="text-2xl font-semibold text-gray-700 mb-2">Barter tapılmadı</h2>
                <p class="text-gray-600 mb-6 max-w-lg mx-auto">
                    Axtardığınız barter tapılmadı və ya mövcud deyil. Bütün aktiv barterlərinizi görmək üçün profil səhifəsinə keçin.
                </p>
                <a href="profile.php" class="bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium">
                    <i class="fas fa-user mr-2"></i> Profilə keç
                </a>
            </div>
        <?php endif; ?>
    </div>
</main>

<?php
require_once 'includes/footer.php';
?>