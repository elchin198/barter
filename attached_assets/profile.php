<?php
// İstifadəçi profil səhifəsi
require_once 'includes/config.php';

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Profil sahibi istifadəçinin ID-si
$profile_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Əgər ID verilməyibsə və istifadəçi daxil olubsa, öz profili
if ($profile_id <= 0 && isLoggedIn()) {
    $profile_id = $_SESSION['user_id'];
}

// Cari istifadəçi məlumatları
$current_user = isLoggedIn() ? getCurrentUser() : null;

// Profil sahibi istifadəçinin məlumatlarını əldə et
$user = null;
if ($profile_id > 0) {
    $stmt = $pdo->prepare("
        SELECT u.*, 
               COUNT(DISTINCT i.id) as item_count,
               COUNT(DISTINCT f.id) as favorite_count,
               (SELECT COUNT(*) FROM user_ratings WHERE rated_user_id = u.id) as rating_count,
               (SELECT AVG(rating) FROM user_ratings WHERE rated_user_id = u.id) as avg_rating
        FROM users u
        LEFT JOIN items i ON u.id = i.user_id AND i.status != 'deleted'
        LEFT JOIN favorites f ON u.id = f.user_id
        WHERE u.id = ?
        GROUP BY u.id
    ");
    $stmt->execute([$profile_id]);
    $user = $stmt->fetch();
}

// İstifadəçi tapılmayıbsa
if (!$user) {
    setErrorMessage("İstifadəçi tapılmadı.");
    header("Location: index.php");
    exit;
}

// Aktivlik statistikaları
$user_stats = [
    'item_count' => $user['item_count'] ?? 0,
    'favorite_count' => $user['favorite_count'] ?? 0,
    'rating_count' => $user['rating_count'] ?? 0,
    'avg_rating' => $user['avg_rating'] ?? 0,
    'completed_barters' => 0,
    'active_barters' => 0,
    'member_since' => $user['created_at'] ?? '',
    'last_login' => $user['last_login'] ?? '',
];

// Tamamlanmış və aktiv barter saylarını əldə et
$stmt = $pdo->prepare("
    SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status IN ('pending', 'accepted') THEN 1 END) as active_count
    FROM offers
    WHERE sender_id = ? OR recipient_id = ?
");
$stmt->execute([$profile_id, $profile_id]);
$barter_stats = $stmt->fetch();

if ($barter_stats) {
    $user_stats['completed_barters'] = $barter_stats['completed_count'];
    $user_stats['active_barters'] = $barter_stats['active_count'];
}

// İstifadəçinin reytinqlərini əldə et
$ratings = [];
$stmt = $pdo->prepare("
    SELECT r.*, 
           u.username as rater_username,
           u.avatar as rater_avatar,
           o.id as barter_id,
           si.title as sender_item_title, 
           ri.title as recipient_item_title
    FROM user_ratings r
    JOIN users u ON r.rater_id = u.id
    LEFT JOIN offers o ON r.barter_id = o.id
    LEFT JOIN items si ON o.offered_item_id = si.id
    LEFT JOIN items ri ON o.wanted_item_id = ri.id
    WHERE r.rated_user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
");
$stmt->execute([$profile_id]);
$ratings = $stmt->fetchAll();

// Aktiv elanları əldə et
$active_items = getUserItems($pdo, $profile_id, 'active');

// Tamamlanmış barterları əldə et
$stmt = $pdo->prepare("
    SELECT o.*, 
           si.title as sender_item_title,
           si.id as sender_item_id,
           ri.title as recipient_item_title,
           ri.id as recipient_item_id,
           su.username as sender_username,
           su.id as sender_id,
           ru.username as recipient_username,
           ru.id as recipient_id,
           (SELECT file_path FROM images WHERE item_id = si.id AND is_main = 1 LIMIT 1) as sender_item_image,
           (SELECT file_path FROM images WHERE item_id = ri.id AND is_main = 1 LIMIT 1) as recipient_item_image
    FROM offers o
    JOIN items si ON o.offered_item_id = si.id
    JOIN items ri ON o.wanted_item_id = ri.id
    JOIN users su ON o.sender_id = su.id
    JOIN users ru ON o.recipient_id = ru.id
    WHERE (o.sender_id = ? OR o.recipient_id = ?) AND o.status = 'completed'
    ORDER BY o.updated_at DESC
    LIMIT 5
");
$stmt->execute([$profile_id, $profile_id]);
$completed_barters = $stmt->fetchAll();

// Aktiv barterları əldə et
$stmt = $pdo->prepare("
    SELECT o.*, 
           si.title as sender_item_title,
           si.id as sender_item_id,
           ri.title as recipient_item_title,
           ri.id as recipient_item_id,
           su.username as sender_username,
           su.id as sender_id,
           ru.username as recipient_username,
           ru.id as recipient_id,
           (SELECT file_path FROM images WHERE item_id = si.id AND is_main = 1 LIMIT 1) as sender_item_image,
           (SELECT file_path FROM images WHERE item_id = ri.id AND is_main = 1 LIMIT 1) as recipient_item_image
    FROM offers o
    JOIN items si ON o.offered_item_id = si.id
    JOIN items ri ON o.wanted_item_id = ri.id
    JOIN users su ON o.sender_id = su.id
    JOIN users ru ON o.recipient_id = ru.id
    WHERE (o.sender_id = ? OR o.recipient_id = ?) AND o.status IN ('pending', 'accepted')
    ORDER BY o.updated_at DESC
    LIMIT 5
");
$stmt->execute([$profile_id, $profile_id]);
$active_barters = $stmt->fetchAll();

// Form göndərildikdə (öz profil məlumatlarını redaktə etmək)
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isLoggedIn() && $profile_id == $current_user['id']) {
    // CSRF yoxlaması
    validate_csrf_token();
    
    // Hansı formdur?
    $form_action = isset($_POST['form_action']) ? $_POST['form_action'] : '';
    
    if ($form_action === 'update_profile') {
        $full_name = trim($_POST['full_name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $bio = trim($_POST['bio'] ?? '');
        
        // Yoxlanılması lazım olan sahələr
        $validation_errors = [];
        
        if (empty($email)) {
            $validation_errors[] = "Email ünvanı boş ola bilməz.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $validation_errors[] = "Düzgün email ünvanı daxil edin.";
        }
        
        // Email unikallığını yoxla
        if ($email !== $current_user['email']) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $current_user['id']]);
            if ($stmt->fetch()) {
                $validation_errors[] = "Bu email ünvanı artıq istifadə olunub.";
            }
        }
        
        if (empty($validation_errors)) {
            try {
                // İstifadəçi məlumatlarını yenilə
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET full_name = ?, email = ?, phone = ?, city = ?, bio = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$full_name, $email, $phone, $city, $bio, $current_user['id']]);
                
                // Uğurlu mesaj
                $success = "Profil məlumatlarınız uğurla yeniləndi.";
                
                // İstifadəçi məlumatlarını yenilə
                $current_user = getCurrentUser(true);
                $user = $current_user;
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        } else {
            $error = implode(" ", $validation_errors);
        }
    } 
    elseif ($form_action === 'change_password') {
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        // Yoxlanılması lazım olan sahələr
        $validation_errors = [];
        
        if (empty($current_password)) {
            $validation_errors[] = "Cari şifrəni daxil edin.";
        }
        
        if (empty($new_password)) {
            $validation_errors[] = "Yeni şifrəni daxil edin.";
        } elseif (strlen($new_password) < 6) {
            $validation_errors[] = "Şifrə ən az 6 simvol olmalıdır.";
        }
        
        if ($new_password !== $confirm_password) {
            $validation_errors[] = "Şifrə təsdiqi uyğun gəlmir.";
        }
        
        if (empty($validation_errors)) {
            try {
                // Cari şifrəni yoxla
                $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$current_user['id']]);
                $stored_hash = $stmt->fetchColumn();
                
                if (comparePasswords($current_password, $stored_hash)) {
                    // Yeni şifrəni şifrələ
                    $hashed_password = hashPassword($new_password);
                    
                    // Şifrəni yenilə
                    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                    $stmt->execute([$hashed_password, $current_user['id']]);
                    
                    // Uğurlu mesaj
                    $success = "Şifrəniz uğurla dəyişdirildi.";
                } else {
                    $error = "Cari şifrə yanlışdır.";
                }
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        } else {
            $error = implode(" ", $validation_errors);
        }
    }
    // Avatar yükləmə
    elseif ($form_action === 'upload_avatar' && isset($_FILES['avatar'])) {
        $avatar = $_FILES['avatar'];
        
        if ($avatar['error'] === UPLOAD_ERR_OK) {
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
            $max_size = 2 * 1024 * 1024; // 2MB
            
            if (!in_array($avatar['type'], $allowed_types)) {
                $error = "Yalnız JPG, PNG və GIF formatında şəkillər yükləyə bilərsiniz.";
            } elseif ($avatar['size'] > $max_size) {
                $error = "Şəkil həcmi 2MB-dan çox ola bilməz.";
            } else {
                try {
                    // Qovluğu yoxla
                    $upload_dir = 'uploads/avatars/';
                    if (!file_exists($upload_dir)) {
                        mkdir($upload_dir, 0755, true);
                    }
                    
                    // Unikal fayl adı
                    $extension = pathinfo($avatar['name'], PATHINFO_EXTENSION);
                    $filename = uniqid('avatar_') . '.' . $extension;
                    $filepath = $upload_dir . $filename;
                    
                    // Şəkli yüklə
                    if (move_uploaded_file($avatar['tmp_name'], $filepath)) {
                        // Köhnə avatarı silmək
                        $stmt = $pdo->prepare("SELECT avatar FROM users WHERE id = ?");
                        $stmt->execute([$current_user['id']]);
                        $old_avatar = $stmt->fetchColumn();
                        
                        // Verilənlər bazasını yenilə
                        $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                        $stmt->execute(['/' . $filepath, $current_user['id']]);
                        
                        // Köhnə şəkli sil
                        if ($old_avatar && file_exists(ltrim($old_avatar, '/'))) {
                            unlink(ltrim($old_avatar, '/'));
                        }
                        
                        // Uğurlu mesaj
                        $success = "Profil şəkliniz uğurla yeniləndi.";
                        
                        // İstifadəçi məlumatlarını yenilə
                        $current_user = getCurrentUser(true);
                        $user = $current_user;
                    } else {
                        $error = "Şəkil yükləmə zamanı xəta baş verdi.";
                    }
                } catch (Exception $e) {
                    $error = "Xəta baş verdi: " . $e->getMessage();
                }
            }
        } else {
            $error = "Şəkil yükləmə zamanı xəta: " . uploadErrorMessage($avatar['error']);
        }
    }
}

