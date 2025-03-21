<?php
// Kateqoriya səhifəsi
require_once 'includes/config.php';

// Kateqoriya slug-ı və ya ID-sini əldə et
$category_slug = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : '';
$category_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Kateqoriyanı əldə et (slug və ya ID ilə)
if (!empty($category_slug)) {
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ?");
    $stmt->execute([$category_slug]);
    $category = $stmt->fetch();
} elseif ($category_id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$category_id]);
    $category = $stmt->fetch();
} else {
    setErrorMessage("Düzgün kateqoriya ID-si və ya slug-ı göstərilməyib.");
    header("Location: index.php");
    exit;
}

// Kateqoriya mövcud deyilsə
if (!$category) {
    setErrorMessage("Bu kateqoriya mövcud deyil.");
    header("Location: index.php");
    exit;
}

// Bütün kateqoriyaları əldə edin (alt menyular üçün)
$stmt = $pdo->query("SELECT * FROM categories ORDER BY display_name ASC");
$all_categories = $stmt->fetchAll();

// Səhifə başlığı və açıqlaması
$page_title = $category['display_name'] . " Elanları";
$page_description = $category['display_name'] . " kateqoriyasındakı aktual barter elanları.";

// Səhifələmə parametrləri
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = 16; // Səhifə başına elan sayı
$offset = ($page - 1) * $per_page;

// Sıralama
$sort = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'newest';

// Sıralama sorğusu əlavə et
$order_sql = "i.created_at DESC"; // Default sıralama
switch ($sort) {
    case 'oldest':
        $order_sql = "i.created_at ASC";
        break;
    case 'price_low':
        $order_sql = "i.has_price DESC, i.price ASC, i.created_at DESC";
        break;
    case 'price_high':
        $order_sql = "i.has_price DESC, i.price DESC, i.created_at DESC";
        break;
    case 'views':
        $order_sql = "i.views DESC, i.created_at DESC";
        break;
}

// Kateqoriyaya aid elanları əldə et
$sql = "
    SELECT i.*, 
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image,
           u.username as owner_username,
           u.avatar as owner_avatar
    FROM items i
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.category_id = ? AND i.status = 'active'
    ORDER BY $order_sql
    LIMIT ? OFFSET ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$category['id'], $per_page, $offset]);
$items = $stmt->fetchAll();

// Ümumi elan sayı
$stmt = $pdo->prepare("SELECT COUNT(*) FROM items WHERE category_id = ? AND status = 'active'");
$stmt->execute([$category['id']]);
$total_items = $stmt->fetchColumn();

// Səhifələmə
$total_pages = ceil($total_items / $per_page);
$page = max(1, min($page, $total_pages));

// Alt kateqoriyaları əldə et (əgər varsa)
$stmt = $pdo->prepare("SELECT * FROM categories WHERE parent_id = ?");
$stmt->execute([$category['id']]);
$subcategories = $stmt->fetchAll();

