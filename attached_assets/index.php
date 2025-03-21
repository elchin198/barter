<?php
// Ana səhifə
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "BarterTap.az | Alqı-satqı deyil, barter üçün Azərbaycan platforması";
$page_description = "Azərbaycanda ilk onlayn barter platforması. Əşya satmağa deyil, dəyişməyə gəlin!";

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Ən son əlavə edilmiş elanları əldə et
$recent_items = getRecentItems($pdo, 8);

// Ən çox baxılan elanları əldə et
$popular_items = getPopularItems($pdo, 4);

// Bütün kateqoriyaları əldə et
$categories = getCategoriesWithCounts($pdo, true);

require_once 'includes/header.php';
?>

<main class="flex-1">
  <!-- Hero Bölməsi -->
  <section class="bg-gradient-to-b from-primary-50 to-white py-12 lg:py-20">
    <div class="container mx-auto px-4">
      <div class="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
        <!-- Sol tərəfdəki mətn -->
        <div class="lg:w-1/2">
          <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Alqı-satqı deyil, <span class="text-primary">barter</span> edin!
          </h1>
          <p class="text-lg text-gray-700 mb-8">
            BarterTap.az - Azərbaycanda ilk onlayn barter platforması! Əşyalarınızı pulsuz yerləşdirin və 
            istədiyiniz əşyalarla dəyişin. Puldan daha dəyərli olan - <strong>əşyaların dəyişməsi</strong> imkanıdır.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4">
            <?php if (isLoggedIn()): ?>
              <a href="create-item.php" class="bg-primary hover:bg-primary-700 text-white text-lg font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
                <i class="fas fa-plus-circle mr-2"></i> Elan yerləşdir
              </a>
              <a href="search.php" class="bg-white hover:bg-gray-50 text-primary border border-primary text-lg font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
                <i class="fas fa-search mr-2"></i> Elanları göstər
              </a>
            <?php else: ?>
              <a href="register.php" class="bg-primary hover:bg-primary-700 text-white text-lg font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
                <i class="fas fa-user-plus mr-2"></i> Qeydiyyatdan keç
              </a>
              <a href="search.php" class="bg-white hover:bg-gray-50 text-primary border border-primary text-lg font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all">
                <i class="fas fa-search mr-2"></i> Elanları göstər
              </a>
            <?php endif; ?>
          </div>
        </div>
        
        <!-- Sağ tərəfdəki şəkil -->
        <div class="lg:w-1/2">
          <div class="relative">
            <img 
              src="assets/images/hero-image.svg" 
              alt="BarterTap.az - Əşyaları dəyişməyin ən asan yolu" 
              class="w-full h-auto rounded-lg shadow-lg"
              onerror="this.onerror=null; this.src='assets/images/hero-placeholder.jpg';"
            >
            <div class="absolute -bottom-5 -right-5 bg-white p-4 rounded-lg shadow-lg animate-bounce hidden lg:block">
              <div class="text-primary font-bold">100% Ödənişsiz</div>
              <div class="text-sm text-gray-600">Əsas funksiyalar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Üstünlüklər Bölməsi -->
  <section class="py-12 bg-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Niyə BarterTap <span class="text-primary">fərqlidir?</span></h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Üstünlük 1 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <i class="fas fa-handshake text-primary text-2xl"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">Tam Ödənişsiz</h3>
          <p class="text-gray-600">Əsas funksiyalardan tam pulsuz istifadə edə bilərsiniz: elan yerləşdirmək, axtarmaq və barter etmək.</p>
        </div>
        
        <!-- Üstünlük 2 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <i class="fas fa-recycle text-primary text-2xl"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">Ekoloji Təmiz</h3>
          <p class="text-gray-600">İstifadə etmədiyiniz əşyaları atmaqdansa, barter etməklə ətraf mühitə töhfə vermiş olursunuz.</p>
        </div>
        
        <!-- Üstünlük 3 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <i class="fas fa-users text-primary text-2xl"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">Canlı İcma</h3>
          <p class="text-gray-600">Minlərlə istifadəçi ilə birgə inteqrasiya edərək sosial barter şəbəkəsinin parçası olun.</p>
        </div>
        
        <!-- Üstünlük 4 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <i class="fas fa-shield-alt text-primary text-2xl"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">Təhlükəsiz Barter</h3>
          <p class="text-gray-600">İstifadəçi reytinqləri, hesab doğrulaması və təhlükəsiz mesajlaşma ilə qorunma.</p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Son Elanlar Bölməsi -->
  <section class="py-12 bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Son əlavə edilən <span class="text-primary">elanlar</span></h2>
        
        <a href="search.php" class="text-primary hover:text-primary-700 font-medium flex items-center">
          Bütün elanları göstər <i class="fas fa-arrow-right ml-2"></i>
        </a>
      </div>
      
      <?php if (count($recent_items) > 0): ?>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <?php foreach ($recent_items as $item): ?>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                <div class="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img 
                    src="<?php echo $item['main_image'] ? htmlspecialchars($item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                    alt="<?php echo htmlspecialchars($item['title']); ?>" 
                    class="object-cover w-full h-48"
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
        
        <div class="text-center mt-8">
          <a href="search.php" class="bg-white hover:bg-gray-50 text-primary border border-primary px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors">
            <i class="fas fa-search mr-2"></i> Daha çox elana bax
          </a>
        </div>
      <?php else: ?>
        <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
          <i class="fas fa-box-open text-gray-300 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Hal-hazırda heç bir elan yoxdur</h3>
          <p class="text-gray-600 mb-6 max-w-lg mx-auto">
            Hal-hazırda sistem üzərində heç bir aktiv elan mövcud deyil. Siz ilk elanı yerləşdirə bilərsiniz!
          </p>
          <?php if (isLoggedIn()): ?>
            <a href="create-item.php" class="bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium">
              <i class="fas fa-plus-circle mr-2"></i> İlk elanı yerləşdir
            </a>
          <?php else: ?>
            <a href="register.php" class="bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium">
              <i class="fas fa-user-plus mr-2"></i> Qeydiyyatdan keç
            </a>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </section>
  
  <!-- Kateqoriyalar Bölməsi -->
  <section class="py-12 bg-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Əsas <span class="text-primary">kateqoriyalar</span></h2>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <?php foreach ($categories as $category): ?>
          <a 
            href="category.php?id=<?php echo $category['id']; ?>" 
            class="flex flex-col items-center p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary hover:shadow-md transition-all text-center"
          >
            <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
              <i class="<?php echo htmlspecialchars($category['icon']); ?> text-xl" style="color: <?php echo htmlspecialchars($category['color'] ?? '#367BF5'); ?>;"></i>
            </div>
            <h3 class="font-medium text-gray-900 mb-1"><?php echo htmlspecialchars($category['display_name']); ?></h3>
            <span class="text-xs text-gray-500"><?php echo $category['item_count']; ?> elan</span>
          </a>
        <?php endforeach; ?>
      </div>
    </div>
  </section>
  
  <!-- Populyar Elanlar Bölməsi -->
  <?php if (count($popular_items) > 0): ?>
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Populyar <span class="text-primary">elanlar</span></h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <?php foreach ($popular_items as $item): ?>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                <div class="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                  <img 
                    src="<?php echo $item['main_image'] ? htmlspecialchars($item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                    alt="<?php echo htmlspecialchars($item['title']); ?>" 
                    class="object-cover w-full h-48"
                  >
                  <div class="absolute top-2 right-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    <i class="fas fa-fire"></i> Populyar
                  </div>
                </div>
                <div class="p-4">
                  <div class="flex items-start justify-between mb-1">
                    <h3 class="font-medium text-gray-900 truncate"><?php echo htmlspecialchars($item['title']); ?></h3>
                    <div class="flex items-center text-gray-500 text-sm">
                      <i class="fas fa-eye mr-1"></i>
                      <span><?php echo $item['views']; ?></span>
                    </div>
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
                      <?php if ($item['has_price'] && $item['price']): ?>
                        <span class="text-primary font-medium"><?php echo formatPrice($item['price']); ?></span>
                      <?php endif; ?>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </section>
  <?php endif; ?>
  
  <!-- Barteri necə etmək? Bölməsi -->
  <section class="py-12 bg-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Barteri <span class="text-primary">necə etməli?</span></h2>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Addım 1 -->
        <div class="text-center">
          <div class="relative mb-4">
            <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">1</div>
            <div class="absolute top-1/2 left-1/2 w-full h-1 bg-primary-100 transform -translate-y-1/2 -z-0 md:left-full md:w-full"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Qeydiyyatdan keç</h3>
          <p class="text-gray-600">Qeydiyyatdan keçin və ya hesabınıza daxil olun ki, elanlar yerləşdirə biləsiniz.</p>
        </div>
        
        <!-- Addım 2 -->
        <div class="text-center">
          <div class="relative mb-4">
            <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">2</div>
            <div class="absolute top-1/2 left-1/2 w-full h-1 bg-primary-100 transform -translate-y-1/2 -z-0 md:left-full md:w-full"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Elan yerləşdir</h3>
          <p class="text-gray-600">Əşyanızı şəkillərlə və ətraflı təsviri ilə elan yerləşdirin. Nə istədiyinizi qeyd edin.</p>
        </div>
        
        <!-- Addım 3 -->
        <div class="text-center">
          <div class="relative mb-4">
            <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">3</div>
            <div class="absolute top-1/2 left-1/2 w-full h-1 bg-primary-100 transform -translate-y-1/2 -z-0 md:left-full md:w-full"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Təklif al və ya göndər</h3>
          <p class="text-gray-600">İstədiyiniz əşyalara təklif göndərin və ya təklifləri qəbul edin.</p>
        </div>
        
        <!-- Addım 4 -->
        <div class="text-center">
          <div class="relative mb-4">
            <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">4</div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Əşyaları dəyiş</h3>
          <p class="text-gray-600">Razılaşmadan sonra əşyaları dəyişin və sonra barteri tamamlanmış kimi işarələyin.</p>
        </div>
      </div>
      
      <div class="text-center mt-12">
        <a href="how-it-works.php" class="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors">
          <i class="fas fa-info-circle mr-2"></i> Ətraflı məlumat
        </a>
      </div>
    </div>
  </section>
  
  <!-- Statistika Bölməsi -->
  <section class="py-12 bg-primary-50">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">BarterTap <span class="text-primary">rəqəmlərlə</span></h2>
      
      <?php
      // Statistika üçün məlumatları əldə et
      $item_count = $pdo->query("SELECT COUNT(*) FROM items WHERE status = 'active'")->fetchColumn();
      $user_count = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
      $completed_count = $pdo->query("SELECT COUNT(*) FROM items WHERE status = 'completed'")->fetchColumn();
      $categories_count = $pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
      ?>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div class="text-4xl font-bold text-primary mb-2"><?php echo number_format($item_count); ?></div>
          <div class="text-gray-600">Aktiv elan</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div class="text-4xl font-bold text-primary mb-2"><?php echo number_format($user_count); ?></div>
          <div class="text-gray-600">İstifadəçi</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div class="text-4xl font-bold text-primary mb-2"><?php echo number_format($completed_count); ?></div>
          <div class="text-gray-600">Tamamlanmış barter</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div class="text-4xl font-bold text-primary mb-2"><?php echo number_format($categories_count); ?></div>
          <div class="text-gray-600">Kateqoriya</div>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Çağırış Bölməsi (CTA) -->
  <section class="py-12 bg-gradient-to-r from-primary to-primary-700 text-white">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-3xl font-bold mb-6">Alqı-satqı yox, barter et!</h2>
      <p class="text-lg mb-8 max-w-xl mx-auto">
        İstifadə etmədiyiniz əşyaları yerləşdirin və lazım olan əşyaları pulsuz əldə edin. Elan yerləşdirmək tamamilə ödənişsizdir!
      </p>
      
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <?php if (isLoggedIn()): ?>
          <a href="create-item.php" class="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium shadow-md">
            <i class="fas fa-plus-circle mr-2"></i> Elan yerləşdir
          </a>
        <?php else: ?>
          <a href="register.php" class="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium shadow-md">
            <i class="fas fa-user-plus mr-2"></i> İndi qeydiyyatdan keç
          </a>
        <?php endif; ?>
        
        <a href="search.php" class="bg-transparent text-white border border-white hover:bg-white hover:text-primary px-6 py-3 rounded-lg font-medium">
          <i class="fas fa-search mr-2"></i> Elanları göstər
        </a>
      </div>
    </div>
  </section>
</main>

<?php
require_once 'includes/footer.php';
?>