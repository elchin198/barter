<?php
// İstifadəçi reytinq səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Qiymətləndiriləcək istifadəçi ID-si
$user_id = isset($_GET['user']) ? (int)$_GET['user'] : 0;

// Barter ID-si (əgər varsa)
$barter_id = isset($_GET['barter']) ? (int)$_GET['barter'] : 0;

// Parametrlər mövcud deyilsə
if ($user_id <= 0) {
    setErrorMessage("Qiymətləndirmək üçün istifadəçi seçilməyib.");
    header("Location: index.php");
    exit;
}

// Özünüzü qiymətləndirə bilməzsiniz
if ($user_id == $current_user['id']) {
    setErrorMessage("Özünüzü qiymətləndirə bilməzsiniz.");
    header("Location: profile.php?id=" . $user_id);
    exit;
}

// İstifadəçi məlumatlarını əldə et
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    setErrorMessage("İstifadəçi tapılmadı.");
    header("Location: index.php");
    exit;
}

// Barter məlumatlarını əldə et (əgər varsa)
$barter = null;
if ($barter_id > 0) {
    $stmt = $pdo->prepare("
        SELECT o.*, 
               si.title as sender_item_title,
               ri.title as recipient_item_title,
               su.username as sender_username,
               ru.username as recipient_username
        FROM offers o
        JOIN items si ON o.offered_item_id = si.id
        JOIN items ri ON o.wanted_item_id = ri.id
        JOIN users su ON o.sender_id = su.id
        JOIN users ru ON o.recipient_id = ru.id
        WHERE o.id = ? AND o.status = 'completed'
    ");
    $stmt->execute([$barter_id]);
    $barter = $stmt->fetch();
    
    if (!$barter) {
        setErrorMessage("Tamamlanmış barter tapılmadı.");
        header("Location: profile.php?id=" . $user_id);
        exit;
    }
    
    // Barter-in iştirakçılarından biri olmalısınız
    if ($barter['sender_id'] != $current_user['id'] && $barter['recipient_id'] != $current_user['id']) {
        setErrorMessage("Bu barterə aid qiymətləndirmə icazəniz yoxdur.");
        header("Location: profile.php?id=" . $user_id);
        exit;
    }
    
    // Qiymətləndiriləcək istifadəçi, barterda digər tərəf olmalıdır
    if ($barter['sender_id'] != $user_id && $barter['recipient_id'] != $user_id) {
        setErrorMessage("Qiymətləndirmək istədiyiniz istifadəçi bu barterdə iştirak etməyib.");
        header("Location: profile.php?id=" . $user_id);
        exit;
    }
    
    // Əvvəlcədən bu barteri qiymətləndirmisinizsə
    $stmt = $pdo->prepare("
        SELECT * FROM user_ratings 
        WHERE rater_id = ? AND rated_user_id = ? AND barter_id = ?
    ");
    $stmt->execute([$current_user['id'], $user_id, $barter_id]);
    
    if ($stmt->fetch()) {
        setErrorMessage("Bu barteri artıq qiymətləndirmisiniz.");
        header("Location: profile.php?id=" . $user_id);
        exit;
    }
}

// Form göndərildikdə
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    $rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
    $comment = trim($_POST['comment']);
    
    if ($rating < 1 || $rating > 5) {
        $error = "Qiymətləndirmə 1-5 arası olmalıdır.";
    } elseif (empty($comment)) {
        $error = "Şərh yazın.";
    } else {
        try {
            $pdo->beginTransaction();
            
            // Reytinqi əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO user_ratings (
                    rater_id, 
                    rated_user_id, 
                    barter_id, 
                    rating, 
                    comment, 
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $current_user['id'],
                $user_id,
                $barter_id,
                $rating,
                $comment
            ]);
            
            // İstifadəçinin ortalama reytinqini yenilə
            $stmt = $pdo->prepare("
                UPDATE users 
                SET rating = (
                    SELECT AVG(rating) 
                    FROM user_ratings 
                    WHERE rated_user_id = ?
                ), 
                rating_count = (
                    SELECT COUNT(*) 
                    FROM user_ratings 
                    WHERE rated_user_id = ?
                ) 
                WHERE id = ?
            ");
            $stmt->execute([$user_id, $user_id, $user_id]);
            
            // Bildiriş əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO notifications (
                    user_id, 
                    type, 
                    reference_id, 
                    content, 
                    is_read, 
                    created_at
                )
                VALUES (?, 'rating', ?, ?, 0, NOW())
            ");
            
            $notification_content = $current_user['username'] . " sizə ";
            
            if ($rating >= 4) {
                $notification_content .= "müsbət rəy bildirdi.";
            } elseif ($rating <= 2) {
                $notification_content .= "mənfi rəy bildirdi.";
            } else {
                $notification_content .= "rəy bildirdi.";
            }
            
            if ($barter_id > 0) {
                if ($barter['sender_id'] == $current_user['id']) {
                    $notification_content .= " Barter: " . $barter['sender_item_title'] . " - " . $barter['recipient_item_title'];
                } else {
                    $notification_content .= " Barter: " . $barter['recipient_item_title'] . " - " . $barter['sender_item_title'];
                }
            }
            
            $stmt->execute([$user_id, $current_user['id'], $notification_content]);
            
            $pdo->commit();
            
            // Uğurlu mesaj
            setSuccessMessage("Qiymətləndirməniz uğurla göndərildi.");
            
            // İstifadəçi profilinə qayıt
            header("Location: profile.php?id=" . $user_id);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
}

// Səhifə başlığı və açıqlaması
$page_title = "İstifadəçini qiymətləndir | BarterTap.az";
$page_description = $user['username'] . " istifadəçisini barterlər üzrə qiymətləndirin.";

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto">
            <!-- Geriyə qayıtma linki -->
            <div class="mb-4">
                <a href="profile.php?id=<?php echo $user_id; ?>" class="text-primary hover:underline flex items-center">
                    <i class="fas fa-arrow-left mr-1"></i> Profilə qayıt
                </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-5 bg-gray-50 border-b border-gray-200">
                    <h1 class="text-xl font-bold text-gray-900">
                        İstifadəçini qiymətləndir
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
                    <!-- Qiymətləndiriləcək istifadəçi məlumatları -->
                    <div class="flex items-center mb-6">
                        <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
                            <?php if (!empty($user['avatar'])): ?>
                                <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                    alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                    class="w-full h-full object-cover">
                            <?php else: ?>
                                <i class="fas fa-user text-gray-400 text-2xl"></i>
                            <?php endif; ?>
                        </div>
                        
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">
                                <?php echo htmlspecialchars($user['username']); ?>
                            </h2>
                            <?php if (!empty($user['full_name'])): ?>
                                <p class="text-gray-600">
                                    <?php echo htmlspecialchars($user['full_name']); ?>
                                </p>
                            <?php endif; ?>
                            <div class="flex items-center mt-1">
                                <?php
                                $rating = $user['rating'] ?? 0;
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
                                <span class="text-sm text-gray-500 ml-1">(<?php echo $rating_count; ?> rəy)</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Barter məlumatları (əgər varsa) -->
                    <?php if ($barter): ?>
                    <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h3 class="font-medium text-gray-900 mb-2">Barter haqqında</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-start">
                                <i class="fas fa-exchange-alt mt-1 mr-2 text-primary"></i>
                                <div>
                                    <div class="text-sm text-gray-700">Sizin əşyanız:</div>
                                    <div class="font-medium">
                                        <?php echo $barter['sender_id'] == $current_user['id'] ? 
                                            htmlspecialchars($barter['sender_item_title']) : 
                                            htmlspecialchars($barter['recipient_item_title']); ?>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-exchange-alt mt-1 mr-2 text-primary"></i>
                                <div>
                                    <div class="text-sm text-gray-700">Qarşı tərəfin əşyası:</div>
                                    <div class="font-medium">
                                        <?php echo $barter['sender_id'] == $current_user['id'] ? 
                                            htmlspecialchars($barter['recipient_item_title']) : 
                                            htmlspecialchars($barter['sender_item_title']); ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Qiymətləndirmə formu -->
                    <form method="POST" action="">
                        <?php echo csrf_field(); ?>
                        
                        <!-- Reytinq ulduzları -->
                        <div class="mb-5">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Qiymətləndirmə:</label>
                            <div class="flex items-center">
                                <div class="star-rating flex space-x-2">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="rating" value="<?php echo $i; ?>" class="hidden" <?php echo isset($_POST['rating']) && $_POST['rating'] == $i ? 'checked' : ''; ?>>
                                            <i class="text-2xl text-gray-300 hover:text-yellow-400 transition-colors far fa-star rating-star" data-rating="<?php echo $i; ?>"></i>
                                        </label>
                                    <?php endfor; ?>
                                </div>
                                <span class="ml-3 text-gray-500 rating-text">Qiymət seçin</span>
                            </div>
                        </div>
                        
                        <!-- Şərh -->
                        <div class="mb-5">
                            <label for="comment" class="block text-sm font-medium text-gray-700 mb-2">Şərhiniz:</label>
                            <textarea
                                id="comment"
                                name="comment"
                                rows="4"
                                class="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                placeholder="Bu istifadəçi ilə təcrübənizi yazın..."
                                required
                            ><?php echo isset($_POST['comment']) ? htmlspecialchars($_POST['comment']) : ''; ?></textarea>
                        </div>
                        
                        <!-- Qiymətləndirmə izahları -->
                        <div class="mb-6 text-sm text-gray-500">
                            <p><i class="fas fa-star text-yellow-400 mr-1"></i> <strong>1 ulduz:</strong> Çox pis təcrübə, tövsiyə etmirəm</p>
                            <p><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i> <strong>2 ulduz:</strong> Qənaətbəxş olmayan təcrübə</p>
                            <p><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i> <strong>3 ulduz:</strong> Normal təcrübə</p>
                            <p><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i> <strong>4 ulduz:</strong> Yaxşı təcrübə, tövsiyə edirəm</p>
                            <p><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i><i class="fas fa-star text-yellow-400 mr-1"></i> <strong>5 ulduz:</strong> Əla təcrübə, tamamilə etibarlıdır</p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <a href="profile.php?id=<?php echo $user_id; ?>" class="text-gray-500 hover:text-gray-700">
                                Ləğv et
                            </a>
                            
                            <button
                                type="submit"
                                class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-check mr-1"></i> Qiymətləndir
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- Star Rating JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.rating-star');
    const ratingText = document.querySelector('.rating-text');
    const labels = [
        'Çox pis',
        'Qənaətbəxş deyil',
        'Normal',
        'Yaxşı',
        'Əla'
    ];
    
    // Reytinq veriləndə
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            
            // İnput-u seç
            const input = this.parentElement.querySelector('input');
            input.checked = true;
            
            // Ulduzları yenilə
            updateStars(rating);
            
            // Mətni yenilə
            ratingText.textContent = labels[rating - 1];
        });
        
        // Hover effektləri
        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            
            // Ulduzları yenilə (hover)
            updateStars(rating, true);
            
            // Mətni yenilə
            ratingText.textContent = labels[rating - 1];
        });
        
        star.addEventListener('mouseleave', function() {
            // Seçilmiş reytinqi tap
            const checkedInput = document.querySelector('input[name="rating"]:checked');
            const rating = checkedInput ? checkedInput.value : 0;
            
            // Ulduzları yenilə (seçilən)
            updateStars(rating);
            
            // Mətni yenilə
            ratingText.textContent = rating > 0 ? labels[rating - 1] : 'Qiymət seçin';
        });
    });
    
    // Ulduzları yeniləmək
    function updateStars(rating, isHover = false) {
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            
            // Hover və ya seçilmiş duruma görə stili dəyiş
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.classList.add('text-yellow-400');
                star.classList.remove('text-gray-300');
            } else {
                star.classList.add('far');
                star.classList.remove('fas');
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    }
    
    // İlkin seçilmiş reytinqi göstər
    const checkedInput = document.querySelector('input[name="rating"]:checked');
    if (checkedInput) {
        const rating = checkedInput.value;
        updateStars(rating);
        ratingText.textContent = labels[rating - 1];
    }
});
</script>

<?php
require_once 'includes/footer.php';
?>