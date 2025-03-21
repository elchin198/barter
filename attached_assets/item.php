<?php
// Elan ətraflı məlumat səhifəsi
require_once 'includes/config.php';

// Elan ID-sini əldə et
$item_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($item_id <= 0) {
    setErrorMessage("Düzgün elan ID-si göstərilməyib.");
    header("Location: index.php");
    exit;
}

// Elanı əldə et
$stmt = $pdo->prepare("
    SELECT i.*, c.name as category_name, c.display_name as category_display_name, c.icon as category_icon
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = ?
");
$stmt->execute([$item_id]);
$item = $stmt->fetch();

// Elan mövcud deyilsə
if (!$item) {
    setErrorMessage("Bu elan mövcud deyil və ya silinib.");
    header("Location: index.php");
    exit;
}

// Elan sahibinin məlumatlarını əldə et
$stmt = $pdo->prepare("
    SELECT id, username, full_name, email, phone, city, avatar, rating, created_at
    FROM users
    WHERE id = ?
");
$stmt->execute([$item['user_id']]);
$owner = $stmt->fetch();

// Elanın şəkillərini əldə et
$stmt = $pdo->prepare("
    SELECT * FROM images WHERE item_id = ? ORDER BY is_main DESC, order_num ASC
");
$stmt->execute([$item_id]);
$images = $stmt->fetchAll();

// Əgər şəkil yoxdursa, placeholder şəkil əlavə edin
if (empty($images)) {
    $images[] = [
        'id' => 0,
        'file_path' => 'assets/images/placeholder.jpg',
        'is_main' => 1
    ];
}

// Əsas şəkli təyin edin
$main_image = null;
foreach ($images as $image) {
    if ($image['is_main']) {
        $main_image = $image;
        break;
    }
}

// Əgər əsas şəkil təyin edilməyibsə, birinci şəkli əsas kimi istifadə edin
if (!$main_image && !empty($images)) {
    $main_image = $images[0];
}

// Baxış sayını artırın (istifadəçi öz elanına baxırsa, artırmayın)
$is_owner = isLoggedIn() && $_SESSION['user_id'] == $item['user_id'];

if (!$is_owner && !isset($_SESSION['viewed_items'][$item_id])) {
    $stmt = $pdo->prepare("UPDATE items SET views = views + 1 WHERE id = ?");
    $stmt->execute([$item_id]);
    
    // Son 1 saat ərzində təkrar baxışları saymamaq üçün
    $_SESSION['viewed_items'][$item_id] = time();
    
    // Baxış sayını yeniləyin
    $item['views']++;
}

// Bənzər elanları əldə et
$stmt = $pdo->prepare("
    SELECT i.*, 
           c.name as category_name, 
           c.display_name as category_display_name,
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.category_id = ? AND i.id != ? AND i.status = 'active'
    ORDER BY i.created_at DESC
    LIMIT 4
");
$stmt->execute([$item['category_id'], $item_id]);
$similar_items = $stmt->fetchAll();

// Favorit vəziyyətini yoxlayın
$is_favorite = false;
if (isLoggedIn()) {
    $stmt = $pdo->prepare("
        SELECT id FROM favorites WHERE user_id = ? AND item_id = ?
    ");
    $stmt->execute([$_SESSION['user_id'], $item_id]);
    $is_favorite = $stmt->rowCount() > 0;
}

// Favorit əlavə etmə/silmə əməliyyatı
if (isLoggedIn() && isset($_POST['toggle_favorite'])) {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    if ($is_favorite) {
        // Favoritlərdən çıxarın
        $stmt = $pdo->prepare("
            DELETE FROM favorites WHERE user_id = ? AND item_id = ?
        ");
        $stmt->execute([$_SESSION['user_id'], $item_id]);
        $is_favorite = false;
    } else {
        // Favoritlərə əlavə edin
        $stmt = $pdo->prepare("
            INSERT INTO favorites (user_id, item_id, created_at)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$_SESSION['user_id'], $item_id]);
        $is_favorite = true;
    }
    
    // Yenidən yönləndirmə (AJAX istifadə edilmirsə)
    header("Location: item.php?id=" . $item_id);
    exit;
}

// Səhifə başlığı və açıqlaması
$page_title = $item['title'];
$page_description = truncateText($item['description'], 160);

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-8">
  <div class="container mx-auto px-4">
    <!-- Elan Ətraflı Məlumatları -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sol Sütun: Şəkillər və Əsas Məlumatlar -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <!-- Başlıq və Status -->
          <div class="flex items-start justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-900"><?php echo htmlspecialchars($item['title']); ?></h1>
            <span class="badge-status <?php echo $item['status']; ?>"><?php echo getStatusName($item['status']); ?></span>
          </div>
          
          <!-- Şəkillər -->
          <div class="mb-6">
            <div class="relative aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                id="mainImage" 
                src="<?php echo htmlspecialchars($main_image['file_path']); ?>" 
                alt="<?php echo htmlspecialchars($item['title']); ?>" 
                class="object-contain w-full h-full"
              >
            </div>
            
            <?php if (count($images) > 1): ?>
              <div class="grid grid-cols-5 gap-2">
                <?php foreach ($images as $index => $image): ?>
                  <div 
                    class="aspect-w-1 aspect-h-1 rounded-md overflow-hidden cursor-pointer border-2 <?php echo ($image['is_main']) ? 'border-primary' : 'border-transparent hover:border-gray-300'; ?>" 
                    onclick="changeMainImage('<?php echo htmlspecialchars($image['file_path']); ?>', this)"
                  >
                    <img 
                      src="<?php echo htmlspecialchars($image['file_path']); ?>" 
                      alt="<?php echo htmlspecialchars($item['title']); ?>" 
                      class="object-cover w-full h-full"
                    >
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
          
          <!-- Əsas məlumatlar -->
          <div class="mb-6">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <span class="text-gray-500 text-sm">Kateqoriya</span>
                <div class="flex items-center">
                  <i class="<?php echo htmlspecialchars($item['category_icon']); ?> mr-2 text-gray-600"></i>
                  <span class="font-medium"><?php echo htmlspecialchars($item['category_display_name']); ?></span>
                </div>
              </div>
              <div>
                <span class="text-gray-500 text-sm">Yerləşdirildi</span>
                <div class="font-medium"><?php echo timeAgo($item['created_at']); ?></div>
              </div>
              <div>
                <span class="text-gray-500 text-sm">Vəziyyəti</span>
                <div class="font-medium">
                  <?php
                  $condition_names = [
                      'new' => 'Yeni',
                      'like_new' => 'Kimi yeni',
                      'good' => 'Yaxşı',
                      'fair' => 'Orta',
                      'poor' => 'Pis'
                  ];
                  echo $condition_names[$item['condition']] ?? 'Naməlum';
                  ?>
                </div>
              </div>
              <div>
                <span class="text-gray-500 text-sm">Yer</span>
                <div class="flex items-center">
                  <i class="fas fa-map-marker-alt mr-2 text-gray-600"></i>
                  <span class="font-medium"><?php echo htmlspecialchars($item['location']); ?></span>
                </div>
              </div>
              <div>
                <span class="text-gray-500 text-sm">Baxış sayı</span>
                <div class="flex items-center">
                  <i class="fas fa-eye mr-2 text-gray-600"></i>
                  <span class="font-medium"><?php echo $item['views']; ?></span>
                </div>
              </div>
              <?php if ($item['has_price'] && $item['price']): ?>
                <div>
                  <span class="text-gray-500 text-sm">Qiymət</span>
                  <div class="font-medium text-primary"><?php echo formatPrice($item['price']); ?></div>
                </div>
              <?php endif; ?>
            </div>
          </div>
          
          <!-- Təsvir -->
          <div class="mb-6">
            <h2 class="text-lg font-bold text-gray-900 mb-3">Təsvir</h2>
            <div class="text-gray-700 whitespace-pre-line">
              <?php echo nl2br(htmlspecialchars($item['description'])); ?>
            </div>
          </div>
          
          <!-- Nə ilə dəyişmək istəyir -->
          <div>
            <h2 class="text-lg font-bold text-gray-900 mb-3">Nə ilə dəyişmək istəyir</h2>
            <div class="text-gray-700 whitespace-pre-line">
              <?php echo nl2br(htmlspecialchars($item['wanted_exchange'])); ?>
            </div>
          </div>
        </div>
        
        <!-- Bənzər Elanlar -->
        <?php if (count($similar_items) > 0): ?>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Bənzər Elanlar</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <?php foreach ($similar_items as $similar_item): ?>
                <div class="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <a href="item.php?id=<?php echo $similar_item['id']; ?>" class="block">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-100">
                      <img 
                        src="<?php echo $similar_item['main_image'] ? htmlspecialchars($similar_item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                        alt="<?php echo htmlspecialchars($similar_item['title']); ?>" 
                        class="object-cover w-full h-32"
                      >
                    </div>
                    <div class="p-4">
                      <h3 class="font-medium text-gray-900 truncate"><?php echo htmlspecialchars($similar_item['title']); ?></h3>
                      <div class="mt-2 text-sm text-gray-600">
                        <div><i class="fas fa-tag mr-1"></i> <?php echo htmlspecialchars($similar_item['category_display_name']); ?></div>
                        <?php if($similar_item['location']): ?>
                          <div><i class="fas fa-map-marker-alt mr-1"></i> <?php echo htmlspecialchars($similar_item['location']); ?></div>
                        <?php endif; ?>
                        <div><i class="fas fa-clock mr-1"></i> <?php echo timeAgo($similar_item['created_at']); ?></div>
                      </div>
                    </div>
                  </a>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>
      </div>
      
      <!-- Sağ Sütun: Elan Sahibi və Əlaqə -->
      <div>
        <!-- Elan Sahibi -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Elan Sahibi</h2>
          
          <div class="flex items-start space-x-4">
            <img 
              src="<?php echo $owner['avatar'] ? htmlspecialchars($owner['avatar']) : 'uploads/avatars/default.png'; ?>" 
              alt="<?php echo htmlspecialchars($owner['username']); ?>" 
              class="w-16 h-16 rounded-full"
            >
            <div>
              <h3 class="font-medium"><?php echo htmlspecialchars($owner['full_name']); ?></h3>
              <p class="text-gray-600 text-sm">@<?php echo htmlspecialchars($owner['username']); ?></p>
              
              <div class="flex items-center mt-1 text-xs text-gray-500">
                <i class="fas fa-calendar-alt mr-1"></i>
                <span>Tarixdən bəri: <?php echo formatDate($owner['created_at'], 'd.m.Y'); ?></span>
              </div>
              
              <div class="mt-3">
                <a href="profile.php?id=<?php echo $owner['id']; ?>" class="text-primary hover:underline text-sm">
                  <i class="fas fa-user mr-1"></i> Profili göstər
                </a>
              </div>
            </div>
          </div>
          
          <?php if (!$is_owner): ?>
            <div class="mt-4 pt-4 border-t">
              <a 
                href="<?php echo isLoggedIn() ? 'messages.php?user=' . $owner['id'] . '&item=' . $item_id : 'login.php?redirect=' . urlencode('messages.php?user=' . $owner['id'] . '&item=' . $item_id); ?>" 
                class="block w-full bg-primary hover:bg-primary-700 text-white text-center py-2 px-4 rounded transition-colors mb-3"
              >
                <i class="fas fa-comment mr-1"></i> Mesaj göndər
              </a>
              
              <a 
                href="<?php echo isLoggedIn() ? 'make-offer.php?item=' . $item_id : 'login.php?redirect=' . urlencode('make-offer.php?item=' . $item_id); ?>" 
                class="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded transition-colors"
              >
                <i class="fas fa-exchange-alt mr-1"></i> Təklif et
              </a>
            </div>
          <?php else: ?>
            <div class="mt-4 pt-4 border-t">
              <a 
                href="edit-item.php?id=<?php echo $item_id; ?>" 
                class="block w-full bg-primary hover:bg-primary-700 text-white text-center py-2 px-4 rounded transition-colors mb-3"
              >
                <i class="fas fa-edit mr-1"></i> Elanı redaktə et
              </a>
              
              <a 
                href="delete-item.php?id=<?php echo $item_id; ?>" 
                class="block w-full bg-red-500 hover:bg-red-600 text-white text-center py-2 px-4 rounded transition-colors"
              >
                <i class="fas fa-trash-alt mr-1"></i> Elanı sil
              </a>
            </div>
          <?php endif; ?>
        </div>
        
        <!-- Favorit və Paylaşma -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex justify-between items-center">
            <?php if (isLoggedIn() && !$is_owner): ?>
              <form method="POST" action="">
                <?php echo csrf_field(); ?>
                <input type="hidden" name="toggle_favorite" value="1">
                <button type="submit" class="flex items-center text-gray-700 hover:text-primary transition-colors">
                  <i class="<?php echo $is_favorite ? 'fas' : 'far'; ?> fa-heart text-xl mr-2 <?php echo $is_favorite ? 'text-red-500' : ''; ?>"></i>
                  <span><?php echo $is_favorite ? 'Favoritlərdən çıxar' : 'Favoritlərə əlavə et'; ?></span>
                </button>
              </form>
            <?php elseif (!isLoggedIn()): ?>
              <a href="login.php?redirect=<?php echo urlencode('item.php?id=' . $item_id); ?>" class="flex items-center text-gray-700 hover:text-primary transition-colors">
                <i class="far fa-heart text-xl mr-2"></i>
                <span>Favoritlərə əlavə et</span>
              </a>
            <?php endif; ?>
            
            <div class="flex items-center space-x-2">
              <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode($site['url'] . '/item.php?id=' . $item_id); ?>" target="_blank" class="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors">
                <i class="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com/intent/tweet?url=<?php echo urlencode($site['url'] . '/item.php?id=' . $item_id); ?>&text=<?php echo urlencode($item['title']); ?>" target="_blank" class="text-blue-400 hover:bg-blue-100 p-2 rounded-full transition-colors">
                <i class="fab fa-twitter"></i>
              </a>
              <a href="https://api.whatsapp.com/send?text=<?php echo urlencode($item['title'] . ' - ' . $site['url'] . '/item.php?id=' . $item_id); ?>" target="_blank" class="text-green-500 hover:bg-green-100 p-2 rounded-full transition-colors">
                <i class="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Elan İD və Təhlükəsizlik İpucları -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="mb-4 text-gray-600">
            <span class="text-sm">Elan ID: <?php echo $item_id; ?></span>
          </div>
          
          <div class="border-t pt-4">
            <h2 class="text-lg font-bold text-gray-900 mb-3">Təhlükəsizlik İpucları</h2>
            <ul class="text-sm text-gray-700 space-y-2">
              <li class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                <span>İctimai yerlərdə görüşün və əşyanı diqqətlə yoxlayın.</span>
              </li>
              <li class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                <span>Şübhəli təkliflərdən çəkinin, çox aşağı qiymətlərə diqqətli olun.</span>
              </li>
              <li class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                <span>Elanın doğruluğuna şübhəniz varsa, bildirin.</span>
              </li>
            </ul>
            
            <div class="mt-4">
              <a href="faq.php?open=safe-barter" class="text-primary hover:underline text-sm">
                <i class="fas fa-info-circle mr-1"></i> Daha çox məlumat
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<script>
  // Şəkil dəyişmə funksiyası
  function changeMainImage(src, element) {
    document.getElementById('mainImage').src = src;
    
    // Aktiv şəkil sınıfını əlavə edin
    const thumbnails = document.querySelectorAll('.aspect-w-1');
    thumbnails.forEach(thumb => thumb.classList.remove('border-primary'));
    thumbnails.forEach(thumb => thumb.classList.add('border-transparent', 'hover:border-gray-300'));
    
    element.classList.remove('border-transparent', 'hover:border-gray-300');
    element.classList.add('border-primary');
  }
</script>

<?php
require_once 'includes/footer.php';
?>