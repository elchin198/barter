<?php
// Elan əlavə etmə səhifəsi
require_once 'includes/config.php';

// Giriş tələb olunur
requireLogin();

// Cari istifadəçini əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Yeni Elan Yerləşdir";
$page_description = "BarterTap.az platformasında yeni barter elanınızı yerləşdirin.";

// Kateqoriyaları əldə edin
$stmt = $pdo->query("SELECT * FROM categories ORDER BY display_name ASC");
$categories = $stmt->fetchAll();

// Xəta və uğur mesajları
$error = '';
$success = '';

// Elan əlavə etmə əməliyyatı
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    // Form məlumatlarını yoxlayın
    $title = sanitizeInput($_POST['title']);
    $description = sanitizeInput($_POST['description']);
    $category_id = (int)$_POST['category_id'];
    $condition = sanitizeInput($_POST['condition']);
    $location = sanitizeInput($_POST['location']);
    $wanted_exchange = sanitizeInput($_POST['wanted_exchange']);
    $has_price = isset($_POST['has_price']) ? 1 : 0;
    $price = $has_price ? (float)$_POST['price'] : null;
    
    // Slug yaradın
    $slug = createSlug($title);
    
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
    } elseif (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
        $error = "Ən azı bir şəkil yükləyin.";
    } else {
        try {
            // Kateqoriyanın mövcudluğunu yoxlayın
            $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
            $stmt->execute([$category_id]);
            if ($stmt->rowCount() === 0) {
                throw new Exception("Seçilmiş kateqoriya mövcud deyil.");
            }
            
            // Elanı əlavə edin
            $stmt = $pdo->prepare("
                INSERT INTO items 
                (user_id, title, slug, description, category_id, condition, status, location, wanted_exchange, has_price, price, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, NOW())
            ");
            
            $result = $stmt->execute([
                $current_user['id'],
                $title,
                $slug,
                $description,
                $category_id,
                $condition,
                $location,
                $wanted_exchange,
                $has_price,
                $price
            ]);
            
            if (!$result) {
                throw new Exception("Elan əlavə edilərkən xəta baş verdi.");
            }
            
            // Yeni elanın ID-sini əldə edin
            $item_id = $pdo->lastInsertId();
            
            // Şəkilləri yükləyin
            $upload_dir = 'uploads/items/' . $item_id . '/';
            
            // Qovluğu yaradın (əgər yoxdursa)
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            // İcazə verilən şəkil tipləri
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $max_size = 5 * 1024 * 1024; // 5MB
            
            // Şəkilləri yükləyin
            $main_image_set = false;
            $order = 0;
            
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
                    $is_main = ($order === 0 && !$main_image_set) ? 1 : 0;
                    
                    if ($is_main) {
                        $main_image_set = true;
                    }
                    
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
            
            // Uğurlu mesaj
            setSuccessMessage("Elanınız uğurla yerləşdirildi!");
            
            // Elanın səhifəsinə yönləndirin
            header("Location: item.php?id=" . $item_id);
            exit;
            
        } catch (Exception $e) {
            $error = "Xəta: " . $e->getMessage();
        }
    }
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-10">
  <div class="container mx-auto px-4">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Yeni Elan Yerləşdir</h1>
      
      <?php if ($error): ?>
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p><?php echo $error; ?></p>
        </div>
      <?php endif; ?>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              value="<?php echo isset($_POST['title']) ? htmlspecialchars($_POST['title']) : ''; ?>"
              placeholder="Məsələn, iPhone 12 64GB əla vəziyyətdə"
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
                  <?php echo (isset($_POST['category_id']) && $_POST['category_id'] == $category['id']) ? 'selected' : ''; ?>
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
                <input type="radio" name="condition" value="new" class="mr-2" <?php echo (isset($_POST['condition']) && $_POST['condition'] === 'new') ? 'checked' : ''; ?>>
                Yeni
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="like_new" class="mr-2" <?php echo (isset($_POST['condition']) && $_POST['condition'] === 'like_new') ? 'checked' : ''; ?>>
                Kimi yeni
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="good" class="mr-2" <?php echo (isset($_POST['condition']) && $_POST['condition'] === 'good') ? 'checked' : ''; ?>>
                Yaxşı
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="fair" class="mr-2" <?php echo (isset($_POST['condition']) && $_POST['condition'] === 'fair') ? 'checked' : ''; ?>>
                Orta
              </label>
              <label class="border rounded-md px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50">
                <input type="radio" name="condition" value="poor" class="mr-2" <?php echo (isset($_POST['condition']) && $_POST['condition'] === 'poor') ? 'checked' : ''; ?>>
                Pis
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
              value="<?php echo isset($_POST['location']) ? htmlspecialchars($_POST['location']) : $current_user['city'] ?? ''; ?>"
              placeholder="Məsələn, Bakı, Yasamal"
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
              placeholder="Əşyanızın ətraflı təsvirini yazın. Xüsusiyyətləri, istifadə müddəti, zəmanət olub-olmadığı və s. qeyd edin."
            ><?php echo isset($_POST['description']) ? htmlspecialchars($_POST['description']) : ''; ?></textarea>
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
              placeholder="Hansı əşyalarla dəyişmək istədiyinizi qeyd edin. Konkret və ya ümumi ola bilər."
            ><?php echo isset($_POST['wanted_exchange']) ? htmlspecialchars($_POST['wanted_exchange']) : ''; ?></textarea>
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
                <?php echo (isset($_POST['has_price'])) ? 'checked' : ''; ?>
                onchange="togglePriceField()"
              >
              <label for="has_price" class="ml-2 block text-sm text-gray-700">
                Qiymət təyin etmək istəyirəm (dəyişmək əvəzinə satmaq və ya qiymət təklif etmək istəyənlər üçün)
              </label>
            </div>
            
            <div id="price_field" class="<?php echo (isset($_POST['has_price'])) ? '' : 'hidden'; ?>">
              <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Qiymət (AZN)</label>
              <div class="relative rounded-md">
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary pr-12"
                  value="<?php echo isset($_POST['price']) ? htmlspecialchars($_POST['price']) : ''; ?>"
                  placeholder="0.00"
                >
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span class="text-gray-500">₼</span>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1">Təklif olunan əşyanın qiyməti. Əsas fokus barter olduğu üçün heç bir qiymət təyin etməmək də olar.</p>
            </div>
          </div>
          
          <!-- Şəkillər -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Şəkillər <span class="text-red-500">*</span></label>
            <div class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary transition-colors">
              <input type="file" id="images" name="images[]" multiple accept="image/*" class="hidden" onchange="handleImageUpload(this)">
              <label for="images" class="cursor-pointer flex flex-col items-center">
                <i class="fas fa-cloud-upload-alt text-gray-400 text-4xl mb-3"></i>
                <span class="text-gray-700 font-medium">Şəkilləri seçin və ya buraya sürükləyin</span>
                <span class="text-gray-500 text-sm mt-1">JPG, PNG və ya GIF. Maksimum 5MB</span>
              </label>
            </div>
            <div id="image_previews" class="mt-4 flex flex-wrap gap-3"></div>
            <p class="text-sm text-gray-500 mt-2">Ən yaxşı nəticələr üçün şəffaf fonda və ən azı 800x600 piksel olan şəkillər yükləyin. Birinci şəkil əsas şəkil kimi istifadə olunacaq.</p>
          </div>
          
          <!-- Göndər düyməsi -->
          <div class="flex justify-end space-x-3">
            <a href="profile.php" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Ləğv et
            </a>
            <button 
              type="submit" 
              class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Elanı yerləşdir
            </button>
          </div>
        </form>
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
    
    // Form təsdiqləməsi
    const form = document.querySelector('form');
    
    form.addEventListener('submit', function(event) {
      const imagesInput = document.getElementById('images');
      const priceCheckbox = document.getElementById('has_price');
      const priceInput = document.getElementById('price');
      
      // Şəkillərin seçildiyini yoxlayın
      if (imagesInput.files.length === 0) {
        event.preventDefault();
        alert('Zəhmət olmasa, ən azı bir şəkil seçin.');
        return;
      }
      
      // Əgər qiymət sahəsi aktivdirsə, qiymət yoxlayın
      if (priceCheckbox.checked && (priceInput.value === '' || parseFloat(priceInput.value) <= 0)) {
        event.preventDefault();
        alert('Zəhmət olmasa, düzgün qiymət daxil edin.');
        return;
      }
    });
  });
</script>

<?php
require_once 'includes/footer.php';
?>