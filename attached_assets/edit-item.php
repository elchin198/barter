<?php
// Elan redaktə etmə səhifəsi
require_once 'includes/config.php';

// Giriş tələb olunur
requireLogin();

// Cari istifadəçini əldə et
$current_user = getCurrentUser();

// Elan ID-sini əldə et
$item_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($item_id <= 0) {
    setErrorMessage("Düzgün elan ID-si göstərilməyib.");
    header("Location: profile.php");
    exit;
}

// Elanı əldə et
$stmt = $pdo->prepare("
    SELECT * FROM items WHERE id = ?
");
$stmt->execute([$item_id]);
$item = $stmt->fetch();

// Elan mövcud deyilsə və ya istifadəçinin öz elanı deyilsə
if (!$item || $item['user_id'] != $current_user['id']) {
    setErrorMessage("Bu elanı redaktə etmək üçün icazəniz yoxdur.");
    header("Location: profile.php");
    exit;
}

// Səhifə başlığı və açıqlaması
$page_title = "Elanı Redaktə Et";
$page_description = "BarterTap.az platformasında elanınızı redaktə edin.";

// Kateqoriyaları əldə edin
$stmt = $pdo->query("SELECT * FROM categories ORDER BY display_name ASC");
$categories = $stmt->fetchAll();

// Elanın şəkillərini əldə et
$stmt = $pdo->prepare("
    SELECT * FROM images WHERE item_id = ? ORDER BY order_num ASC
");
$stmt->execute([$item_id]);
$images = $stmt->fetchAll();

// Xəta və uğur mesajları
$error = '';
$success = '';

// Elan redaktə əməliyyatı
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    // Şəkil silmə əməliyyatı
    if (isset($_POST['delete_image'])) {
        $image_id = (int)$_POST['delete_image'];
        
        // Şəkil bu item-a aiddir və istifadəçinindir?
        $stmt = $pdo->prepare("
            SELECT i.* FROM images i
            JOIN items it ON i.item_id = it.id
            WHERE i.id = ? AND it.user_id = ?
        ");
        $stmt->execute([$image_id, $current_user['id']]);
        $image = $stmt->fetch();
        
        if ($image) {
            // Əsas şəkildirsə, digər şəkli əsas şəkil kimi təyin et
            if ($image['is_main']) {
                $stmt = $pdo->prepare("
                    SELECT id FROM images 
                    WHERE item_id = ? AND id != ? 
                    ORDER BY order_num ASC
                    LIMIT 1
                ");
                $stmt->execute([$item_id, $image_id]);
                $new_main = $stmt->fetch();
                
                if ($new_main) {
                    $stmt = $pdo->prepare("
                        UPDATE images SET is_main = 1 WHERE id = ?
                    ");
                    $stmt->execute([$new_main['id']]);
                }
            }
            
            // Şəkli sistemdən sil
            if (file_exists($image['file_path'])) {
                unlink($image['file_path']);
            }
            
            // Şəkli verilənlər bazasından sil
            $stmt = $pdo->prepare("DELETE FROM images WHERE id = ?");
            $stmt->execute([$image_id]);
            
            // Sıralama nömrələrini yenidən təyin et
            $stmt = $pdo->prepare("
                SELECT id FROM images 
                WHERE item_id = ? 
                ORDER BY order_num ASC
            ");
            $stmt->execute([$item_id]);
            $remaining_images = $stmt->fetchAll();
            
            foreach ($remaining_images as $index => $img) {
                $stmt = $pdo->prepare("
                    UPDATE images SET order_num = ? WHERE id = ?
                ");
                $stmt->execute([$index, $img['id']]);
            }
            
            // Şəkilləri yenidən əldə et
            $stmt = $pdo->prepare("
                SELECT * FROM images WHERE item_id = ? ORDER BY order_num ASC
            ");
            $stmt->execute([$item_id]);
            $images = $stmt->fetchAll();
            
            $success = "Şəkil uğurla silindi.";
        } else {
            $error = "Şəkil tapılmadı və ya sizə aid deyil.";
        }
    }
    // Əsas şəkil təyin etmə əməliyyatı
    elseif (isset($_POST['set_main_image'])) {
        $image_id = (int)$_POST['set_main_image'];
        
        // Şəkil bu item-a aiddir və istifadəçinindir?
        $stmt = $pdo->prepare("
            SELECT i.* FROM images i
            JOIN items it ON i.item_id = it.id
            WHERE i.id = ? AND it.user_id = ?
        ");
        $stmt->execute([$image_id, $current_user['id']]);
        $image = $stmt->fetch();
        
        if ($image) {
            // Bütün şəkilləri qeyri-əsas et
            $stmt = $pdo->prepare("
                UPDATE images SET is_main = 0 WHERE item_id = ?
            ");
            $stmt->execute([$item_id]);
            
            // Seçilmiş şəkli əsas et
            $stmt = $pdo->prepare("
                UPDATE images SET is_main = 1 WHERE id = ?
            ");
            $stmt->execute([$image_id]);
            
            // Şəkilləri yenidən əldə et
            $stmt = $pdo->prepare("
                SELECT * FROM images WHERE item_id = ? ORDER BY order_num ASC
            ");
            $stmt->execute([$item_id]);
            $images = $stmt->fetchAll();
            
            $success = "Əsas şəkil uğurla təyin edildi.";
        } else {
            $error = "Şəkil tapılmadı və ya sizə aid deyil.";
        }
    }
    // Elan redaktə əməliyyatı
    else {
        // Form məlumatlarını yoxlayın
        $title = sanitizeInput($_POST['title']);
        $description = sanitizeInput($_POST['description']);
        $category_id = (int)$_POST['category_id'];
        $condition = sanitizeInput($_POST['condition']);
        $location = sanitizeInput($_POST['location']);
        $wanted_exchange = sanitizeInput($_POST['wanted_exchange']);
        $has_price = isset($_POST['has_price']) ? 1 : 0;
        $price = $has_price ? (float)$_POST['price'] : null;
        $status = sanitizeInput($_POST['status']);
        
        // Slug yarat (sadəcə başlıq dəyişdirilibsə)
        $slug = ($title !== $item['title']) ? createSlug($title) : $item['slug'];
        
        // Validasiyalar
        if (empty($title)) {
            $error = "Elanın başlığını daxil edin.";
        } elseif (strlen($title) < 5 || strlen($title) > 100) {
            $error = "Başlıq ən azı 5, ən çoxu 100 simvol olmalıdır.";
        } elseif (empty($description)) {
            $error = "Elanın təsvirini daxil edin.";
        } elseif (strlen($description) < 20) {
            $error = "Təsvir ən azı 20 simvol olmalıdır.";
        } elseif ($category_id <= 0) {
            $error = "Kateqoriya seçin.";
        } elseif (empty($condition)) {
            $error = "Əşyanın vəziyyətini seçin.";
        } elseif (empty($location)) {
            $error = "Əşyanın yerini daxil edin.";
        } elseif (empty($wanted_exchange)) {
            $error = "Nə ilə dəyişmək istədiyinizi qeyd edin.";
        } elseif ($has_price && ($price <= 0 || $price > 9999999)) {
            $error = "Düzgün qiymət daxil edin.";
        } else {
            try {
                // Kateqoriyanın mövcudluğunu yoxlayın
                $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
                $stmt->execute([$category_id]);
                if ($stmt->rowCount() === 0) {
                    throw new Exception("Seçilmiş kateqoriya mövcud deyil.");
                }
                
                // Elanı yeniləyin
                $stmt = $pdo->prepare("
                    UPDATE items SET 
                    title = ?, 
                    slug = ?, 
                    description = ?, 
                    category_id = ?, 
                    condition = ?, 
                    status = ?, 
                    location = ?, 
                    wanted_exchange = ?, 
                    has_price = ?, 
                    price = ?,
                    updated_at = NOW()
                    WHERE id = ? AND user_id = ?
                ");
                
                $result = $stmt->execute([
                    $title,
                    $slug,
                    $description,
                    $category_id,
                    $condition,
                    $status,
                    $location,
                    $wanted_exchange,
                    $has_price,
                    $price,
                    $item_id,
                    $current_user['id']
                ]);
                
                if (!$result) {
                    throw new Exception("Elan yeniləmə zamanı xəta baş verdi.");
                }
                
                // Yeni şəkillər əlavə edilibmi?
                if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
                    // Şəkilləri yükləyin
                    $upload_dir = 'uploads/items/' . $item_id . '/';
                    
                    // Qovluğu yaradın (əgər yoxdursa)
                    if (!file_exists($upload_dir)) {
                        mkdir($upload_dir, 0777, true);
                    }
                    
                    // İcazə verilən şəkil tipləri
                    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    $max_size = 5 * 1024 * 1024; // 5MB
                    
                    // Mövcud şəkillərin sayını və son sıra nömrəsini əldə et
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count, MAX(order_num) as max_order 
                        FROM images WHERE item_id = ?
                    ");
                    $stmt->execute([$item_id]);
                    $img_info = $stmt->fetch();
                    
                    $has_images = $img_info['count'] > 0;
                    $order = ($img_info['max_order'] !== null) ? $img_info['max_order'] + 1 : 0;
                    
                    // Şəkilləri yükləyin
                    foreach ($_FILES['images']['name'] as $key => $name) {
                        // Əgər şəkil seçilməyibsə, davam edin
                        if (empty($name)) continue;
                        
                        $tmp_name = $_FILES['images']['tmp_name'][$key];
                        $size = $_FILES['images']['size'][$key];
                        $type = $_FILES['images']['type'][$key];
                        
                        // Şəkil tipini və ölçüsünü yoxlayın
                        if (!in_array($type, $allowed_types)) {
                            continue; // Dəstəklənməyən şəkil növləri üçün davam edin
                        }
                        
                        if ($size > $max_size) {
                            continue; // Böyük şəkillər üçün davam edin
                        }
                        
                        // Fayl adını təhlükəsiz edin
                        $file_name = time() . '_' . $order . '_' . preg_replace('/[^a-zA-Z0-9\.]/', '_', $name);
                        $file_path = $upload_dir . $file_name;
                        
                        // Şəkli yükləyin
                        if (move_uploaded_file($tmp_name, $file_path)) {
                            // Şəkil məlumatlarını əlavə edin
                            $is_main = (!$has_images && $order === 0) ? 1 : 0;
                            
                            $stmt = $pdo->prepare("
                                INSERT INTO images 
                                (item_id, file_name, file_path, file_size, file_type, is_main, order_num, created_at) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                            ");
                            
                            $stmt->execute([
                                $item_id,
                                $file_name,
                                $file_path,
                                $size,
                                $type,
                                $is_main,
                                $order
                            ]);
                            
                            $order++;
                        }
                    }
                    
                    // Şəkilləri yenidən əldə et
                    $stmt = $pdo->prepare("
                        SELECT * FROM images WHERE item_id = ? ORDER BY order_num ASC
                    ");
                    $stmt->execute([$item_id]);
                    $images = $stmt->fetchAll();
                }
                
                // Elanı yenidən əldə et
                $stmt = $pdo->prepare("SELECT * FROM items WHERE id = ?");
                $stmt->execute([$item_id]);
                $item = $stmt->fetch();
                
                // Uğurlu mesaj
                $success = "Elanınız uğurla yeniləndi!";
                
            } catch (Exception $e) {
                $error = "Xəta: " . $e->getMessage();
            }
        }
    }
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-10">
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Elanı Redaktə Et</h1>
        <a href="item.php?id=<?php echo $item_id; ?>" class="text-primary hover:underline">
          <i class="fas fa-eye mr-1"></i> Elanı göstər
        </a>
      </div>
      
      <?php if ($error): ?>
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p><?php echo $error; ?></p>
        </div>
      <?php endif; ?>
      
      <?php if ($success): ?>
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p><?php echo $success; ?></p>
        </div>
      <?php endif; ?>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Əsas Məlumatlar</h2>
        
        <form method="POST" action="" enctype="multipart/form-data" class="space-y-6 validate">
          <?php echo csrf_field(); ?>
          
          <!-- Elan başlığı -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Elan başlığı <span class="text-red-500">*</span></label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required
              minlength="5"
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value="<?php echo htmlspecialchars($item['title']); ?>"
            >
            <p class="text-sm text-gray-500 mt-1">Elanınızın başlığı 5-100 simvol aralığında olmalıdır.</p>
          </div>
          
          <!-- Kateqoriya -->
          <div>
            <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">Kateqoriya <span class="text-red-500">*</span></label>
            <select 
              id="category_id" 
              name="category_id" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Kateqoriya seçin</option>
              <?php foreach ($categories as $category): ?>
                <option 
                  value="<?php echo $category['id']; ?>"
                  <?php echo ($item['category_id'] == $category['id']) ? 'selected' : ''; ?>
                >
                  <?php echo htmlspecialchars($category['display_name']); ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          
          <!-- Əşyanın vəziyyəti -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Əşyanın vəziyyəti <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="new" class="mr-2" <?php echo ($item['condition'] === 'new') ? 'checked' : ''; ?>>
                Yeni
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="like_new" class="mr-2" <?php echo ($item['condition'] === 'like_new') ? 'checked' : ''; ?>>
                Kimi yeni
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="good" class="mr-2" <?php echo ($item['condition'] === 'good') ? 'checked' : ''; ?>>
                Yaxşı
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="fair" class="mr-2" <?php echo ($item['condition'] === 'fair') ? 'checked' : ''; ?>>
                Orta
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="poor" class="mr-2" <?php echo ($item['condition'] === 'poor') ? 'checked' : ''; ?>>
                Pis
              </label>
            </div>
          </div>
          
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Elan statusu <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="status" value="active" class="mr-2" <?php echo ($item['status'] === 'active') ? 'checked' : ''; ?>>
                Aktiv
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="status" value="pending" class="mr-2" <?php echo ($item['status'] === 'pending') ? 'checked' : ''; ?>>
                Gözləmədə
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="status" value="completed" class="mr-2" <?php echo ($item['status'] === 'completed') ? 'checked' : ''; ?>>
                Tamamlandı
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="status" value="inactive" class="mr-2" <?php echo ($item['status'] === 'inactive') ? 'checked' : ''; ?>>
                Deaktiv
              </label>
            </div>
          </div>
          
          <!-- Yer -->
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Yer <span class="text-red-500">*</span></label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value="<?php echo htmlspecialchars($item['location']); ?>"
            >
          </div>
          
          <!-- Elan təsviri -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Elan təsviri <span class="text-red-500">*</span></label>
            <textarea 
              id="description" 
              name="description" 
              required
              minlength="20"
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            ><?php echo htmlspecialchars($item['description']); ?></textarea>
            <p class="text-sm text-gray-500 mt-1">Ən azı 20 simvol yazın. Nə qədər ətraflı olsa, bir o qədər yaxşı olacaq.</p>
          </div>
          
          <!-- Nə ilə dəyişmək istərdiniz -->
          <div>
            <label for="wanted_exchange" class="block text-sm font-medium text-gray-700 mb-1">Nə ilə dəyişmək istərdiniz? <span class="text-red-500">*</span></label>
            <textarea 
              id="wanted_exchange" 
              name="wanted_exchange" 
              required
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            ><?php echo htmlspecialchars($item['wanted_exchange']); ?></textarea>
            <p class="text-sm text-gray-500 mt-1">Məsələn, "Laptop ilə dəyişmək istəyirəm" və ya "SmartWatch, tablet və ya kamera ilə dəyişərəm".</p>
          </div>
          
          <!-- Qiymət -->
          <div class="space-y-3">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="has_price" 
                name="has_price" 
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                <?php echo ($item['has_price']) ? 'checked' : ''; ?>
                onchange="togglePriceField()"
              >
              <label for="has_price" class="ml-2 block text-sm text-gray-700">
                Qiymət təyin etmək istəyirəm (dəyişmək əvəzinə satmaq və ya qiymət təklif etmək istəyənlər üçün)
              </label>
            </div>
            
            <div id="price_field" class="<?php echo ($item['has_price']) ? '' : 'hidden'; ?>">
              <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Qiymət (AZN)</label>
              <div class="relative rounded-md">
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary pr-12"
                  value="<?php echo $item['price'] ? htmlspecialchars($item['price']) : ''; ?>"
                >
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span class="text-gray-500">₼</span>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1">Təklif olunan əşyanın qiyməti. Əsas fokus barter olduğu üçün heç bir qiymət təyin etməmək də olar.</p>
            </div>
          </div>
          
          <!-- Göndər düyməsi -->
          <div class="flex justify-end space-x-3">
            <a href="item.php?id=<?php echo $item_id; ?>" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Ləğv et
            </a>
            <button 
              type="submit" 
              class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Elanı yenilə
            </button>
          </div>
        </form>
      </div>
      
      <!-- Şəkillər Bölməsi -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Şəkillər</h2>
        
        <?php if (count($images) > 0): ?>
          <div class="mb-6">
            <h3 class="font-medium text-gray-700 mb-2">Mövcud şəkillər</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <?php foreach ($images as $image): ?>
                <div class="border rounded-lg overflow-hidden relative group">
                  <img 
                    src="<?php echo htmlspecialchars($image['file_path']); ?>" 
                    alt="Elan şəkli" 
                    class="w-full h-32 object-cover"
                  >
                  
                  <?php if ($image['is_main']): ?>
                    <div class="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Əsas şəkil
                    </div>
                  <?php endif; ?>
                  
                  <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <?php if (!$image['is_main']): ?>
                      <form method="POST" action="">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="set_main_image" value="<?php echo $image['id']; ?>">
                        <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors">
                          <i class="fas fa-star"></i>
                          <span class="sr-only">Əsas şəkil təyin et</span>
                        </button>
                      </form>
                    <?php endif; ?>
                    
                    <form method="POST" action="" onsubmit="return confirm('Bu şəkli silmək istədiyinizə əminsinizmi?');">
                      <?php echo csrf_field(); ?>
                      <input type="hidden" name="delete_image" value="<?php echo $image['id']; ?>">
                      <button type="submit" class="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors">
                        <i class="fas fa-trash"></i>
                        <span class="sr-only">Şəkli sil</span>
                      </button>
                    </form>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>
        
        <form method="POST" action="" enctype="multipart/form-data" class="space-y-4">
          <?php echo csrf_field(); ?>
          
          <h3 class="font-medium text-gray-700 mb-2">Yeni şəkillər əlavə et</h3>
          
          <div class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary transition-colors">
            <input type="file" id="images" name="images[]" multiple accept="image/*" class="hidden" onchange="handleImageUpload(this)">
            <label for="images" class="cursor-pointer flex flex-col items-center">
              <i class="fas fa-cloud-upload-alt text-gray-400 text-4xl mb-3"></i>
              <span class="text-gray-700 font-medium">Şəkilləri seçin və ya buraya sürükləyin</span>
              <span class="text-gray-500 text-sm mt-1">JPG, PNG və ya GIF. Maksimum 5MB</span>
            </label>
          </div>
          <div id="image_previews" class="mt-4 flex flex-wrap gap-3"></div>
          <p class="text-sm text-gray-500 mt-2">Ən yaxşı nəticələr üçün şəffaf fonda və ən azı 800x600 piksel olan şəkillər yükləyin.</p>
          
          <div class="flex justify-end">
            <button 
              type="submit" 
              class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Şəkilləri yüklə
            </button>
          </div>
        </form>
      </div>
      
      <!-- Elanı Silmə -->
      <div class="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
        <h2 class="text-xl font-bold text-red-700 mb-4">Təhlükəli Zona</h2>
        <p class="text-gray-700 mb-4">
          Elanınızı silmək istəyirsinizsə, aşağıdakı düyməyə klikləyin. Bu əməliyyat geri qaytarıla bilməz.
        </p>
        <div class="flex justify-end">
          <a 
            href="delete-item.php?id=<?php echo $item_id; ?>" 
            onclick="return confirm('Elanı silmək istədiyinizə əminsinizmi? Bu əməliyyat geri qaytarıla bilməz!')"
            class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <i class="fas fa-trash-alt mr-1"></i> Elanı sil
          </a>
        </div>
      </div>
    </div>
  </div>
</main>

<script>
  // Şəkillərin önizləməsi üçün JavaScript
  function handleImageUpload(input) {
    const previewContainer = document.getElementById('image_previews');
    previewContainer.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        if (!file.type.match('image.*')) continue;
        
        const preview = document.createElement('div');
        preview.className = 'relative border rounded-md overflow-hidden w-20 h-20';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'w-full h-full object-cover';
        img.onload = function() {
          URL.revokeObjectURL(this.src);
        };
        
        const label = document.createElement('div');
        label.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 truncate';
        label.textContent = file.name;
        
        preview.appendChild(img);
        preview.appendChild(label);
        previewContainer.appendChild(preview);
      }
    }
  }
  
  // Qiymət sahəsini göstərmək/gizlətmək
  function togglePriceField() {
    const hasPriceCheckbox = document.getElementById('has_price');
    const priceField = document.getElementById('price_field');
    
    if (hasPriceCheckbox.checked) {
      priceField.classList.remove('hidden');
      document.getElementById('price').setAttribute('required', 'required');
    } else {
      priceField.classList.add('hidden');
      document.getElementById('price').removeAttribute('required');
    }
  }
  
  // Səhifə yükləndikdə qiymət sahəsinin vəziyyətini yoxlayın
  document.addEventListener('DOMContentLoaded', function() {
    togglePriceField();
  });
</script>

<?php
require_once 'includes/footer.php';
?>