<?php
// Axtarış səhifəsi
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "Elan Axtarışı";
$page_description = "BarterTap.az platformasında elanları axtarın və filtirləyin.";

// Kateqoriyaları əldə edin
$stmt = $pdo->query("SELECT * FROM categories ORDER BY display_name ASC");
$categories = $stmt->fetchAll();

// Axtarış parametrləri
$query = isset($_GET['query']) ? sanitizeInput($_GET['query']) : '';
$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
$condition = isset($_GET['condition']) ? sanitizeInput($_GET['condition']) : '';
$location = isset($_GET['location']) ? sanitizeInput($_GET['location']) : '';
$min_price = isset($_GET['min_price']) && is_numeric($_GET['min_price']) ? (float)$_GET['min_price'] : null;
$max_price = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (float)$_GET['max_price'] : null;
$sort = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'newest';
$status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : 'active';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = 16; // Səhifə başına elan sayı

// Axtarış sorğusu qurun
$sql = "
    SELECT i.*, 
           c.name as category_name, 
           c.display_name as category_display_name,
           c.icon as category_icon,
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE 1=1
";

$params = [];

// Axtarış filtrləri
if (!empty($query)) {
    $sql .= " AND (i.title LIKE ? OR i.description LIKE ? OR i.wanted_exchange LIKE ?)";
    $search_term = "%" . $query . "%";
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
}

if ($category_id > 0) {
    $sql .= " AND i.category_id = ?";
    $params[] = $category_id;
}

if (!empty($condition)) {
    $sql .= " AND i.condition = ?";
    $params[] = $condition;
}

if (!empty($location)) {
    $sql .= " AND i.location LIKE ?";
    $params[] = "%" . $location . "%";
}

if (!empty($status)) {
    $sql .= " AND i.status = ?";
    $params[] = $status;
}

if ($min_price !== null) {
    $sql .= " AND i.has_price = 1 AND i.price >= ?";
    $params[] = $min_price;
}

if ($max_price !== null) {
    $sql .= " AND i.has_price = 1 AND i.price <= ?";
    $params[] = $max_price;
}

// Ümumi nəticə sayını əldə et
$count_sql = "SELECT COUNT(*) FROM (" . $sql . ") as counted";
$stmt = $pdo->prepare($count_sql);
$stmt->execute($params);
$total_items = $stmt->fetchColumn();

// Səhifələmə məlumatları
$total_pages = ceil($total_items / $per_page);
$page = max(1, min($page, $total_pages)); // Səhifə nömrəsini düzəldin
$offset = ($page - 1) * $per_page;

// Sıralama
switch ($sort) {
    case 'oldest':
        $sql .= " ORDER BY i.created_at ASC";
        break;
    case 'price_low':
        $sql .= " ORDER BY i.has_price DESC, i.price ASC, i.created_at DESC";
        break;
    case 'price_high':
        $sql .= " ORDER BY i.has_price DESC, i.price DESC, i.created_at DESC";
        break;
    case 'views':
        $sql .= " ORDER BY i.views DESC, i.created_at DESC";
        break;
    case 'newest':
    default:
        $sql .= " ORDER BY i.created_at DESC";
}

// Səhifələmə üçün LİMİT əlavə et
$sql .= " LIMIT ? OFFSET ?";
$params[] = $per_page;
$params[] = $offset;

// Axtarış nəticələrini əldə et
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();

// Populyar axtarışlar (əgər verilənlər bazasında saxlanılırsa)
$popular_searches = [
    'Telefon', 'Laptop', 'Velosiped', 'Mebel', 'Playstation', 'Xbox', 'Saat', 'Kitab', 'Geyim'
];

