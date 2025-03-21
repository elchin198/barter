<?php
// Sosial şəbəkə funksionallığı səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Sosial Şəbəkə | BarterTap.az";
$page_description = "BarterTap.az platformasında sosial şəbəkə funksionallığı ilə dostlar tapın və barterlər təşkil edin.";

// Göstəriləcək tab
$active_tab = isset($_GET['tab']) && in_array($_GET['tab'], ['connections', 'recommendations', 'activity', 'discover']) 
    ? $_GET['tab'] 
    : 'connections';

// Mesaj və xəta göstəricisi
$success = '';
$error = '';

// İstifadəçi əlaqələri/bağlantıları idarə et
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlaması
    validate_csrf_token();
    
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    // İstifadəçini izləmə/izlənməni ləğv etmə
    if ($action === 'toggle_follow') {
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        
        try {
            // İstifadəçinin mövcudluğunu yoxla
            $stmt = $pdo->prepare("SELECT id, username FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $target_user = $stmt->fetch();
            
            if (!$target_user) {
                $error = "İstifadəçi tapılmadı.";
            } else if ($user_id === $current_user['id']) {
                $error = "Özünüzü izləyə bilməzsiniz.";
            } else {
                // İzləmə statusunu yoxla
                $stmt = $pdo->prepare("
                    SELECT id FROM user_connections 
                    WHERE user_id = ? AND followed_user_id = ?
                ");
                $stmt->execute([$current_user['id'], $user_id]);
                $existing_connection = $stmt->fetch();
                
                if ($existing_connection) {
                    // İzləməni ləğv et
                    $stmt = $pdo->prepare("
                        DELETE FROM user_connections 
                        WHERE user_id = ? AND followed_user_id = ?
                    ");
                    $stmt->execute([$current_user['id'], $user_id]);
                    
                    $success = htmlspecialchars($target_user['username']) . " istifadəçisini izləməyi dayandırdınız.";
                } else {
                    // İzləməyə başla
                    $stmt = $pdo->prepare("
                        INSERT INTO user_connections (user_id, followed_user_id, created_at) 
                        VALUES (?, ?, NOW())
                    ");
                    $stmt->execute([$current_user['id'], $user_id]);
                    
                    $success = htmlspecialchars($target_user['username']) . " istifadəçisini izləməyə başladınız.";
                    
                    // Bildiriş göndər
                    sendNotification(
                        $user_id, 
                        'follow', 
                        'Yeni izləyici', 
                        $current_user['username'] . ' sizi izləməyə başladı.',
                        [
                            'follower_id' => $current_user['id'],
                            'follower_username' => $current_user['username'],
                            'follower_avatar' => $current_user['avatar'] ?? ''
                        ]
                    );
                }
            }
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
}

// İzlədiyim istifadəçilər
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.full_name, u.city, u.avatar, u.profile_status, 
           (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'active') as item_count
    FROM user_connections uc
    JOIN users u ON uc.followed_user_id = u.id
    WHERE uc.user_id = ?
    ORDER BY uc.created_at DESC
");
$stmt->execute([$current_user['id']]);
$following = $stmt->fetchAll();

// Məni izləyən istifadəçilər
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.full_name, u.city, u.avatar, u.profile_status,
           (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'active') as item_count,
           (SELECT COUNT(*) FROM user_connections WHERE user_id = ? AND followed_user_id = u.id) as is_following
    FROM user_connections uc
    JOIN users u ON uc.user_id = u.id
    WHERE uc.followed_user_id = ?
    ORDER BY uc.created_at DESC
");
$stmt->execute([$current_user['id'], $current_user['id']]);
$followers = $stmt->fetchAll();

// Tövsiyə edilən istifadəçilər
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.full_name, u.city, u.avatar, u.profile_status,
           (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'active') as item_count,
           (SELECT COUNT(*) FROM user_connections WHERE user_id = ? AND followed_user_id = u.id) as is_following
    FROM users u
    LEFT JOIN user_connections uc ON u.id = uc.followed_user_id AND uc.user_id = ?
    WHERE u.id != ? 
      AND uc.id IS NULL
      AND u.active = 1
      AND (
          -- Eyni şəhərdəki istifadəçilər
          (u.city IS NOT NULL AND u.city = ?) OR
          -- Oxşar maraqları olan istifadəçilər
          EXISTS (
              SELECT 1 FROM 
              JSON_TABLE(u.interests, '$[*]' COLUMNS(interest_id INT PATH '$')) as ui
              JOIN JSON_TABLE((SELECT interests FROM users WHERE id = ?), '$[*]' COLUMNS(interest_id INT PATH '$')) as mi
              ON ui.interest_id = mi.interest_id
          ) OR
          -- Ziyarət etdiyim elanların sahibləri
          EXISTS (
              SELECT 1 FROM item_visits v
              JOIN items i ON v.item_id = i.id
              WHERE v.user_id = ? AND i.user_id = u.id
          )
      )
    ORDER BY RAND()
    LIMIT 10
");
$stmt->execute([
    $current_user['id'], 
    $current_user['id'], 
    $current_user['id'], 
    $current_user['city'] ?? '', 
    $current_user['id'],
    $current_user['id']
]);
$recommended_users = $stmt->fetchAll();

// Fəaliyyət axını - izlədiyin istifadəçilərin aktivlikləri
$stmt = $pdo->prepare("
    SELECT 
        ua.id as activity_id,
        ua.activity_type,
        ua.activity_data,
        ua.created_at,
        u.id as user_id,
        u.username,
        u.full_name,
        u.avatar
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.user_id IN (
        SELECT followed_user_id FROM user_connections WHERE user_id = ?
    )
    OR ua.user_id = ?
    ORDER BY ua.created_at DESC
    LIMIT 20
");
$stmt->execute([$current_user['id'], $current_user['id']]);
$activity_feed = $stmt->fetchAll();

// Kəşf et - platforma üzrə məşhur istifadəçilər və elanlar
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.full_name, u.city, u.avatar, u.profile_status,
           COUNT(uc.id) as follower_count,
           (SELECT COUNT(*) FROM items WHERE user_id = u.id AND status = 'active') as item_count,
           (SELECT COUNT(*) FROM user_connections WHERE user_id = ? AND followed_user_id = u.id) as is_following
    FROM users u
    LEFT JOIN user_connections uc ON u.id = uc.followed_user_id
    WHERE u.id != ? AND u.active = 1
    GROUP BY u.id
    ORDER BY follower_count DESC, item_count DESC
    LIMIT 15
");
$stmt->execute([$current_user['id'], $current_user['id']]);
$popular_users = $stmt->fetchAll();

// Trend olan elanlar
$stmt = $pdo->prepare("
    SELECT 
        i.id, i.title, i.status, i.created_at,
        c.name as category_name, c.display_name as category_display_name, c.icon as category_icon,
        u.id as user_id, u.username, u.avatar,
        (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image,
        (SELECT COUNT(*) FROM item_visits WHERE item_id = i.id) as visit_count,
        (SELECT COUNT(*) FROM favorites WHERE item_id = i.id) as favorite_count,
        (SELECT COUNT(*) FROM offers WHERE wanted_item_id = i.id OR offered_item_id = i.id) as offer_count
    FROM items i
    JOIN users u ON i.user_id = u.id
    JOIN categories c ON i.category_id = c.id
    WHERE i.status = 'active'
    ORDER BY (visit_count * 0.4 + favorite_count * 0.3 + offer_count * 0.3) DESC, i.created_at DESC
    LIMIT 6
");
$stmt->execute();
$trending_items = $stmt->fetchAll();

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Səhifə başlığı -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Sosial Şəbəkə</h1>
            <p class="text-gray-600">İstifadəçilərlə əlaqə saxlayın və barter imkanlarını genişləndirin</p>
        </div>
        
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
        
        <!-- Tablar -->
        <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8">
                <a 
                    href="?tab=connections" 
                    class="<?php echo $active_tab === 'connections' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?> whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
                >
                    <i class="fas fa-users mr-1"></i> Əlaqələr
                </a>
                <a 
                    href="?tab=recommendations" 
                    class="<?php echo $active_tab === 'recommendations' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?> whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
                >
                    <i class="fas fa-user-plus mr-1"></i> Tövsiyələr
                </a>
                <a 
                    href="?tab=activity" 
                    class="<?php echo $active_tab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?> whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
                >
                    <i class="fas fa-rss mr-1"></i> Aktivlik axını
                </a>
                <a 
                    href="?tab=discover" 
                    class="<?php echo $active_tab === 'discover' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'; ?> whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
                >
                    <i class="fas fa-compass mr-1"></i> Kəşf et
                </a>
            </nav>
        </div>
        
        <!-- Əlaqələr tab -->
        <?php if ($active_tab === 'connections'): ?>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- İzlədiyim istifadəçilər -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">
                            <i class="fas fa-user-check text-primary mr-2"></i> 
                            İzlədiyim istifadəçilər <span class="text-gray-500 text-sm">(<?php echo count($following); ?>)</span>
                        </h2>
                    </div>
                    
                    <div>
                        <?php if (empty($following)): ?>
                            <div class="p-6 text-center">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-user-friends text-gray-400 text-xl"></i>
                                </div>
                                <h3 class="text-lg font-medium text-gray-900 mb-1">Hələ heç kimi izləmirsiniz</h3>
                                <p class="text-gray-600 mb-4">
                                    Maraqlı hesabları izləmək üçün "Tövsiyələr" bölməsinə baxın.
                                </p>
                                <a href="?tab=recommendations" class="text-primary hover:text-primary-700">
                                    <i class="fas fa-user-plus mr-1"></i> Tövsiyə edilən istifadəçilərə baxın
                                </a>
                            </div>
                        <?php else: ?>
                            <div class="divide-y divide-gray-100">
                                <?php foreach ($following as $user): ?>
                                    <div class="p-4 hover:bg-gray-50 transition-colors">
                                        <div class="flex items-start">
                                            <a href="profile.php?id=<?php echo $user['id']; ?>" class="flex-shrink-0 mr-3">
                                                <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    <?php if (!empty($user['avatar'])): ?>
                                                        <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                                             alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                                             class="w-full h-full object-cover">
                                                    <?php else: ?>
                                                        <i class="fas fa-user text-gray-400"></i>
                                                    <?php endif; ?>
                                                </div>
                                            </a>
                                            
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center mb-1">
                                                    <a href="profile.php?id=<?php echo $user['id']; ?>" class="text-gray-900 font-medium hover:underline">
                                                        <?php echo htmlspecialchars($user['username']); ?>
                                                    </a>
                                                    
                                                    <?php if ($user['profile_status'] === 'busy'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Məşğul</span>
                                                    <?php elseif ($user['profile_status'] === 'away'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">Qeyri-aktiv</span>
                                                    <?php elseif ($user['profile_status'] === 'active'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Aktiv</span>
                                                    <?php endif; ?>
                                                </div>
                                                
                                                <?php if (!empty($user['full_name'])): ?>
                                                    <p class="text-sm text-gray-600 truncate max-w-[250px]">
                                                        <?php echo htmlspecialchars($user['full_name']); ?>
                                                    </p>
                                                <?php endif; ?>
                                                
                                                <div class="flex items-center mt-2 text-xs text-gray-500">
                                                    <?php if (!empty($user['city'])): ?>
                                                        <span class="flex items-center mr-2">
                                                            <i class="fas fa-map-marker-alt mr-1"></i>
                                                            <?php echo htmlspecialchars($user['city']); ?>
                                                        </span>
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($user['item_count'] > 0): ?>
                                                        <span class="flex items-center">
                                                            <i class="fas fa-box-open mr-1"></i>
                                                            <?php echo $user['item_count']; ?> elan
                                                        </span>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                            
                                            <div class="ml-2 flex flex-col space-y-2">
                                                <form method="POST" action="">
                                                    <?php echo csrf_field(); ?>
                                                    <input type="hidden" name="action" value="toggle_follow">
                                                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                    
                                                    <button 
                                                        type="submit" 
                                                        class="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <i class="fas fa-user-times mr-1"></i> İzləməyi dayandır
                                                    </button>
                                                </form>
                                                
                                                <a 
                                                    href="messages.php?user=<?php echo $user['id']; ?>" 
                                                    class="px-3 py-1 border border-primary rounded text-sm text-primary hover:bg-primary hover:text-white transition-colors text-center"
                                                >
                                                    <i class="fas fa-comment mr-1"></i> Mesaj göndər
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Məni izləyən istifadəçilər -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">
                            <i class="fas fa-users text-primary mr-2"></i> 
                            Məni izləyən istifadəçilər <span class="text-gray-500 text-sm">(<?php echo count($followers); ?>)</span>
                        </h2>
                    </div>
                    
                    <div>
                        <?php if (empty($followers)): ?>
                            <div class="p-6 text-center">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-user-friends text-gray-400 text-xl"></i>
                                </div>
                                <h3 class="text-lg font-medium text-gray-900 mb-1">Hələ izləyicilər yoxdur</h3>
                                <p class="text-gray-600">
                                    Hesabınızı daha çox izləyici cəlb etmək üçün daha çox elan paylaşın və sosial funksiyalardan istifadə edin.
                                </p>
                            </div>
                        <?php else: ?>
                            <div class="divide-y divide-gray-100">
                                <?php foreach ($followers as $user): ?>
                                    <div class="p-4 hover:bg-gray-50 transition-colors">
                                        <div class="flex items-start">
                                            <a href="profile.php?id=<?php echo $user['id']; ?>" class="flex-shrink-0 mr-3">
                                                <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    <?php if (!empty($user['avatar'])): ?>
                                                        <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                                             alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                                             class="w-full h-full object-cover">
                                                    <?php else: ?>
                                                        <i class="fas fa-user text-gray-400"></i>
                                                    <?php endif; ?>
                                                </div>
                                            </a>
                                            
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center mb-1">
                                                    <a href="profile.php?id=<?php echo $user['id']; ?>" class="text-gray-900 font-medium hover:underline">
                                                        <?php echo htmlspecialchars($user['username']); ?>
                                                    </a>
                                                    
                                                    <?php if ($user['profile_status'] === 'busy'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Məşğul</span>
                                                    <?php elseif ($user['profile_status'] === 'away'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">Qeyri-aktiv</span>
                                                    <?php elseif ($user['profile_status'] === 'active'): ?>
                                                        <span class="ml-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Aktiv</span>
                                                    <?php endif; ?>
                                                </div>
                                                
                                                <?php if (!empty($user['full_name'])): ?>
                                                    <p class="text-sm text-gray-600 truncate max-w-[250px]">
                                                        <?php echo htmlspecialchars($user['full_name']); ?>
                                                    </p>
                                                <?php endif; ?>
                                                
                                                <div class="flex items-center mt-2 text-xs text-gray-500">
                                                    <?php if (!empty($user['city'])): ?>
                                                        <span class="flex items-center mr-2">
                                                            <i class="fas fa-map-marker-alt mr-1"></i>
                                                            <?php echo htmlspecialchars($user['city']); ?>
                                                        </span>
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($user['item_count'] > 0): ?>
                                                        <span class="flex items-center">
                                                            <i class="fas fa-box-open mr-1"></i>
                                                            <?php echo $user['item_count']; ?> elan
                                                        </span>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                            
                                            <div class="ml-2 flex flex-col space-y-2">
                                                <?php if ($user['is_following']): ?>
                                                    <form method="POST" action="">
                                                        <?php echo csrf_field(); ?>
                                                        <input type="hidden" name="action" value="toggle_follow">
                                                        <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                        
                                                        <button 
                                                            type="submit" 
                                                            class="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <i class="fas fa-user-times mr-1"></i> İzləməyi dayandır
                                                        </button>
                                                    </form>
                                                <?php else: ?>
                                                    <form method="POST" action="">
                                                        <?php echo csrf_field(); ?>
                                                        <input type="hidden" name="action" value="toggle_follow">
                                                        <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                        
                                                        <button 
                                                            type="submit" 
                                                            class="px-3 py-1 border border-primary rounded text-sm text-primary hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            <i class="fas fa-user-plus mr-1"></i> İzlə
                                                        </button>
                                                    </form>
                                                <?php endif; ?>
                                                
                                                <a 
                                                    href="messages.php?user=<?php echo $user['id']; ?>" 
                                                    class="px-3 py-1 border border-primary rounded text-sm text-primary hover:bg-primary hover:text-white transition-colors text-center"
                                                >
                                                    <i class="fas fa-comment mr-1"></i> Mesaj göndər
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        
        <!-- Tövsiyələr tab -->
        <?php elseif ($active_tab === 'recommendations'): ?>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="font-semibold text-gray-900">
                        <i class="fas fa-user-plus text-primary mr-2"></i> Tövsiyə edilən istifadəçilər
                    </h2>
                </div>
                
                <div>
                    <?php if (empty($recommended_users)): ?>
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-users text-gray-400 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-1">Tövsiyələr hazır deyil</h3>
                            <p class="text-gray-600">
                                Daha çox funksionaldan istifadə etdikcə sizə uyğun tövsiyələr göstəriləcək.
                            </p>
                        </div>
                    <?php else: ?>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-gray-100">
                            <?php foreach ($recommended_users as $user): ?>
                                <div class="p-4 hover:bg-gray-50 transition-colors">
                                    <div class="flex items-start">
                                        <a href="profile.php?id=<?php echo $user['id']; ?>" class="flex-shrink-0 mr-3">
                                            <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                <?php if (!empty($user['avatar'])): ?>
                                                    <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                                         alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                                         class="w-full h-full object-cover">
                                                <?php else: ?>
                                                    <i class="fas fa-user text-gray-400"></i>
                                                <?php endif; ?>
                                            </div>
                                        </a>
                                        
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center mb-1">
                                                <a href="profile.php?id=<?php echo $user['id']; ?>" class="text-gray-900 font-medium hover:underline">
                                                    <?php echo htmlspecialchars($user['username']); ?>
                                                </a>
                                            </div>
                                            
                                            <?php if (!empty($user['full_name'])): ?>
                                                <p class="text-sm text-gray-600 truncate max-w-[200px]">
                                                    <?php echo htmlspecialchars($user['full_name']); ?>
                                                </p>
                                            <?php endif; ?>
                                            
                                            <div class="flex items-center mt-2 text-xs text-gray-500">
                                                <?php if (!empty($user['city'])): ?>
                                                    <span class="flex items-center mr-2">
                                                        <i class="fas fa-map-marker-alt mr-1"></i>
                                                        <?php echo htmlspecialchars($user['city']); ?>
                                                    </span>
                                                <?php endif; ?>
                                                
                                                <?php if ($user['item_count'] > 0): ?>
                                                    <span class="flex items-center">
                                                        <i class="fas fa-box-open mr-1"></i>
                                                        <?php echo $user['item_count']; ?> elan
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            
                                            <div class="mt-3 flex space-x-2">
                                                <?php if ($user['is_following']): ?>
                                                    <form method="POST" action="" class="flex-1">
                                                        <?php echo csrf_field(); ?>
                                                        <input type="hidden" name="action" value="toggle_follow">
                                                        <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                        
                                                        <button 
                                                            type="submit" 
                                                            class="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <i class="fas fa-user-check mr-1"></i> İzləyirsiniz
                                                        </button>
                                                    </form>
                                                <?php else: ?>
                                                    <form method="POST" action="" class="flex-1">
                                                        <?php echo csrf_field(); ?>
                                                        <input type="hidden" name="action" value="toggle_follow">
                                                        <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                        
                                                        <button 
                                                            type="submit" 
                                                            class="w-full px-2 py-1 border border-primary rounded text-sm text-primary hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            <i class="fas fa-user-plus mr-1"></i> İzlə
                                                        </button>
                                                    </form>
                                                <?php endif; ?>
                                                
                                                <a 
                                                    href="profile.php?id=<?php echo $user['id']; ?>" 
                                                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors text-center"
                                                >
                                                    <i class="fas fa-eye mr-1"></i> Profil
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="font-semibold text-gray-900">
                        <i class="fas fa-search text-primary mr-2"></i> Daha çox insan tapın
                    </h2>
                </div>
                
                <div class="p-6">
                    <div class="max-w-lg mx-auto">
                        <form action="search.php" method="GET" class="flex">
                            <input type="hidden" name="type" value="users">
                            <input 
                                type="text" 
                                name="q" 
                                placeholder="İstifadəçi adı, şəhər və ya maraq axtar..." 
                                class="flex-1 border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                            <button 
                                type="submit" 
                                class="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-700 transition-colors"
                            >
                                <i class="fas fa-search"></i>
                            </button>
                        </form>
                        
                        <div class="mt-4 text-center">
                            <p class="text-sm text-gray-600">
                                Dostlarınızı dəvət etmək üçün sosial şəbəkələrdə platformanı paylaşın.
                            </p>
                            
                            <div class="mt-3 flex justify-center space-x-3">
                                <a href="javascript:void(0)" onclick="shareOnFacebook()" class="text-blue-600 hover:text-blue-800 transition-colors">
                                    <i class="fab fa-facebook-square text-2xl"></i>
                                </a>
                                <a href="javascript:void(0)" onclick="shareOnTwitter()" class="text-blue-400 hover:text-blue-600 transition-colors">
                                    <i class="fab fa-twitter-square text-2xl"></i>
                                </a>
                                <a href="javascript:void(0)" onclick="shareOnWhatsapp()" class="text-green-600 hover:text-green-800 transition-colors">
                                    <i class="fab fa-whatsapp-square text-2xl"></i>
                                </a>
                                <a href="javascript:void(0)" onclick="shareOnTelegram()" class="text-blue-500 hover:text-blue-700 transition-colors">
                                    <i class="fab fa-telegram text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        <!-- Aktivlik axını tab -->
        <?php elseif ($active_tab === 'activity'): ?>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-4 border-b border-gray-200">
                            <h2 class="font-semibold text-gray-900">
                                <i class="fas fa-rss text-primary mr-2"></i> Aktivlik axını
                            </h2>
                        </div>
                        
                        <div>
                            <?php if (empty($activity_feed)): ?>
                                <div class="p-6 text-center">
                                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-rss text-gray-400 text-xl"></i>
                                    </div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-1">Aktivlik axını boşdur</h3>
                                    <p class="text-gray-600 mb-4">
                                        İzlədiyiniz istifadəçilər aktiv olduqca burda aktivliklərini görəcəksiniz.
                                    </p>
                                    <a href="?tab=recommendations" class="text-primary hover:text-primary-700">
                                        <i class="fas fa-user-plus mr-1"></i> Yeni istifadəçiləri izləyin
                                    </a>
                                </div>
                            <?php else: ?>
                                <div class="divide-y divide-gray-100">
                                    <?php foreach ($activity_feed as $activity): ?>
                                        <?php
                                        // Aktivlik növünü təyin et
                                        $activity_data = json_decode($activity['activity_data'], true);
                                        $is_own_activity = $activity['user_id'] === $current_user['id'];
                                        ?>
                                        
                                        <div class="p-4 hover:bg-gray-50 transition-colors">
                                            <div class="flex">
                                                <a href="profile.php?id=<?php echo $activity['user_id']; ?>" class="flex-shrink-0 mr-3">
                                                    <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        <?php if (!empty($activity['avatar'])): ?>
                                                            <img src="<?php echo htmlspecialchars($activity['avatar']); ?>" 
                                                                 alt="<?php echo htmlspecialchars($activity['username']); ?>" 
                                                                 class="w-full h-full object-cover">
                                                        <?php else: ?>
                                                            <i class="fas fa-user text-gray-400"></i>
                                                        <?php endif; ?>
                                                    </div>
                                                </a>
                                                
                                                <div class="flex-1">
                                                    <div class="flex items-start mb-1">
                                                        <a href="profile.php?id=<?php echo $activity['user_id']; ?>" class="text-gray-900 font-medium hover:underline">
                                                            <?php echo $is_own_activity ? 'Siz' : htmlspecialchars($activity['username']); ?>
                                                        </a>
                                                        
                                                        <span class="text-gray-500 mx-1">•</span>
                                                        
                                                        <span class="text-gray-500 text-sm">
                                                            <?php echo timeAgo($activity['created_at']); ?>
                                                        </span>
                                                    </div>
                                                    
                                                    <div class="text-gray-600 text-sm">
                                                        <?php if ($activity['activity_type'] === 'new_item'): ?>
                                                            <?php echo $is_own_activity ? 'Yeni bir elan əlavə etdiniz:' : 'Yeni bir elan əlavə etdi:'; ?>
                                                            <a href="item.php?id=<?php echo $activity_data['item_id']; ?>" class="text-primary hover:underline">
                                                                <?php echo htmlspecialchars($activity_data['item_title']); ?>
                                                            </a>
                                                            
                                                            <?php if (!empty($activity_data['item_image'])): ?>
                                                                <div class="mt-2 relative w-full max-w-xs">
                                                                    <a href="item.php?id=<?php echo $activity_data['item_id']; ?>">
                                                                        <img 
                                                                            src="<?php echo htmlspecialchars($activity_data['item_image']); ?>" 
                                                                            alt="<?php echo htmlspecialchars($activity_data['item_title']); ?>" 
                                                                            class="rounded-md border border-gray-200 max-h-48 object-cover"
                                                                        >
                                                                    </a>
                                                                </div>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'completed_barter'): ?>
                                                            <?php echo $is_own_activity ? 'Bir barter tamamladınız' : 'Bir barter tamamladı'; ?>
                                                            <?php if (!empty($activity_data['offer_id'])): ?>
                                                                <a href="offer.php?id=<?php echo $activity_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                    <?php echo $is_own_activity ? 'barterin detallarına baxın' : 'barterin detallarına baxın'; ?>
                                                                </a>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'follow'): ?>
                                                            <?php echo $is_own_activity ? 'Bir istifadəçini izləməyə başladınız' : 'Sizi izləməyə başladı'; ?>
                                                            <?php if (!empty($activity_data['followed_id']) && !$is_own_activity): ?>
                                                                <a href="profile.php?id=<?php echo $activity_data['followed_id']; ?>" class="text-primary hover:underline">
                                                                    profili ziyarət edin
                                                                </a>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'favorite_added'): ?>
                                                            <?php echo $is_own_activity ? 'Bir elanı favoritlərə əlavə etdiniz:' : 'Bir elanı favoritlərə əlavə etdi:'; ?>
                                                            <?php if (!empty($activity_data['item_id'])): ?>
                                                                <a href="item.php?id=<?php echo $activity_data['item_id']; ?>" class="text-primary hover:underline">
                                                                    <?php echo htmlspecialchars($activity_data['item_title'] ?? 'elana baxın'); ?>
                                                                </a>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'offer_sent'): ?>
                                                            <?php echo $is_own_activity ? 'Bir barter təklifi göndərdiniz' : 'Bir barter təklifi göndərdi'; ?>
                                                            <?php if (!empty($activity_data['offer_id'])): ?>
                                                                <a href="offer.php?id=<?php echo $activity_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                    təklif detallarına baxın
                                                                </a>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'offer_accepted'): ?>
                                                            <?php echo $is_own_activity ? 'Bir barter təklifini qəbul etdiniz' : 'Bir barter təklifini qəbul etdi'; ?>
                                                            <?php if (!empty($activity_data['offer_id'])): ?>
                                                                <a href="offer.php?id=<?php echo $activity_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                    barter detallarına baxın
                                                                </a>
                                                            <?php endif; ?>
                                                            
                                                        <?php elseif ($activity['activity_type'] === 'profile_updated'): ?>
                                                            <?php echo $is_own_activity ? 'Profil məlumatlarınızı yenilədiniz' : 'Profil məlumatlarını yenilədi'; ?>
                                                            <a href="profile.php?id=<?php echo $activity['user_id']; ?>" class="text-primary hover:underline">
                                                                profilə baxın
                                                            </a>
                                                            
                                                        <?php else: ?>
                                                            <?php echo htmlspecialchars($activity['activity_type']); ?>
                                                        <?php endif; ?>
                                                    </div>
                                                    
                                                    <?php if (!$is_own_activity): ?>
                                                        <div class="mt-2 text-sm">
                                                            <a 
                                                                href="profile.php?id=<?php echo $activity['user_id']; ?>" 
                                                                class="text-primary hover:text-primary-700 mr-2"
                                                            >
                                                                <i class="fas fa-user mr-1"></i> Profil
                                                            </a>
                                                            
                                                            <a 
                                                                href="messages.php?user=<?php echo $activity['user_id']; ?>" 
                                                                class="text-primary hover:text-primary-700"
                                                            >
                                                                <i class="fas fa-comment mr-1"></i> Mesaj göndər
                                                            </a>
                                                        </div>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <div>
                    <!-- Son aktivliyiniz -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div class="p-4 border-b border-gray-200">
                            <h2 class="font-semibold text-gray-900">
                                <i class="fas fa-history text-primary mr-2"></i> Son aktivliyiniz
                            </h2>
                        </div>
                        
                        <div class="p-4">
                            <?php
                            // İstifadəçinin öz aktivliklərini əldə et
                            $stmt = $pdo->prepare("
                                SELECT activity_type, activity_data, created_at
                                FROM user_activities
                                WHERE user_id = ?
                                ORDER BY created_at DESC
                                LIMIT 5
                            ");
                            $stmt->execute([$current_user['id']]);
                            $own_activities = $stmt->fetchAll();
                            ?>
                            
                            <?php if (empty($own_activities)): ?>
                                <div class="text-center py-4">
                                    <p class="text-gray-600">
                                        Hələ heç bir aktivliyiniz yoxdur.
                                    </p>
                                </div>
                            <?php else: ?>
                                <div class="space-y-3">
                                    <?php foreach ($own_activities as $act): ?>
                                        <?php
                                        $act_data = json_decode($act['activity_data'], true);
                                        ?>
                                        <div class="flex items-start">
                                            <?php if ($act['activity_type'] === 'new_item'): ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <i class="fas fa-plus text-green-600"></i>
                                                </div>
                                            <?php elseif ($act['activity_type'] === 'completed_barter'): ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <i class="fas fa-handshake text-blue-600"></i>
                                                </div>
                                            <?php elseif ($act['activity_type'] === 'follow'): ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <i class="fas fa-user-plus text-purple-600"></i>
                                                </div>
                                            <?php elseif ($act['activity_type'] === 'favorite_added'): ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                    <i class="fas fa-star text-yellow-600"></i>
                                                </div>
                                            <?php elseif ($act['activity_type'] === 'offer_sent' || $act['activity_type'] === 'offer_accepted'): ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <i class="fas fa-exchange-alt text-primary"></i>
                                                </div>
                                            <?php else: ?>
                                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <i class="fas fa-info-circle text-gray-600"></i>
                                                </div>
                                            <?php endif; ?>
                                            
                                            <div class="ml-3 flex-1">
                                                <div class="text-sm text-gray-600">
                                                    <?php if ($act['activity_type'] === 'new_item'): ?>
                                                        <span class="font-medium">Yeni elan:</span> 
                                                        <a href="item.php?id=<?php echo $act_data['item_id']; ?>" class="text-primary hover:underline">
                                                            <?php echo htmlspecialchars($act_data['item_title']); ?>
                                                        </a>
                                                    <?php elseif ($act['activity_type'] === 'completed_barter'): ?>
                                                        <span class="font-medium">Barter tamamlandı</span>
                                                        <?php if (!empty($act_data['offer_id'])): ?>
                                                            <a href="offer.php?id=<?php echo $act_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                detallar
                                                            </a>
                                                        <?php endif; ?>
                                                    <?php elseif ($act['activity_type'] === 'follow'): ?>
                                                        <span class="font-medium">İzləməyə başladınız:</span>
                                                        <?php if (!empty($act_data['followed_username'])): ?>
                                                            <a href="profile.php?id=<?php echo $act_data['followed_id']; ?>" class="text-primary hover:underline">
                                                                <?php echo htmlspecialchars($act_data['followed_username']); ?>
                                                            </a>
                                                        <?php endif; ?>
                                                    <?php elseif ($act['activity_type'] === 'favorite_added'): ?>
                                                        <span class="font-medium">Favorit əlavə edildi:</span>
                                                        <a href="item.php?id=<?php echo $act_data['item_id']; ?>" class="text-primary hover:underline">
                                                            <?php echo htmlspecialchars($act_data['item_title'] ?? 'elan'); ?>
                                                        </a>
                                                    <?php elseif ($act['activity_type'] === 'offer_sent'): ?>
                                                        <span class="font-medium">Təklif göndərildi</span>
                                                        <?php if (!empty($act_data['offer_id'])): ?>
                                                            <a href="offer.php?id=<?php echo $act_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                detallar
                                                            </a>
                                                        <?php endif; ?>
                                                    <?php elseif ($act['activity_type'] === 'offer_accepted'): ?>
                                                        <span class="font-medium">Təklif qəbul edildi</span>
                                                        <?php if (!empty($act_data['offer_id'])): ?>
                                                            <a href="offer.php?id=<?php echo $act_data['offer_id']; ?>" class="text-primary hover:underline">
                                                                detallar
                                                            </a>
                                                        <?php endif; ?>
                                                    <?php elseif ($act['activity_type'] === 'profile_updated'): ?>
                                                        <span class="font-medium">Profil yeniləndi</span>
                                                    <?php else: ?>
                                                        <?php echo htmlspecialchars($act['activity_type']); ?>
                                                    <?php endif; ?>
                                                </div>
                                                
                                                <div class="text-xs text-gray-500 mt-1">
                                                    <?php echo timeAgo($act['created_at']); ?>
                                                </div>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    
                    <!-- İzləyicilərin aktivliyi -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-4 border-b border-gray-200">
                            <h2 class="font-semibold text-gray-900">
                                <i class="fas fa-chart-line text-primary mr-2"></i> Aktivlik Statistikası
                            </h2>
                        </div>
                        
                        <div class="p-4">
                            <?php
                            // Aktivlik statistikası
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as total_activities FROM user_activities WHERE user_id = ?
                            ");
                            $stmt->execute([$current_user['id']]);
                            $total_activities = $stmt->fetchColumn();
                            
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as follower_count FROM user_connections WHERE followed_user_id = ?
                            ");
                            $stmt->execute([$current_user['id']]);
                            $follower_count = $stmt->fetchColumn();
                            
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as following_count FROM user_connections WHERE user_id = ?
                            ");
                            $stmt->execute([$current_user['id']]);
                            $following_count = $stmt->fetchColumn();
                            
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as total_items FROM items WHERE user_id = ?
                            ");
                            $stmt->execute([$current_user['id']]);
                            $total_items = $stmt->fetchColumn();
                            
                            $stmt = $pdo->prepare("
                                SELECT COUNT(*) as total_barters FROM offers 
                                WHERE (sender_id = ? OR recipient_id = ?) AND status = 'completed'
                            ");
                            $stmt->execute([$current_user['id'], $current_user['id']]);
                            $total_barters = $stmt->fetchColumn();
                            ?>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-gray-50 rounded-md p-3 text-center">
                                    <div class="text-xl font-semibold text-gray-900">
                                        <?php echo $follower_count; ?>
                                    </div>
                                    <div class="text-sm text-gray-600">İzləyicilər</div>
                                </div>
                                
                                <div class="bg-gray-50 rounded-md p-3 text-center">
                                    <div class="text-xl font-semibold text-gray-900">
                                        <?php echo $following_count; ?>
                                    </div>
                                    <div class="text-sm text-gray-600">İzlədiyim</div>
                                </div>
                                
                                <div class="bg-gray-50 rounded-md p-3 text-center">
                                    <div class="text-xl font-semibold text-gray-900">
                                        <?php echo $total_items; ?>
                                    </div>
                                    <div class="text-sm text-gray-600">Elanlar</div>
                                </div>
                                
                                <div class="bg-gray-50 rounded-md p-3 text-center">
                                    <div class="text-xl font-semibold text-gray-900">
                                        <?php echo $total_barters; ?>
                                    </div>
                                    <div class="text-sm text-gray-600">Tamamlanmış barterlər</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        
        <!-- Kəşf et tab -->
        <?php elseif ($active_tab === 'discover'): ?>
            <div class="mb-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">
                            <i class="fas fa-fire text-primary mr-2"></i> Trend olan elanlar
                        </h2>
                    </div>
                    
                    <div class="p-4">
                        <?php if (empty($trending_items)): ?>
                            <div class="text-center py-6">
                                <div class="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gray-100">
                                    <i class="fas fa-chart-line text-gray-400 text-xl"></i>
                                </div>
                                <h3 class="mt-3 text-lg font-medium text-gray-900">Trend elanlar hazır deyil</h3>
                                <p class="mt-1 text-gray-500">Platform aktivliyi artdıqca trend elanlar göstəriləcək.</p>
                            </div>
                        <?php else: ?>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <?php foreach ($trending_items as $item): ?>
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
                                                
                                                <div class="absolute top-2 right-2">
                                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <i class="fas fa-fire mr-1"></i> Trend
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div class="p-4">
                                                <h3 class="font-medium text-gray-900 truncate">
                                                    <?php echo htmlspecialchars($item['title']); ?>
                                                </h3>
                                                
                                                <div class="flex items-center mt-2 text-sm text-gray-600">
                                                    <div class="flex items-center">
                                                        <i class="<?php echo $item['category_icon']; ?> mr-1 text-xs"></i>
                                                        <span class="truncate"><?php echo htmlspecialchars($item['category_display_name']); ?></span>
                                                    </div>
                                                    
                                                    <span class="mx-2 text-gray-300">•</span>
                                                    
                                                    <div class="flex items-center">
                                                        <i class="fas fa-user mr-1 text-xs"></i>
                                                        <span class="truncate"><?php echo htmlspecialchars($item['username']); ?></span>
                                                    </div>
                                                </div>
                                                
                                                <div class="flex items-center mt-2 text-xs text-gray-500">
                                                    <span class="flex items-center mr-2">
                                                        <i class="fas fa-eye mr-1"></i>
                                                        <?php echo $item['visit_count']; ?>
                                                    </span>
                                                    
                                                    <span class="flex items-center mr-2">
                                                        <i class="fas fa-star mr-1"></i>
                                                        <?php echo $item['favorite_count']; ?>
                                                    </span>
                                                    
                                                    <span class="flex items-center">
                                                        <i class="fas fa-exchange-alt mr-1"></i>
                                                        <?php echo $item['offer_count']; ?>
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            
                            <div class="mt-4 text-center">
                                <a href="search.php?sort=trending" class="text-primary hover:text-primary-700">
                                    <i class="fas fa-fire mr-1"></i> Bütün trend elanları göstər
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="font-semibold text-gray-900">
                        <i class="fas fa-users text-primary mr-2"></i> Məşhur istifadəçilər
                    </h2>
                </div>
                
                <div class="p-4">
                    <?php if (empty($popular_users)): ?>
                        <div class="text-center py-6">
                            <div class="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gray-100">
                                <i class="fas fa-users text-gray-400 text-xl"></i>
                            </div>
                            <h3 class="mt-3 text-lg font-medium text-gray-900">Məşhur istifadəçilər hazır deyil</h3>
                            <p class="mt-1 text-gray-500">Platform aktivliyi artdıqca məşhur istifadəçilər göstəriləcək.</p>
                        </div>
                    <?php else: ?>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <?php foreach ($popular_users as $user): ?>
                                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow text-center p-4">
                                    <a href="profile.php?id=<?php echo $user['id']; ?>" class="block">
                                        <div class="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-3">
                                            <?php if (!empty($user['avatar'])): ?>
                                                <img src="<?php echo htmlspecialchars($user['avatar']); ?>" 
                                                     alt="<?php echo htmlspecialchars($user['username']); ?>" 
                                                     class="w-full h-full object-cover">
                                            <?php else: ?>
                                                <i class="fas fa-user text-gray-400 text-xl"></i>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <h3 class="font-medium text-gray-900 truncate">
                                            <?php echo htmlspecialchars($user['username']); ?>
                                        </h3>
                                        
                                        <?php if (!empty($user['full_name'])): ?>
                                            <p class="text-sm text-gray-600 truncate mt-1">
                                                <?php echo htmlspecialchars($user['full_name']); ?>
                                            </p>
                                        <?php endif; ?>
                                        
                                        <div class="flex items-center justify-center mt-2 text-xs text-gray-500">
                                            <span class="flex items-center">
                                                <i class="fas fa-users mr-1"></i>
                                                <?php echo $user['follower_count']; ?> izləyici
                                            </span>
                                        </div>
                                    </a>
                                    
                                    <div class="mt-3">
                                        <?php if ($user['is_following']): ?>
                                            <form method="POST" action="">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="toggle_follow">
                                                <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                
                                                <button 
                                                    type="submit" 
                                                    class="w-full px-3 py-1 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    <i class="fas fa-user-check mr-1"></i> İzləyirsiniz
                                                </button>
                                            </form>
                                        <?php else: ?>
                                            <form method="POST" action="">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="toggle_follow">
                                                <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                
                                                <button 
                                                    type="submit" 
                                                    class="w-full px-3 py-1 border border-primary rounded text-xs text-primary hover:bg-primary hover:text-white transition-colors"
                                                >
                                                    <i class="fas fa-user-plus mr-1"></i> İzlə
                                                </button>
                                            </form>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</main>

<script>
// Sosial paylaşım funksiyaları
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('BarterTap.az - Azərbaycanda ilk barter platforması');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('BarterTap.az - Azərbaycanda ilk barter platforması! Əşyalarınızı dəyişdirin, yeni insanlarla tanış olun!');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
}

function shareOnWhatsapp() {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('BarterTap.az - Azərbaycanda ilk barter platforması! Əşyalarınızı dəyişdirin, yeni insanlarla tanış olun!');
    window.open(`https://wa.me/?text=${title} ${url}`, '_blank');
}

function shareOnTelegram() {
    const url = encodeURIComponent(window.location.origin);
    const title = encodeURIComponent('BarterTap.az - Azərbaycanda ilk barter platforması! Əşyalarınızı dəyişdirin, yeni insanlarla tanış olun!');
    window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank');
}
</script>

<?php
require_once 'includes/footer.php';
?>