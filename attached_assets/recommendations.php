<?php
// Tövsiyələr səhifəsi
require_once 'includes/config.php';
require_once 'includes/recommendation_engine.php';

// Giriş yoxlaması
requireLogin();

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Sizin üçün tövsiyələr | BarterTap.az";
$page_description = "BarterTap.az platformasında sizin maraqlarınıza uyğun şəxsiləşdirilmiş tövsiyələr.";

// Tövsiyə edilən elanlar
$recommended_items = getRecommendedItems($pdo, $current_user['id'], 8);

// Tövsiyə edilən istifadəçilər
$recommended_users = getRecommendedUsers($pdo, $current_user['id'], 4);

// Oxşar istifadəçilər
$similar_users = getSimilarUsers($pdo, $current_user['id'], 4);

// İstifadəçi barterləri üçün kateqoriyaları əldə et
$stmt = $pdo->prepare("
    SELECT DISTINCT c.id, c.name, c.display_name, c.icon
    FROM items i
    JOIN categories c ON i.category_id = c.id
    WHERE i.user_id = ?
    AND i.status = 'active'
    ORDER BY c.display_name
");
$stmt->execute([$current_user['id']]);
$user_categories = $stmt->fetchAll();

// İstifadəçinin son baxdığı elanlar
$stmt = $pdo->prepare("
    SELECT i.*, 
           c.name as category_name, 
           c.display_name as category_display_name,
           c.icon as category_icon,
           u.username,
           u.id as user_id,
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image,
           v.visited_at
    FROM item_visits v
    JOIN items i ON v.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    JOIN users u ON i.user_id = u.id
    WHERE v.user_id = ?
    AND i.status = 'active'
    ORDER BY v.visited_at DESC
    LIMIT 4
");
$stmt->execute([$current_user['id']]);
$recently_viewed_items = $stmt->fetchAll();

// İstifadəçinin əsas məlumatları
$stmt = $pdo->prepare("
    SELECT city, interests, JSON_LENGTH(interests) as has_interests
    FROM users
    WHERE id = ?
");
$stmt->execute([$current_user['id']]);
$user_profile = $stmt->fetch();

// Əsas maraqları əldə et
$interests = [];
if ($user_profile && $user_profile['has_interests'] > 0) {
    $interests = json_decode($user_profile['interests'], true);
}

// İstifadəçi maraqlarını göstərməsi
$show_interest_prompt = empty($interests) || count($interests) < 3;

// İstifadəçi maraqlarını əlavə et/yenilə
if (isset($_POST['save_interests'])) {
    // CSRF yoxlaması
    validate_csrf_token();
    
    $selected_interests = isset($_POST['interests']) ? $_POST['interests'] : [];
    
    if (!empty($selected_interests)) {
        try {
            // JSON formatına çevir
            $interests_json = json_encode($selected_interests);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("UPDATE users SET interests = ? WHERE id = ?");
            $stmt->execute([$interests_json, $current_user['id']]);
            
            // Uğurlu mesaj
            setSuccessMessage("Maraqlarınız uğurla yeniləndi.");
            header("Location: recommendations.php");
            exit;
        } catch (Exception $e) {
            setErrorMessage("Maraqlar yenilənərkən xəta baş verdi: " . $e->getMessage());
        }
    } else {
        setErrorMessage("Zəhmət olmasa ən azı bir maraq seçin.");
    }
}

// Bütün mövcud maraqları/kateqoriyaları əldə et
$stmt = $pdo->prepare("SELECT id, name, display_name, icon FROM categories ORDER BY display_name");
$stmt->execute();
$all_categories = $stmt->fetchAll();

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Səhifə başlığı -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Sizin üçün tövsiyələr</h1>
            <p class="text-gray-600">Maraqlarınıza və fəaliyyətinizə uyğun şəxsiləşdirilmiş tövsiyələr</p>
        </div>
        
        <?php if ($show_interest_prompt): ?>
            <!-- Maraqlar soruşan blok -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-blue-800">
                            Daha yaxşı tövsiyələr üçün maraqlarınızı təyin edin
                        </h3>
                        <div class="mt-2 text-sm text-blue-700">
                            <p>Sizin üçün daha uyğun tövsiyələr təqdim etməmiz üçün maraqlarınızı təyin edin.</p>
                        </div>
                        <div class="mt-3">
                            <button type="button" onclick="showInterestsModal()" class="text-sm font-medium text-blue-700 hover:text-blue-600">
                                <i class="fas fa-cog mr-1"></i> Maraqlarımı təyin et
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
        
        <!-- Tövsiyə edilən elanlar -->
        <section class="mb-10">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900">Sizin üçün tövsiyə edilən elanlar</h2>
                <?php if (!empty($recommended_items)): ?>
                    <a href="search.php?recommended=1" class="text-primary hover:text-primary-700 text-sm font-medium">
                        Hamısını göstər
                    </a>
                <?php endif; ?>
            </div>
            
            <?php if (empty($recommended_items)): ?>
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-box-open text-gray-400 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-1">Hələlik tövsiyələr yoxdur</h3>
                    <p class="text-gray-600 mb-4">
                        Fəaliyyətiniz artdıqca daha uyğun tövsiyələr göstəriləcək. 
                        Daha çox elanlara baxın və maraqlarınızı təyin edin.
                    </p>
                    <a href="search.php" class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <i class="fas fa-search mr-1"></i> Elanlar araşdırın
                    </a>
                </div>
            <?php else: ?>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <?php foreach ($recommended_items as $item): ?>
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                                <div class="aspect-w-16 aspect-h-9 bg-gray-100">
                                    <?php if (!empty($item['main_image'])): ?>
                                        <img 
                                            src="<?php echo htmlspecialchars($item['main_image']); ?>" 
                                            alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                            class="object-cover w-full h-48"
                                        >
                                    <?php else: ?>
                                        <div class="flex items-center justify-center h-48">
                                            <i class="fas fa-image text-gray-400 text-3xl"></i>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <div class="p-4">
                                    <div class="flex items-start justify-between mb-1">
                                        <h3 class="font-medium text-gray-900 truncate max-w-[180px]">
                                            <?php echo htmlspecialchars($item['title']); ?>
                                        </h3>
                                        <?php if ($item['has_price'] && $item['price']): ?>
                                            <span class="text-primary font-medium"><?php echo formatPrice($item['price']); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    
                                    <div class="text-sm text-gray-600">
                                        <div class="flex items-center mb-1">
                                            <i class="<?php echo $item['category_icon']; ?> mr-1 text-xs"></i>
                                            <span class="truncate"><?php echo htmlspecialchars($item['category_display_name']); ?></span>
                                        </div>
                                        
                                        <?php if (!empty($item['location'])): ?>
                                            <div class="flex items-center mb-1">
                                                <i class="fas fa-map-marker-alt mr-1 text-xs"></i>
                                                <span class="truncate"><?php echo htmlspecialchars($item['location']); ?></span>
                                            </div>
                                        <?php endif; ?>
                                        
                                        <div class="flex items-center">
                                            <i class="fas fa-user mr-1 text-xs"></i>
                                            <span class="truncate"><?php echo htmlspecialchars($item['username']); ?></span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <!-- Tövsiyə edilən istifadəçilər -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="font-semibold text-gray-900">Sizə uyğun istifadəçilər</h2>
                        
                        <?php if (!empty($recommended_users)): ?>
                            <a href="users.php?recommended=1" class="text-primary hover:text-primary-700 text-sm">
                                Hamısını göstər
                            </a>
                        <?php endif; ?>
                    </div>
                    
                    <?php if (empty($recommended_users)): ?>
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-users text-gray-400 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-1">İstifadəçi tövsiyələri hələ hazır deyil</h3>
                            <p class="text-gray-600">
                                Platform aktivliyiniz artdıqca sizə uyğun istifadəçilər tövsiyə edəcəyik.
                            </p>
                        </div>
                    <?php else: ?>
                        <div class="divide-y divide-gray-100">
                            <?php foreach ($recommended_users as $user): ?>
                                <div class="p-4 hover:bg-gray-50 transition-colors">
                                    <a href="profile.php?id=<?php echo $user['id']; ?>" class="flex items-center">
                                        <div class="flex-shrink-0 mr-3">
                                            <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                <?php if (!empty($user['avatar'])): ?>
                                                    <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                                         alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                                         class="w-full h-full object-cover">
                                                <?php else: ?>
                                                    <i class="fas fa-user text-gray-400 text-xl"></i>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center mb-1">
                                                <h3 class="font-medium text-gray-900 truncate">
                                                    <?php echo htmlspecialchars($user['username']); ?>
                                                </h3>
                                                
                                                <?php if ($user['verified']): ?>
                                                    <i class="fas fa-check-circle text-blue-500 ml-1" title="Təsdiqlənmiş hesab"></i>
                                                <?php endif; ?>
                                            </div>
                                            
                                            <?php if (!empty($user['full_name'])): ?>
                                                <p class="text-sm text-gray-600 truncate">
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
                                                    echo '<i class="fas fa-star text-yellow-400 text-xs mr-0.5"></i>';
                                                }
                                                
                                                if ($halfStar) {
                                                    echo '<i class="fas fa-star-half-alt text-yellow-400 text-xs mr-0.5"></i>';
                                                }
                                                
                                                for ($i = 0; $i < $emptyStars; $i++) {
                                                    echo '<i class="far fa-star text-yellow-400 text-xs mr-0.5"></i>';
                                                }
                                                
                                                $rating_count = $user['rating_count'] ?? 0;
                                                ?>
                                                <span class="text-xs text-gray-500 ml-1">(<?php echo number_format($rating, 1); ?>)</span>
                                            </div>
                                        </div>
                                        
                                        <div class="ml-2">
                                            <i class="fas fa-chevron-right text-gray-400"></i>
                                        </div>
                                    </a>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Son baxılan elanlar -->
            <div>
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">Son baxdığınız elanlar</h2>
                    </div>
                    
                    <?php if (empty($recently_viewed_items)): ?>
                        <div class="p-6 text-center">
                            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-eye-slash text-gray-400"></i>
                            </div>
                            <h3 class="text-base font-medium text-gray-900 mb-1">Hələ heç bir elana baxmamısınız</h3>
                            <p class="text-sm text-gray-600">
                                Baxdığınız elanlar burada göstəriləcək. <a href="search.php" class="text-primary hover:underline">Elanlar araşdırın</a>
                            </p>
                        </div>
                    <?php else: ?>
                        <div class="divide-y divide-gray-100">
                            <?php foreach ($recently_viewed_items as $item): ?>
                                <div class="p-3 hover:bg-gray-50 transition-colors">
                                    <a href="item.php?id=<?php echo $item['id']; ?>" class="flex items-center">
                                        <div class="flex-shrink-0 mr-3">
                                            <div class="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                                                <?php if (!empty($item['main_image'])): ?>
                                                    <img 
                                                        src="<?php echo htmlspecialchars($item['main_image']); ?>" 
                                                        alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                                        class="w-full h-full object-cover"
                                                    >
                                                <?php else: ?>
                                                    <div class="flex items-center justify-center h-full">
                                                        <i class="fas fa-image text-gray-400"></i>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <h3 class="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                <?php echo htmlspecialchars($item['title']); ?>
                                            </h3>
                                            
                                            <div class="flex items-center mt-1">
                                                <span class="text-xs text-gray-500 truncate max-w-[180px]">
                                                    <i class="<?php echo $item['category_icon']; ?> mr-1 text-gray-400"></i>
                                                    <?php echo htmlspecialchars($item['category_display_name']); ?>
                                                </span>
                                                
                                                <span class="mx-1 text-gray-300">|</span>
                                                
                                                <span class="text-xs text-gray-500">
                                                    <?php echo timeAgo($item['visited_at']); ?>
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <div class="p-3 border-t border-gray-100 text-center">
                            <a href="history.php" class="text-primary hover:text-primary-700 text-sm">
                                Bütün tarixçəni göstər
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <!-- Maraqlar əsasında tövsiyələr -->
        <?php if (!empty($user_categories)): ?>
            <section class="mb-10">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-gray-900">Kateqoriyalarınıza uyğun tövsiyələr</h2>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <?php foreach ($user_categories as $category): ?>
                        <?php
                        // Kateqoriya əsasında tövsiyələr
                        $stmt = $pdo->prepare("
                            SELECT i.*, 
                                   c.name as category_name, 
                                   c.display_name as category_display_name,
                                   c.icon as category_icon,
                                   u.username,
                                   (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
                            FROM items i
                            JOIN categories c ON i.category_id = c.id
                            JOIN users u ON i.user_id = u.id
                            WHERE i.category_id = ?
                            AND i.status = 'active'
                            AND i.user_id != ?
                            AND i.id NOT IN (
                                SELECT offered_item_id FROM offers WHERE sender_id = ?
                                UNION
                                SELECT wanted_item_id FROM offers WHERE recipient_id = ?
                            )
                            ORDER BY i.created_at DESC
                            LIMIT 4
                        ");
                        $stmt->execute([$category['id'], $current_user['id'], $current_user['id'], $current_user['id']]);
                        $category_items = $stmt->fetchAll();
                        
                        if (empty($category_items)) {
                            continue;
                        }
                        ?>
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 class="font-semibold text-gray-900 flex items-center">
                                    <i class="<?php echo $category['icon']; ?> mr-2 text-primary"></i>
                                    <?php echo htmlspecialchars($category['display_name']); ?>
                                </h3>
                                
                                <a href="search.php?category=<?php echo $category['name']; ?>" class="text-primary hover:text-primary-700 text-sm">
                                    Hamısını göstər
                                </a>
                            </div>
                            
                            <div class="divide-y divide-gray-100">
                                <?php foreach ($category_items as $item): ?>
                                    <div class="p-3 hover:bg-gray-50 transition-colors">
                                        <a href="item.php?id=<?php echo $item['id']; ?>" class="flex items-center">
                                            <div class="flex-shrink-0 mr-3">
                                                <div class="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                                                    <?php if (!empty($item['main_image'])): ?>
                                                        <img 
                                                            src="<?php echo htmlspecialchars($item['main_image']); ?>" 
                                                            alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                                            class="w-full h-full object-cover"
                                                        >
                                                    <?php else: ?>
                                                        <div class="flex items-center justify-center h-full">
                                                            <i class="fas fa-image text-gray-400"></i>
                                                        </div>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                            
                                            <div class="flex-1 min-w-0">
                                                <h4 class="text-sm font-medium text-gray-900 truncate">
                                                    <?php echo htmlspecialchars($item['title']); ?>
                                                </h4>
                                                
                                                <div class="text-xs text-gray-500 mt-1">
                                                    <div class="flex items-center">
                                                        <i class="fas fa-user mr-1 text-gray-400"></i>
                                                        <span class="truncate max-w-[100px]"><?php echo htmlspecialchars($item['username']); ?></span>
                                                        
                                                        <?php if (!empty($item['location'])): ?>
                                                            <span class="mx-1 text-gray-300">|</span>
                                                            <i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>
                                                            <span class="truncate max-w-[100px]"><?php echo htmlspecialchars($item['location']); ?></span>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>
    </div>
</main>

<!-- Maraqlar modal -->
<div id="interests-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div class="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 class="font-semibold text-gray-900">Maraqlarınızı seçin</h3>
            <button type="button" onclick="hideInterestsModal()" class="text-gray-400 hover:text-gray-500">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="p-5 overflow-y-auto max-h-[60vh]">
            <p class="text-gray-600 mb-4">
                Maraqlarınızı və baxmaq istədiyiniz kateqoriyaları seçin. Bu, sizə daha uyğun elanları göstərməyimizə kömək edəcək.
            </p>
            
            <form method="POST" action="">
                <?php echo csrf_field(); ?>
                
                <div class="grid grid-cols-2 gap-3">
                    <?php foreach ($all_categories as $category): ?>
                        <label class="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="interests[]" 
                                value="<?php echo $category['id']; ?>"
                                <?php echo (!empty($interests) && in_array($category['id'], $interests)) ? 'checked' : ''; ?>
                                class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            >
                            <span class="ml-2 flex items-center">
                                <i class="<?php echo $category['icon']; ?> mr-1 text-primary"></i>
                                <span class="text-sm"><?php echo htmlspecialchars($category['display_name']); ?></span>
                            </span>
                        </label>
                    <?php endforeach; ?>
                </div>
                
                <div class="mt-5 flex justify-end">
                    <button type="button" onclick="hideInterestsModal()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors mr-2">
                        Ləğv et
                    </button>
                    <button 
                        type="submit" 
                        name="save_interests" 
                        class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        <i class="fas fa-save mr-1"></i> Yadda saxla
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// Maraqlar modalı
function showInterestsModal() {
    document.getElementById('interests-modal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function hideInterestsModal() {
    document.getElementById('interests-modal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

// Səhifə yüklənəndə istifadəçi fəaliyyətini qeyd et
document.addEventListener('DOMContentLoaded', function() {
    <?php if (!empty($recommended_items)): ?>
    fetch('/api/log-activity.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            action: 'view_recommendations',
            data: {
                type: 'items',
                count: <?php echo count($recommended_items); ?>
            }
        })
    }).catch(error => console.error('Activity logging error:', error));
    <?php endif; ?>
});
</script>

<?php
require_once 'includes/footer.php';
?>