// Ən populyar kateqoriyalar (ilk 5)
$stmt = $pdo->query("
    SELECT c.*, COUNT(i.id) as item_count 
    FROM categories c
    LEFT JOIN items i ON c.id = i.category_id AND i.status = 'active'
    GROUP BY c.id
    ORDER BY item_count DESC
    LIMIT 6
");
$popular_categories = $stmt->fetchAll();

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-8">
  <div class="container mx-auto px-4">
    <!-- Axtarış Başlığı -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Barter Elanları Axtarışı</h1>
      <p class="text-lg text-gray-600">
        <?php if ($total_items > 0): ?>
          "<?php echo htmlspecialchars($query); ?>" üçün <?php echo $total_items; ?> elan tapıldı
        <?php elseif (!empty($query)): ?>
          "<?php echo htmlspecialchars($query); ?>" üçün heç bir elan tapılmadı
        <?php else: ?>
          Bütün aktiv elanlar
        <?php endif; ?>
      </p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Filtr Paneli -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Filtrlər</h2>
          
          <form method="GET" action="search.php" class="space-y-5">
            <!-- Axtarış sorğusu -->
            <div>
              <label for="query" class="block text-sm font-medium text-gray-700 mb-1">Axtarış sorğusu</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="query" 
                  name="query" 
                  class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  value="<?php echo htmlspecialchars($query); ?>"
                  placeholder="Nə axtarırsınız?"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
            
            <!-- Kateqoriya -->
            <div>
              <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
              <select 
                id="category_id" 
                name="category_id" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="0">Bütün kateqoriyalar</option>
                <?php foreach ($categories as $category): ?>
                  <option 
                    value="<?php echo $category['id']; ?>"
                    <?php echo ($category_id == $category['id']) ? 'selected' : ''; ?>
                  >
                    <?php echo htmlspecialchars($category['display_name']); ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </div>
            
            <!-- Əşyanın vəziyyəti -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Əşyanın vəziyyəti</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="" <?php echo ($condition === '') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Hər hansı</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="new" <?php echo ($condition === 'new') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Yeni</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="like_new" <?php echo ($condition === 'like_new') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Kimi yeni</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="good" <?php echo ($condition === 'good') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Yaxşı</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="fair" <?php echo ($condition === 'fair') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Orta</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" name="condition" value="poor" <?php echo ($condition === 'poor') ? 'checked' : ''; ?> class="text-primary focus:ring-primary">
                  <span class="ml-2 text-sm text-gray-700">Pis</span>
                </label>
              </div>
            </div>
            
            <!-- Yer -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Yer</label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value="<?php echo htmlspecialchars($location); ?>"
                placeholder="Məsələn, Bakı"
              >
            </div>
            
            <!-- Qiymət aralığı -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Qiymət aralığı</label>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <input 
                    type="number" 
                    id="min_price" 
                    name="min_price" 
                    min="0" 
                    step="1" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    value="<?php echo $min_price !== null ? htmlspecialchars($min_price) : ''; ?>"
                    placeholder="Min"
                  >
                </div>
                <div>
                  <input 
                    type="number" 
                    id="max_price" 
                    name="max_price" 
                    min="0" 
                    step="1" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    value="<?php echo $max_price !== null ? htmlspecialchars($max_price) : ''; ?>"
                    placeholder="Max"
                  >
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">Yalnız qiyməti olan elanlar göstəriləcək</p>
            </div>
            
            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                id="status" 
                name="status" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="active" <?php echo ($status === 'active') ? 'selected' : ''; ?>>Aktiv</option>
                <option value="all" <?php echo ($status === 'all') ? 'selected' : ''; ?>>Bütün</option>
                <option value="pending" <?php echo ($status === 'pending') ? 'selected' : ''; ?>>Gözləmədə</option>
                <option value="completed" <?php echo ($status === 'completed') ? 'selected' : ''; ?>>Tamamlandı</option>
              </select>
            </div>
            
            <!-- Sıralama -->
            <div>
              <label for="sort" class="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
              <select 
                id="sort" 
                name="sort" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="newest" <?php echo ($sort === 'newest') ? 'selected' : ''; ?>>Ən yeni</option>
                <option value="oldest" <?php echo ($sort === 'oldest') ? 'selected' : ''; ?>>Ən köhnə</option>
                <option value="price_low" <?php echo ($sort === 'price_low') ? 'selected' : ''; ?>>Qiymət (aşağıdan yuxarı)</option>
                <option value="price_high" <?php echo ($sort === 'price_high') ? 'selected' : ''; ?>>Qiymət (yuxarıdan aşağı)</option>
                <option value="views" <?php echo ($sort === 'views') ? 'selected' : ''; ?>>Populyarlıq</option>
              </select>
            </div>
            
            <!-- Axtarış düyməsi -->
            <div>
              <button 
                type="submit" 
                class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <i class="fas fa-search mr-1"></i> Axtar
              </button>
            </div>
            
            <!-- Filtrləri sıfırla -->
            <div class="text-center">
              <a href="search.php" class="text-primary hover:underline text-sm">
                Filtrləri sıfırla
              </a>
            </div>
          </form>
          
          <!-- Populyar axtarışlar -->
          <div class="mt-6 border-t pt-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Populyar axtarışlar</h3>
            <div class="flex flex-wrap gap-2">
              <?php foreach ($popular_searches as $search): ?>
                <a 
                  href="search.php?query=<?php echo urlencode($search); ?>" 
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full transition-colors"
                >
                  <?php echo htmlspecialchars($search); ?>
                </a>
              <?php endforeach; ?>
            </div>
          </div>
          
          <!-- Populyar kateqoriyalar -->
          <div class="mt-6 border-t pt-6">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Populyar kateqoriyalar</h3>
            <div class="space-y-2">
              <?php foreach ($popular_categories as $category): ?>
                <a 
                  href="search.php?category_id=<?php echo $category['id']; ?>" 
                  class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div class="flex items-center">
                    <i class="<?php echo htmlspecialchars($category['icon']); ?> mr-2" style="color: <?php echo htmlspecialchars($category['color']); ?>"></i>
                    <span><?php echo htmlspecialchars($category['display_name']); ?></span>
                  </div>
                  <span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    <?php echo $category['item_count']; ?>
                  </span>
                </a>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Axtarış Nəticələri -->
      <div class="lg:col-span-3">
        <?php if (count($items) > 0): ?>
          <!-- Sıralama və Status Paneli (mobil görünüş üçün) -->
          <div class="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="mobile-sort" class="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                <select 
                  id="mobile-sort" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  onchange="this.form.submit()"
                >
                  <option value="newest" <?php echo ($sort === 'newest') ? 'selected' : ''; ?>>Ən yeni</option>
                  <option value="oldest" <?php echo ($sort === 'oldest') ? 'selected' : ''; ?>>Ən köhnə</option>
                  <option value="price_low" <?php echo ($sort === 'price_low') ? 'selected' : ''; ?>>Qiymət (aşağıdan yuxarı)</option>
                  <option value="price_high" <?php echo ($sort === 'price_high') ? 'selected' : ''; ?>>Qiymət (yuxarıdan aşağı)</option>
                  <option value="views" <?php echo ($sort === 'views') ? 'selected' : ''; ?>>Populyarlıq</option>
                </select>
              </div>
              <div>
                <label for="mobile-status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  id="mobile-status" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  onchange="this.form.submit()"
                >
                  <option value="active" <?php echo ($status === 'active') ? 'selected' : ''; ?>>Aktiv</option>
                  <option value="all" <?php echo ($status === 'all') ? 'selected' : ''; ?>>Bütün</option>
                  <option value="pending" <?php echo ($status === 'pending') ? 'selected' : ''; ?>>Gözləmədə</option>
                  <option value="completed" <?php echo ($status === 'completed') ? 'selected' : ''; ?>>Tamamlandı</option>
                </select>
              </div>
            </div>
            <form id="mobile-filter-form" method="GET" action="search.php">
              <input type="hidden" name="query" value="<?php echo htmlspecialchars($query); ?>">
              <input type="hidden" name="category_id" value="<?php echo $category_id; ?>">
              <input type="hidden" name="condition" value="<?php echo htmlspecialchars($condition); ?>">
              <input type="hidden" name="location" value="<?php echo htmlspecialchars($location); ?>">
              <input type="hidden" name="min_price" value="<?php echo $min_price !== null ? htmlspecialchars($min_price) : ''; ?>">
              <input type="hidden" name="max_price" value="<?php echo $max_price !== null ? htmlspecialchars($max_price) : ''; ?>">
              <input type="hidden" id="mobile-sort-input" name="sort" value="<?php echo htmlspecialchars($sort); ?>">
              <input type="hidden" id="mobile-status-input" name="status" value="<?php echo htmlspecialchars($status); ?>">
            </form>
          </div>
          
          <!-- Nəticələr Başlığı -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-lg font-bold text-gray-900">
                  Nəticələr <span class="text-gray-600">(<?php echo $total_items; ?>)</span>
                </h2>
                <p class="text-sm text-gray-600">
                  Səhifə <?php echo $page; ?> / <?php echo $total_pages; ?>
                </p>
              </div>
              <div class="mt-2 sm:mt-0">
                <?php if (isLoggedIn()): ?>
                  <a href="create-item.php" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                    <i class="fas fa-plus mr-1"></i> Yeni elan yarat
                  </a>
                <?php else: ?>
                  <a href="login.php?redirect=<?php echo urlencode('create-item.php'); ?>" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                    <i class="fas fa-plus mr-1"></i> Yeni elan yarat
                  </a>
                <?php endif; ?>
              </div>
            </div>
          </div>
          
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
                    <?php if ($item['status'] !== 'active'): ?>
                      <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span class="text-white font-medium px-3 py-1 rounded bg-gray-800">
                          <?php echo getStatusName($item['status']); ?>
                        </span>
                      </div>
                    <?php endif; ?>
                  </div>
                  <div class="p-4">
                    <div class="flex items-start justify-between mb-1">
                      <h3 class="font-medium text-gray-900 truncate"><?php echo htmlspecialchars($item['title']); ?></h3>
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
                    </div>
                  </div>
                </a>
              </div>
            <?php endforeach; ?>
          </div>
          
          <!-- Səhifələmə -->
          <?php if ($total_pages > 1): ?>
            <div class="flex justify-center bg-white rounded-lg shadow-sm border border-gray-200 py-3 px-6">
              <div class="flex space-x-2">
                <?php if ($page > 1): ?>
                  <a 
                    href="search.php?<?php echo http_build_query(array_merge($_GET, ['page' => $page - 1])); ?>" 
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
                    echo '<a href="search.php?' . http_build_query(array_merge($_GET, ['page' => 1])) . '" class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">1</a>';
                    if ($start_page > 2) {
                        echo '<span class="px-3 py-2">...</span>';
                    }
                }
                
                for ($i = $start_page; $i <= $end_page; $i++) {
                    $active_class = ($i === $page) ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50';
                    echo '<a href="search.php?' . http_build_query(array_merge($_GET, ['page' => $i])) . '" class="px-3 py-2 border ' . $active_class . ' rounded-md transition-colors">' . $i . '</a>';
                }
                
                if ($end_page < $total_pages) {
                    if ($end_page < $total_pages - 1) {
                        echo '<span class="px-3 py-2">...</span>';
                    }
                    echo '<a href="search.php?' . http_build_query(array_merge($_GET, ['page' => $total_pages])) . '" class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">' . $total_pages . '</a>';
                }
                ?>
                
                <?php if ($page < $total_pages): ?>
                  <a 
                    href="search.php?<?php echo http_build_query(array_merge($_GET, ['page' => $page + 1])); ?>" 
                    class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </a>
                <?php endif; ?>
              </div>
            </div>
          <?php endif; ?>
          
        <?php else: ?>
          <!-- Nəticə tapılmadı -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
            <h2 class="text-xl font-bold text-gray-700 mb-2">Elan tapılmadı</h2>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Axtarış sorğunuza uyğun elan tapılmadı. Fərqli açar sözlər sınayın və ya daha geniş axtarış parametrləri istifadə edin.
            </p>
            <a href="search.php" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
              <i class="fas fa-redo mr-1"></i> Filtrləri sıfırla
            </a>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>
</main>

<script>
  // Mobil filtr formunu avtomatik təqdim etmək üçün
  document.addEventListener('DOMContentLoaded', function() {
    const mobileSort = document.getElementById('mobile-sort');
    const mobileSortInput = document.getElementById('mobile-sort-input');
    const mobileStatus = document.getElementById('mobile-status');
    const mobileStatusInput = document.getElementById('mobile-status-input');
    const mobileForm = document.getElementById('mobile-filter-form');
    
    if (mobileSort && mobileSortInput && mobileStatus && mobileStatusInput && mobileForm) {
      mobileSort.addEventListener('change', function() {
        mobileSortInput.value = this.value;
        mobileForm.submit();
      });
      
      mobileStatus.addEventListener('change', function() {
        mobileStatusInput.value = this.value;
        mobileForm.submit();
      });
    }
  });
</script>

<?php
require_once 'includes/footer.php';
?>