// Kateqoriya statistikası
$stmt = $pdo->prepare("
    SELECT COUNT(*) as item_count, 
           COUNT(DISTINCT user_id) as user_count,
           MAX(created_at) as latest_item
    FROM items 
    WHERE category_id = ? AND status = 'active'
");
$stmt->execute([$category['id']]);
$stats = $stmt->fetch();

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-8">
  <div class="container mx-auto px-4">
    <!-- Kateqoriya Başlığı -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex items-center">
          <div class="w-12 h-12 flex items-center justify-center rounded-full mr-4" style="background-color: <?php echo htmlspecialchars($category['color'] ?? '#367BF5'); ?>20">
            <i class="<?php echo htmlspecialchars($category['icon']); ?> text-xl" style="color: <?php echo htmlspecialchars($category['color'] ?? '#367BF5'); ?>"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900"><?php echo htmlspecialchars($category['display_name']); ?></h1>
            <nav class="text-sm breadcrumbs">
              <ol class="flex items-center space-x-1">
                <li><a href="index.php" class="text-gray-500 hover:text-primary">Ana səhifə</a></li>
                <li><span class="text-gray-500">/</span></li>
                <li><span class="text-gray-700"><?php echo htmlspecialchars($category['display_name']); ?></span></li>
              </ol>
            </nav>
          </div>
        </div>
        
        <div class="text-sm text-gray-600 flex flex-wrap gap-4">
          <div class="flex items-center">
            <i class="fas fa-box-open text-gray-400 mr-1"></i>
            <span><?php echo number_format($stats['item_count']); ?> elan</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-users text-gray-400 mr-1"></i>
            <span><?php echo number_format($stats['user_count']); ?> istifadəçi</span>
          </div>
          <?php if (!empty($stats['latest_item'])): ?>
            <div class="flex items-center">
              <i class="fas fa-clock text-gray-400 mr-1"></i>
              <span>Son elan: <?php echo timeAgo($stats['latest_item']); ?></span>
            </div>
          <?php endif; ?>
        </div>
      </div>
      
      <?php if ($category['description']): ?>
        <div class="mt-4 text-gray-700">
          <?php echo nl2br(htmlspecialchars($category['description'])); ?>
        </div>
      <?php endif; ?>
      
      <!-- Alt kateqoriyalar (əgər varsa) -->
      <?php if (count($subcategories) > 0): ?>
        <div class="mt-6 pt-4 border-t">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Alt kateqoriyalar</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <?php foreach ($subcategories as $sub): ?>
              <a href="category.php?id=<?php echo $sub['id']; ?>" class="flex items-center p-2 rounded hover:bg-gray-100 transition-colors">
                <i class="<?php echo htmlspecialchars($sub['icon']); ?> mr-2" style="color: <?php echo htmlspecialchars($sub['color']); ?>"></i>
                <span><?php echo htmlspecialchars($sub['display_name']); ?></span>
              </a>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endif; ?>
    </div>
    
    <!-- Kateqoriya məzmunu: Elanlar və filtr -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Filtr bölməsi -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Axtarış və Filtrlər</h2>
          
          <!-- Axtarış forması -->
          <form method="GET" action="search.php" class="space-y-4">
            <input type="hidden" name="category_id" value="<?php echo $category['id']; ?>">
            
            <div>
              <label for="query" class="block text-sm font-medium text-gray-700 mb-1">Axtarış</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="query" 
                  name="query" 
                  class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Bu kateqoriyada axtar..."
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <i class="fas fa-search mr-1"></i> Axtar
            </button>
          </form>
          
          <!-- Ətraflı filtrlər linki -->
          <div class="mt-4 text-center">
            <a href="search.php?category_id=<?php echo $category['id']; ?>" class="text-primary hover:underline text-sm">
              Ətraflı filtrlər <i class="fas fa-sliders-h ml-1"></i>
            </a>
          </div>
          
          <!-- Digər kateqoriyalar -->
          <div class="mt-6 pt-4 border-t">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Digər kateqoriyalar</h3>
            <div class="space-y-1 max-h-60 overflow-y-auto pr-2">
              <?php foreach ($all_categories as $cat): ?>
                <?php if ($cat['id'] != $category['id']): ?>
                  <a 
                    href="category.php?id=<?php echo $cat['id']; ?>" 
                    class="flex items-center p-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <i class="<?php echo htmlspecialchars($cat['icon']); ?> mr-2 text-gray-500"></i>
                    <span class="text-gray-700"><?php echo htmlspecialchars($cat['display_name']); ?></span>
                  </a>
                <?php endif; ?>
              <?php endforeach; ?>
            </div>
          </div>
          
          <!-- Elan əlavə etmə linki -->
          <div class="mt-6 pt-4 border-t">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Elan yerləşdirmək istəyirsiniz?</h3>
            <p class="text-sm text-gray-600 mb-3">
              Sizin də bu kateqoriyada dəyişmək istədiyiniz bir əşyanız var?
            </p>
            <?php if (isLoggedIn()): ?>
              <a 
                href="create-item.php?category_id=<?php echo $category['id']; ?>" 
                class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors block text-center"
              >
                <i class="fas fa-plus mr-1"></i> Yeni elan yarat
              </a>
            <?php else: ?>
              <a 
                href="login.php?redirect=<?php echo urlencode('create-item.php?category_id=' . $category['id']); ?>" 
                class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors block text-center"
              >
                <i class="fas fa-plus mr-1"></i> Yeni elan yarat
              </a>
            <?php endif; ?>
          </div>
        </div>
      </div>
      
      <!-- Elanlar bölməsi -->
      <div class="lg:col-span-3">
        <!-- Sıralama paneli -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-gray-900">
              <?php echo htmlspecialchars($category['display_name']); ?> elanları
              <span class="text-gray-600">(<?php echo $total_items; ?>)</span>
            </h2>
            
            <div class="flex items-center">
              <label for="sort" class="text-sm text-gray-700 mr-2">Sıralama:</label>
              <select 
                id="sort" 
                class="border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                onchange="window.location.href = '?id=<?php echo $category['id']; ?>&sort=' + this.value + '<?php echo $page > 1 ? '&page=' . $page : ''; ?>'"
              >
                <option value="newest" <?php echo ($sort === 'newest') ? 'selected' : ''; ?>>Ən yeni</option>
                <option value="oldest" <?php echo ($sort === 'oldest') ? 'selected' : ''; ?>>Ən köhnə</option>
                <option value="price_low" <?php echo ($sort === 'price_low') ? 'selected' : ''; ?>>Qiymət (aşağıdan yuxarı)</option>
                <option value="price_high" <?php echo ($sort === 'price_high') ? 'selected' : ''; ?>>Qiymət (yuxarıdan aşağı)</option>
                <option value="views" <?php echo ($sort === 'views') ? 'selected' : ''; ?>>Populyarlıq</option>
              </select>
            </div>
          </div>
        </div>
        
        <?php if (count($items) > 0): ?>
          <!-- Elanlar Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <?php foreach ($items as $item): ?>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                  <div class="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img 
                      src="<?php echo $item['main_image'] ? htmlspecialchars($item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                      alt="<?php echo htmlspecialchars($item['title']); ?>" 
                      class="object-cover w-full h-40"
                    >
                  </div>
                  <div class="p-4">
                    <div class="flex items-start justify-between mb-1">
                      <h3 class="font-medium text-gray-900 truncate"><?php echo htmlspecialchars($item['title']); ?></h3>
                      <?php if ($item['has_price'] && $item['price']): ?>
                        <span class="text-primary font-medium"><?php echo formatPrice($item['price']); ?></span>
                      <?php endif; ?>
                    </div>
                    <div class="text-sm text-gray-600">
                      <?php if($item['location']): ?>
                        <div class="flex items-center mb-1">
                          <i class="fas fa-map-marker-alt mr-1 text-xs"></i>
                          <span class="truncate"><?php echo htmlspecialchars($item['location']); ?></span>
                        </div>
                      <?php endif; ?>
                      <div class="flex items-center justify-between">
                        <span class="flex items-center">
                          <i class="fas fa-clock mr-1 text-xs"></i>
                          <span><?php echo timeAgo($item['created_at']); ?></span>
                        </span>
                        <span class="flex items-center text-gray-500">
                          <i class="fas fa-eye mr-1 text-xs"></i>
                          <span><?php echo $item['views']; ?></span>
                        </span>
                      </div>
                      <div class="flex items-center mt-2 pt-2 border-t border-gray-100">
                        <img 
                          src="<?php echo $item['owner_avatar'] ? htmlspecialchars($item['owner_avatar']) : 'uploads/avatars/default.png'; ?>" 
                          alt="<?php echo htmlspecialchars($item['owner_username']); ?>" 
                          class="w-5 h-5 rounded-full mr-1"
                        >
                        <span class="text-xs text-gray-500 truncate">
                          <?php echo htmlspecialchars($item['owner_username']); ?>
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            <?php endforeach; ?>
          </div>
          
          <!-- Səhifələmə -->
          <?php if ($total_pages > 1): ?>
            <div class="flex justify-center bg-white rounded-lg shadow-sm border border-gray-200 py-3 px-6">
              <div class="flex space-x-1">
                <?php if ($page > 1): ?>
                  <a 
                    href="category.php?id=<?php echo $category['id']; ?>&sort=<?php echo $sort; ?>&page=<?php echo $page - 1; ?>" 
                    class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <i class="fas fa-chevron-left"></i>
                  </a>
                <?php endif; ?>
                
                <?php
                // Səhifələmə üçün nümayiş ediləcək səhifə nömrələrini hesablayın
                $start_page = max(1, $page - 2);
                $end_page = min($total_pages, $page + 2);
                
                if ($start_page > 1) {
                    echo '<a href="category.php?id=' . $category['id'] . '&sort=' . $sort . '&page=1" class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">1</a>';
                    if ($start_page > 2) {
                        echo '<span class="px-3 py-2">...</span>';
                    }
                }
                
                for ($i = $start_page; $i <= $end_page; $i++) {
                    $active_class = ($i === $page) ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50';
                    echo '<a href="category.php?id=' . $category['id'] . '&sort=' . $sort . '&page=' . $i . '" class="px-3 py-2 border ' . $active_class . ' rounded-md transition-colors">' . $i . '</a>';
                }
                
                if ($end_page < $total_pages) {
                    if ($end_page < $total_pages - 1) {
                        echo '<span class="px-3 py-2">...</span>';
                    }
                    echo '<a href="category.php?id=' . $category['id'] . '&sort=' . $sort . '&page=' . $total_pages . '" class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">' . $total_pages . '</a>';
                }
                ?>
                
                <?php if ($page < $total_pages): ?>
                  <a 
                    href="category.php?id=<?php echo $category['id']; ?>&sort=<?php echo $sort; ?>&page=<?php echo $page + 1; ?>" 
                    class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </a>
                <?php endif; ?>
              </div>
            </div>
          <?php endif; ?>
        <?php else: ?>
          <!-- Elan tapılmadı -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <i class="<?php echo htmlspecialchars($category['icon']); ?> text-gray-300 text-5xl mb-4"></i>
            <h2 class="text-xl font-bold text-gray-700 mb-2">Bu kateqoriyada elan tapılmadı</h2>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Hələki bu kateqoriyada aktiv elan yoxdur. Siz bu kateqoriyada ilk elanı yerləşdirə bilərsiniz!
            </p>
            <?php if (isLoggedIn()): ?>
              <a href="create-item.php?category_id=<?php echo $category['id']; ?>" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                <i class="fas fa-plus mr-1"></i> Yeni elan yarat
              </a>
            <?php else: ?>
              <a href="login.php?redirect=<?php echo urlencode('create-item.php?category_id=' . $category['id']); ?>" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                <i class="fas fa-plus mr-1"></i> Yeni elan yarat
              </a>
            <?php endif; ?>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>
</main>

<?php
require_once 'includes/footer.php';
?>