// Səhifə başlığı və açıqlaması
$page_title = $user['username'] . " | Profil | BarterTap.az";
$page_description = $user['username'] . " istifadəçisinin BarterTap.az platformasındakı profili.";

// Avatar yüklənməsi üçün JavaScript
$page_scripts = '';
if (isLoggedIn() && $profile_id == $current_user['id']) {
    $page_scripts = '
    <script>
    document.addEventListener("DOMContentLoaded", function() {
        const avatarInput = document.getElementById("avatar-input");
        const avatarPreview = document.getElementById("avatar-preview");
        const avatarForm = document.getElementById("avatar-form");
        
        // Avatar seçildikdə önbaxış göstər
        if (avatarInput) {
            avatarInput.addEventListener("change", function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        avatarPreview.style.backgroundImage = `url(${e.target.result})`;
                    };
                    
                    reader.readAsDataURL(this.files[0]);
                    
                    // Formu avtomatik göndər
                    avatarForm.submit();
                }
            });
        }
    });
    </script>
    ';
}

require_once 'includes/header.php';

// Yardımçı funksiyalar
function uploadErrorMessage($code) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return "Yüklənən fayl PHP ini faylında göstərilən maximum ölçüdən böyükdür.";
        case UPLOAD_ERR_FORM_SIZE:
            return "Yüklənən fayl HTML formasında göstərilən maximum ölçüdən böyükdür.";
        case UPLOAD_ERR_PARTIAL:
            return "Fayl ancaq qismən yüklənib.";
        case UPLOAD_ERR_NO_FILE:
            return "Heç bir fayl yüklənməyib.";
        case UPLOAD_ERR_NO_TMP_DIR:
            return "Müvəqqəti qovluq yoxdur.";
        case UPLOAD_ERR_CANT_WRITE:
            return "Faylı diskə yazmaq mümkün deyil.";
        case UPLOAD_ERR_EXTENSION:
            return "Fayl yükləmə PHP genişlənməsi tərəfindən dayandırıldı.";
        default:
            return "Naməlum yükləmə xətası.";
    }
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
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
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
        
        <!-- Profil başlığı -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div class="md:flex">
                <!-- Avatar və əsas məlumatlar -->
                <div class="md:w-1/3 border-r border-gray-200">
                    <div class="p-6">
                        <div class="flex flex-col items-center">
                            <!-- Avatar -->
                            <div class="relative mb-4">
                                <div
                                    id="avatar-preview" 
                                    class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden bg-cover bg-center"
                                    style="background-image: url('<?php echo !empty($user['avatar']) ? htmlspecialchars($user['avatar']) : '/assets/images/default-avatar.jpg'; ?>');"
                                >
                                    <?php if (empty($user['avatar'])): ?>
                                        <i class="fas fa-user text-gray-400 text-4xl"></i>
                                    <?php endif; ?>
                                </div>
                                
                                <?php if (isLoggedIn() && $profile_id == $_SESSION['user_id']): ?>
                                    <!-- Avatar dəyişmə düyməsi (öz profili üçün) -->
                                    <form id="avatar-form" method="POST" action="" enctype="multipart/form-data" class="absolute bottom-0 right-0">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="form_action" value="upload_avatar">
                                        <input 
                                            type="file" 
                                            name="avatar" 
                                            id="avatar-input" 
                                            accept="image/jpeg,image/png,image/gif" 
                                            class="hidden"
                                        >
                                        <label 
                                            for="avatar-input"
                                            class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-700"
                                        >
                                            <i class="fas fa-camera"></i>
                                        </label>
                                    </form>
                                <?php endif; ?>
                            </div>
                            
                            <!-- İstifadəçi adı və təqdimat -->
                            <h1 class="text-2xl font-bold text-gray-900 mb-1">
                                <?php echo htmlspecialchars($user['username']); ?>
                                
                                <?php if ($user['verified']): ?>
                                    <i class="fas fa-check-circle text-blue-500 ml-1" title="Təsdiqlənmiş hesab"></i>
                                <?php endif; ?>
                            </h1>
                            
                            <?php if (!empty($user['full_name'])): ?>
                                <p class="text-gray-600 mb-2"><?php echo htmlspecialchars($user['full_name']); ?></p>
                            <?php endif; ?>
                            
                            <!-- Reytinq ulduzları -->
                            <div class="flex items-center mb-4">
                                <?php
                                $rating = $user['avg_rating'] ?? 0;
                                $fullStars = floor($rating);
                                $halfStar = $rating - $fullStars >= 0.5 ? 1 : 0;
                                $emptyStars = 5 - $fullStars - $halfStar;
                                
                                for ($i = 0; $i < $fullStars; $i++) {
                                    echo '<i class="fas fa-star text-yellow-400 mr-1"></i>';
                                }
                                
                                if ($halfStar) {
                                    echo '<i class="fas fa-star-half-alt text-yellow-400 mr-1"></i>';
                                }
                                
                                for ($i = 0; $i < $emptyStars; $i++) {
                                    echo '<i class="far fa-star text-yellow-400 mr-1"></i>';
                                }
                                
                                $rating_count = $user['rating_count'] ?? 0;
                                ?>
                                <span class="text-sm text-gray-500 ml-1">(<?php echo number_format($rating, 1); ?> / <?php echo $rating_count; ?> rəy)</span>
                            </div>
                            
                            <!-- Əlaqə və Mesaj düymələri -->
                            <div class="flex space-x-2 mb-6">
                                <?php if (isLoggedIn() && $profile_id != $_SESSION['user_id']): ?>
                                    <a href="send-message.php?user=<?php echo $profile_id; ?>" class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <i class="fas fa-envelope mr-1"></i> Mesaj göndər
                                    </a>
                                <?php elseif (isLoggedIn() && $profile_id == $_SESSION['user_id']): ?>
                                    <button type="button" onclick="toggleEditProfile()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <i class="fas fa-user-edit mr-1"></i> Profili düzənlə
                                    </button>
                                <?php else: ?>
                                    <a href="login.php" class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <i class="fas fa-sign-in-alt mr-1"></i> Daxil olun
                                    </a>
                                <?php endif; ?>
                            </div>
                            
                            <!-- Profil məlumatları -->
                            <div class="w-full">
                                <div class="space-y-3 text-sm">
                                    <?php if (!empty($user['city'])): ?>
                                        <div class="flex items-start">
                                            <i class="fas fa-map-marker-alt text-gray-400 mt-1 w-5"></i>
                                            <span class="ml-2 text-gray-700"><?php echo htmlspecialchars($user['city']); ?></span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <div class="flex items-start">
                                        <i class="fas fa-calendar-alt text-gray-400 mt-1 w-5"></i>
                                        <span class="ml-2 text-gray-700">
                                            Qeydiyyat: <?php echo formatDate($user_stats['member_since']); ?>
                                        </span>
                                    </div>
                                    
                                    <?php if (!empty($user_stats['last_login'])): ?>
                                        <div class="flex items-start">
                                            <i class="fas fa-clock text-gray-400 mt-1 w-5"></i>
                                            <span class="ml-2 text-gray-700">
                                                Son giriş: <?php echo timeAgo($user_stats['last_login']); ?>
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($user['bio'])): ?>
                                        <div class="flex items-start pt-2 border-t border-gray-100">
                                            <i class="fas fa-info-circle text-gray-400 mt-1 w-5"></i>
                                            <div class="ml-2 text-gray-700">
                                                <?php echo nl2br(htmlspecialchars($user['bio'])); ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Statistikalar və fəaliyyət -->
                <div class="md:w-2/3 p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-6">Profil Statistikaları</h2>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div class="bg-blue-50 rounded-lg p-4 text-center">
                            <div class="text-blue-500 text-2xl font-bold">
                                <?php echo $user_stats['item_count']; ?>
                            </div>
                            <div class="text-gray-600 text-sm">Aktiv elan</div>
                        </div>
                        
                        <div class="bg-green-50 rounded-lg p-4 text-center">
                            <div class="text-green-500 text-2xl font-bold">
                                <?php echo $user_stats['completed_barters']; ?>
                            </div>
                            <div class="text-gray-600 text-sm">Tamamlanmış barter</div>
                        </div>
                        
                        <div class="bg-yellow-50 rounded-lg p-4 text-center">
                            <div class="text-yellow-500 text-2xl font-bold">
                                <?php echo $user_stats['active_barters']; ?>
                            </div>
                            <div class="text-gray-600 text-sm">Aktiv barter</div>
                        </div>
                        
                        <div class="bg-purple-50 rounded-lg p-4 text-center">
                            <div class="text-purple-500 text-2xl font-bold">
                                <?php echo $user_stats['rating_count']; ?>
                            </div>
                            <div class="text-gray-600 text-sm">Alınan rəy</div>
                        </div>
                    </div>
                    
                    <?php if (!empty($user['bio'])): ?>
                        <div class="mb-6 md:hidden">
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Haqqında</h3>
                            <div class="text-gray-700">
                                <?php echo nl2br(htmlspecialchars($user['bio'])); ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Aktiv barterlar -->
                    <?php if (!empty($active_barters)): ?>
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">Aktiv Barterlər</h3>
                                
                                <?php if (count($active_barters) < $user_stats['active_barters']): ?>
                                    <a href="#" class="text-primary hover:underline text-sm">
                                        Hamısını göstər
                                    </a>
                                <?php endif; ?>
                            </div>
                            
                            <div class="space-y-4">
                                <?php foreach ($active_barters as $barter): ?>
                                    <?php
                                    $is_sender = $barter['sender_id'] == $profile_id;
                                    $own_item = $is_sender ? $barter['sender_item_title'] : $barter['recipient_item_title'];
                                    $own_item_id = $is_sender ? $barter['sender_item_id'] : $barter['recipient_item_id'];
                                    $other_item = $is_sender ? $barter['recipient_item_title'] : $barter['sender_item_title'];
                                    $other_item_id = $is_sender ? $barter['recipient_item_id'] : $barter['sender_item_id'];
                                    $own_image = $is_sender ? $barter['sender_item_image'] : $barter['recipient_item_image'];
                                    $other_image = $is_sender ? $barter['recipient_item_image'] : $barter['sender_item_image'];
                                    $other_user = $is_sender ? $barter['recipient_username'] : $barter['sender_username'];
                                    $other_user_id = $is_sender ? $barter['recipient_id'] : $barter['sender_id'];
                                    ?>
                                    
                                    <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                                        <div class="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                            <div class="flex items-center">
                                                <i class="fas fa-exchange-alt text-primary mr-2"></i>
                                                <h4 class="font-medium text-gray-900">Barter #<?php echo $barter['id']; ?></h4>
                                            </div>
                                            
                                            <div class="<?php echo getStatusColor($barter['status']); ?> px-2 py-1 rounded-full text-xs font-medium">
                                                <?php echo translateStatus($barter['status']); ?>
                                            </div>
                                        </div>
                                        
                                        <div class="p-4">
                                            <div class="flex flex-col sm:flex-row sm:items-center">
                                                <div class="flex-1 min-w-0 mb-4 sm:mb-0 sm:mr-4">
                                                    <div class="flex items-center">
                                                        <div class="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                                            <?php if (!empty($own_image)): ?>
                                                                <img src="<?php echo htmlspecialchars($own_image); ?>" 
                                                                     alt="<?php echo htmlspecialchars($own_item); ?>" 
                                                                     class="w-full h-full object-cover">
                                                            <?php else: ?>
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            <?php endif; ?>
                                                        </div>
                                                        
                                                        <div class="min-w-0">
                                                            <p class="text-sm text-gray-600 mb-1">Sizin əşyanız:</p>
                                                            <h5 class="font-medium text-gray-900 truncate">
                                                                <?php echo htmlspecialchars($own_item); ?>
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="flex items-center justify-center my-4 sm:my-0">
                                                    <i class="fas fa-exchange-alt text-gray-400"></i>
                                                </div>
                                                
                                                <div class="flex-1 min-w-0 mb-4 sm:mb-0 sm:ml-4">
                                                    <div class="flex items-center">
                                                        <div class="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                                            <?php if (!empty($other_image)): ?>
                                                                <img src="<?php echo htmlspecialchars($other_image); ?>" 
                                                                     alt="<?php echo htmlspecialchars($other_item); ?>" 
                                                                     class="w-full h-full object-cover">
                                                            <?php else: ?>
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            <?php endif; ?>
                                                        </div>
                                                        
                                                        <div class="min-w-0">
                                                            <p class="text-sm text-gray-600 mb-1">
                                                                <a href="profile.php?id=<?php echo $other_user_id; ?>" class="hover:underline">
                                                                    <?php echo htmlspecialchars($other_user); ?>
                                                                </a>
                                                            </p>
                                                            <h5 class="font-medium text-gray-900 truncate">
                                                                <?php echo htmlspecialchars($other_item); ?>
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <div class="text-sm text-gray-500">
                                                    <i class="far fa-clock mr-1"></i> <?php echo timeAgo($barter['updated_at']); ?>
                                                </div>
                                                
                                                <a href="barter-summary.php?id=<?php echo $barter['id']; ?>" class="text-primary hover:underline text-sm font-medium">
                                                    <i class="fas fa-info-circle mr-1"></i> Ətraflı
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Tamamlanmış barterlar -->
                    <?php if (!empty($completed_barters)): ?>
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-medium text-gray-900">Tamamlanmış Barterlər</h3>
                                
                                <?php if (count($completed_barters) < $user_stats['completed_barters']): ?>
                                    <a href="#" class="text-primary hover:underline text-sm">
                                        Hamısını göstər
                                    </a>
                                <?php endif; ?>
                            </div>
                            
                            <div class="space-y-4">
                                <?php foreach ($completed_barters as $barter): ?>
                                    <?php
                                    $is_sender = $barter['sender_id'] == $profile_id;
                                    $own_item = $is_sender ? $barter['sender_item_title'] : $barter['recipient_item_title'];
                                    $own_item_id = $is_sender ? $barter['sender_item_id'] : $barter['recipient_item_id'];
                                    $other_item = $is_sender ? $barter['recipient_item_title'] : $barter['sender_item_title'];
                                    $other_item_id = $is_sender ? $barter['recipient_item_id'] : $barter['sender_item_id'];
                                    $own_image = $is_sender ? $barter['sender_item_image'] : $barter['recipient_item_image'];
                                    $other_image = $is_sender ? $barter['recipient_item_image'] : $barter['sender_item_image'];
                                    $other_user = $is_sender ? $barter['recipient_username'] : $barter['sender_username'];
                                    $other_user_id = $is_sender ? $barter['recipient_id'] : $barter['sender_id'];
                                    ?>
                                    
                                    <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                                        <div class="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                            <div class="flex items-center">
                                                <i class="fas fa-exchange-alt text-green-500 mr-2"></i>
                                                <h4 class="font-medium text-gray-900">Barter #<?php echo $barter['id']; ?></h4>
                                            </div>
                                            
                                            <div class="<?php echo getStatusColor($barter['status']); ?> px-2 py-1 rounded-full text-xs font-medium">
                                                <?php echo translateStatus($barter['status']); ?>
                                            </div>
                                        </div>
                                        
                                        <div class="p-4">
                                            <div class="flex flex-col sm:flex-row sm:items-center">
                                                <div class="flex-1 min-w-0 mb-4 sm:mb-0 sm:mr-4">
                                                    <div class="flex items-center">
                                                        <div class="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                                            <?php if (!empty($own_image)): ?>
                                                                <img src="<?php echo htmlspecialchars($own_image); ?>" 
                                                                     alt="<?php echo htmlspecialchars($own_item); ?>" 
                                                                     class="w-full h-full object-cover">
                                                            <?php else: ?>
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            <?php endif; ?>
                                                        </div>
                                                        
                                                        <div class="min-w-0">
                                                            <p class="text-sm text-gray-600 mb-1">Sizin əşyanız:</p>
                                                            <h5 class="font-medium text-gray-900 truncate">
                                                                <?php echo htmlspecialchars($own_item); ?>
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="flex items-center justify-center my-4 sm:my-0">
                                                    <i class="fas fa-check-circle text-green-500 text-lg"></i>
                                                </div>
                                                
                                                <div class="flex-1 min-w-0 mb-4 sm:mb-0 sm:ml-4">
                                                    <div class="flex items-center">
                                                        <div class="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                                            <?php if (!empty($other_image)): ?>
                                                                <img src="<?php echo htmlspecialchars($other_image); ?>" 
                                                                     alt="<?php echo htmlspecialchars($other_item); ?>" 
                                                                     class="w-full h-full object-cover">
                                                            <?php else: ?>
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            <?php endif; ?>
                                                        </div>
                                                        
                                                        <div class="min-w-0">
                                                            <p class="text-sm text-gray-600 mb-1">
                                                                <a href="profile.php?id=<?php echo $other_user_id; ?>" class="hover:underline">
                                                                    <?php echo htmlspecialchars($other_user); ?>
                                                                </a>
                                                            </p>
                                                            <h5 class="font-medium text-gray-900 truncate">
                                                                <?php echo htmlspecialchars($other_item); ?>
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <div class="text-sm text-gray-500">
                                                    <i class="far fa-calendar-check mr-1"></i> <?php echo formatDate($barter['updated_at']); ?>
                                                </div>
                                                
                                                <div class="flex space-x-2">
                                                    <?php if (isLoggedIn() && $current_user['id'] == $profile_id): ?>
                                                        <!-- İstifadəçini qiymətləndirmə linki -->
                                                        <a href="user-rating.php?user=<?php echo $other_user_id; ?>&barter=<?php echo $barter['id']; ?>" class="text-yellow-500 hover:underline text-sm font-medium">
                                                            <i class="fas fa-star mr-1"></i> Qiymətləndir
                                                        </a>
                                                    <?php endif; ?>
                                                    
                                                    <a href="barter-summary.php?id=<?php echo $barter['id']; ?>" class="text-primary hover:underline text-sm font-medium">
                                                        <i class="fas fa-info-circle mr-1"></i> Ətraflı
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <!-- Reytinqlər və aktiv elanlar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Sol tərəf: Reytinq bölməsi -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="text-lg font-semibold text-gray-900">İstifadəçi Reytinqləri</h2>
                    </div>
                    
                    <div class="p-5">
                        <?php if (empty($ratings)): ?>
                            <div class="text-center py-6 text-gray-500">
                                <i class="far fa-star text-gray-300 text-3xl mb-2"></i>
                                <p>Bu istifadəçi üçün hələ heç bir qiymətləndirmə yoxdur.</p>
                            </div>
                        <?php else: ?>
                            <div class="space-y-4">
                                <?php foreach ($ratings as $rating): ?>
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
                                                        <a href="profile.php?id=<?php echo $rating['rater_id']; ?>" class="font-medium text-gray-900 hover:underline">
                                                            <?php echo htmlspecialchars($rating['rater_username']); ?>
                                                        </a>
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
                                                
                                                <?php if (!empty($rating['barter_id'])): ?>
                                                    <div class="mt-2 text-sm text-gray-500">
                                                        <i class="fas fa-exchange-alt mr-1"></i>
                                                        <a href="barter-summary.php?id=<?php echo $rating['barter_id']; ?>" class="hover:underline">
                                                            Barter: <?php echo htmlspecialchars($rating['sender_item_title']); ?> ↔ <?php echo htmlspecialchars($rating['recipient_item_title']); ?>
                                                        </a>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                                
                                <?php if (count($ratings) < $user_stats['rating_count']): ?>
                                    <div class="text-center pt-2">
                                        <a href="#" class="text-primary hover:underline text-sm">
                                            Bütün reytinqləri göstər (<?php echo $user_stats['rating_count']; ?>)
                                        </a>
                                    </div>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <!-- Sağ tərəf: Aktiv elanlar -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-gray-900">Aktiv Elanlar</h2>
                        
                        <?php if (isLoggedIn() && $profile_id == $_SESSION['user_id']): ?>
                            <a href="create-item.php" class="bg-primary hover:bg-primary-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                <i class="fas fa-plus mr-1"></i> Yeni elan
                            </a>
                        <?php endif; ?>
                    </div>
                    
                    <div class="p-5">
                        <?php if (empty($active_items)): ?>
                            <div class="text-center py-6 text-gray-500">
                                <i class="fas fa-box-open text-gray-300 text-3xl mb-2"></i>
                                <p><?php echo $profile_id == ($_SESSION['user_id'] ?? 0) ? 'Sizin hələ' : 'Bu istifadəçinin hələ'; ?> aktiv elanı yoxdur.</p>
                                
                                <?php if (isLoggedIn() && $profile_id == $_SESSION['user_id']): ?>
                                    <a href="create-item.php" class="mt-3 inline-block bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                        <i class="fas fa-plus mr-1"></i> İlk elanı yarat
                                    </a>
                                <?php endif; ?>
                            </div>
                        <?php else: ?>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <?php foreach ($active_items as $item): ?>
                                    <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                                        <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                                            <div class="aspect-w-16 aspect-h-9 bg-gray-100">
                                                <img 
                                                    src="<?php echo $item['main_image'] ? htmlspecialchars($item['main_image']) : '/assets/images/placeholder.jpg'; ?>" 
                                                    alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                                    class="object-cover w-full h-48"
                                                    onerror="this.onerror=null; this.src='/assets/images/placeholder.jpg';"
                                                >
                                            </div>
                                            <div class="p-4">
                                                <div class="flex items-start justify-between mb-1">
                                                    <h3 class="font-medium text-gray-900 truncate">
                                                        <?php echo htmlspecialchars($item['title']); ?>
                                                    </h3>
                                                    <?php if ($item['has_price'] && $item['price']): ?>
                                                        <span class="text-primary font-medium"><?php echo formatPrice($item['price']); ?></span>
                                                    <?php endif; ?>
                                                </div>
                                                <div class="text-sm text-gray-600">
                                                    <div class="flex items-center mb-1">
                                                        <i class="<?php echo htmlspecialchars($item['category_icon']); ?> mr-1 text-xs"></i>
                                                        <span class="truncate"><?php echo htmlspecialchars($item['category_display_name']); ?></span>
                                                    </div>
                                                    <?php if($item['location']): ?>
                                                        <div class="flex items-center mb-1">
                                                            <i class="fas fa-map-marker-alt mr-1 text-xs"></i>
                                                            <span class="truncate"><?php echo htmlspecialchars($item['location']); ?></span>
                                                        </div>
                                                    <?php endif; ?>
                                                    <div class="flex items-center">
                                                        <i class="fas fa-clock mr-1 text-xs"></i>
                                                        <span><?php echo timeAgo($item['created_at']); ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            
                            <?php if ($user_stats['item_count'] > count($active_items)): ?>
                                <div class="text-center mt-6">
                                    <a href="#" class="text-primary hover:underline text-sm">
                                        Bütün elanları göstər (<?php echo $user_stats['item_count']; ?>)
                                    </a>
                                </div>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Profil məlumatları redaktə modal -->
    <?php if (isLoggedIn() && $profile_id == $_SESSION['user_id']): ?>
        <div id="edit-profile-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden">
            <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-gray-900">Profil Məlumatları Düzənlə</h2>
                    <button type="button" onclick="toggleEditProfile()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="p-5">
                    <div class="mb-6">
                        <ul class="flex border-b border-gray-200">
                            <li class="mr-1">
                                <button 
                                    type="button" 
                                    onclick="showTab('profile-info')"
                                    class="tab-button inline-block py-2 px-4 border-b-2 border-primary text-primary"
                                    data-tab="profile-info"
                                >
                                    Profil məlumatları
                                </button>
                            </li>
                            <li class="mr-1">
                                <button 
                                    type="button" 
                                    onclick="showTab('change-password')"
                                    class="tab-button inline-block py-2 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                                    data-tab="change-password"
                                >
                                    Şifrə dəyişmək
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Profil məlumatları redaktə -->
                    <div id="profile-info" class="tab-content">
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="form_action" value="update_profile">
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                    <input 
                                        type="text" 
                                        id="full_name" 
                                        name="full_name" 
                                        value="<?php echo htmlspecialchars($user['full_name'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>" 
                                        required
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input 
                                        type="text" 
                                        id="phone" 
                                        name="phone" 
                                        value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
                                    <input 
                                        type="text" 
                                        id="city" 
                                        name="city" 
                                        value="<?php echo htmlspecialchars($user['city'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Haqqımda</label>
                                <textarea 
                                    id="bio" 
                                    name="bio" 
                                    rows="4" 
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                ><?php echo htmlspecialchars($user['bio'] ?? ''); ?></textarea>
                                <p class="text-sm text-gray-500 mt-1">
                                    Özünüz haqqında qısa məlumat. Bu, profilinizin "Haqqımda" bölməsində göstəriləcək.
                                </p>
                            </div>
                            
                            <div class="flex justify-end">
                                <button type="button" onclick="toggleEditProfile()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors mr-2">
                                    Ləğv et
                                </button>
                                <button type="submit" class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Şifrə dəyişdirmə -->
                    <div id="change-password" class="tab-content hidden">
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="form_action" value="change_password">
                            
                            <div class="mb-4">
                                <label for="current_password" class="block text-sm font-medium text-gray-700 mb-1">Cari şifrə</label>
                                <input 
                                    type="password" 
                                    id="current_password" 
                                    name="current_password" 
                                    required
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                            </div>
                            
                            <div class="mb-4">
                                <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1">Yeni şifrə</label>
                                <input 
                                    type="password" 
                                    id="new_password" 
                                    name="new_password" 
                                    required
                                    minlength="6"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                <p class="text-sm text-gray-500 mt-1">
                                    Şifrə ən az 6 simvol olmalıdır.
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">Yeni şifrə (təkrar)</label>
                                <input 
                                    type="password" 
                                    id="confirm_password" 
                                    name="confirm_password" 
                                    required
                                    minlength="6"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                            </div>
                            
                            <div class="flex justify-end">
                                <button type="button" onclick="toggleEditProfile()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors mr-2">
                                    Ləğv et
                                </button>
                                <button type="submit" class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    Şifrəni dəyiş
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function toggleEditProfile() {
                const modal = document.getElementById('edit-profile-modal');
                modal.classList.toggle('hidden');
                
                // Body scroll lock
                if (!modal.classList.contains('hidden')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
            
            function showTab(tabId) {
                // Bütün tabları gizlət
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.add('hidden');
                });
                
                // Bütün düymələri deaktiv et
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.classList.remove('border-primary', 'text-primary');
                    button.classList.add('border-transparent', 'text-gray-500');
                });
                
                // Seçilmiş tabı göstər
                document.getElementById(tabId).classList.remove('hidden');
                
                // Seçilmiş düyməni aktiv et
                document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.remove('border-transparent', 'text-gray-500');
                document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('border-primary', 'text-primary');
            }
        </script>
    <?php endif; ?>
</main>

<?php
require_once 'includes/footer.php';

// Tarix formatı
function formatDate($date) {
    return date('d.m.Y', strtotime($date));
}
?>