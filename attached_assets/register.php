<?php
// Qeydiyyat səhifəsi
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "Qeydiyyat";
$page_description = "BarterTap.az platformasında qeydiyyatdan keçin və elanlar yerləşdirməyə başlayın.";

// Yönləndirmə URL-i
$redirect = isset($_GET['redirect']) ? $_GET['redirect'] : '';

// Qeydiyyat əməliyyatı
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = sanitizeInput($_POST['username']);
  $email = sanitizeInput($_POST['email']);
  $full_name = sanitizeInput($_POST['full_name']);
  $password = $_POST['password'];
  $password_confirm = $_POST['password_confirm'];
  $phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
  $city = isset($_POST['city']) ? sanitizeInput($_POST['city']) : '';
  
  // Validation
  if (empty($username) || empty($email) || empty($full_name) || empty($password)) {
    $error = "Bütün vacib sahələri doldurun.";
  } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $error = "Düzgün e-poçt ünvanı daxil edin.";
  } elseif (strlen($password) < 6) {
    $error = "Şifrə ən azı 6 simvol olmalıdır.";
  } elseif ($password !== $password_confirm) {
    $error = "Şifrələr uyğun gəlmir.";
  } else {
    // İstifadəçi adı və email'in unikallığını yoxlayın
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
      if ($existingUser['username'] === $username) {
        $error = "Bu istifadəçi adı artıq istifadə olunur.";
      } else {
        $error = "Bu e-poçt ünvanı artıq qeydiyyatdan keçib.";
      }
    } else {
      // Şifrəni hash edin
      $hashed_password = password_hash($password, PASSWORD_DEFAULT);
      
      // İstifadəçini əlavə edin
      $stmt = $pdo->prepare("INSERT INTO users (username, email, full_name, password, phone, city, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
      $result = $stmt->execute([$username, $email, $full_name, $hashed_password, $phone, $city]);
      
      if ($result) {
        // Avtomatik giriş
        $user_id = $pdo->lastInsertId();
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        
        // Uğurlu qeydiyyat mesajını göstərin
        setSuccessMessage("Qeydiyyatınız uğurla tamamlandı!");
        
        // Yönləndirmə
        if (!empty($redirect)) {
          header("Location: $redirect");
          exit;
        } else {
          header("Location: index.php");
          exit;
        }
      } else {
        $error = "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
      }
    }
  }
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-10">
  <div class="container mx-auto px-4">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">Qeydiyyatdan keçin</h1>
      
      <?php if ($error): ?>
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p><?php echo $error; ?></p>
        </div>
      <?php endif; ?>
      
      <form method="POST" action="" class="space-y-4 validate">
        <!-- İstifadəçi adı -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">İstifadəçi adı <span class="text-red-500">*</span></label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>"
          >
          <p class="text-sm text-gray-500 mt-1">İstifadəçi adı hərf və rəqəmlərdən ibarət olmalıdır.</p>
        </div>
        
        <!-- E-poçt -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">E-poçt <span class="text-red-500">*</span></label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>"
          >
        </div>
        
        <!-- Tam ad -->
        <div>
          <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">Ad və soyad <span class="text-red-500">*</span></label>
          <input 
            type="text" 
            id="full_name" 
            name="full_name" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value="<?php echo isset($_POST['full_name']) ? htmlspecialchars($_POST['full_name']) : ''; ?>"
          >
        </div>
        
        <!-- Telefon -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value="<?php echo isset($_POST['phone']) ? htmlspecialchars($_POST['phone']) : ''; ?>"
            placeholder="+994 50 123 45 67"
          >
        </div>
        
        <!-- Şəhər -->
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
          <select 
            id="city" 
            name="city" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Seçin</option>
            <option value="Bakı" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Bakı') ? 'selected' : ''; ?>>Bakı</option>
            <option value="Gəncə" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Gəncə') ? 'selected' : ''; ?>>Gəncə</option>
            <option value="Sumqayıt" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Sumqayıt') ? 'selected' : ''; ?>>Sumqayıt</option>
            <option value="Mingəçevir" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Mingəçevir') ? 'selected' : ''; ?>>Mingəçevir</option>
            <option value="Şəki" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Şəki') ? 'selected' : ''; ?>>Şəki</option>
            <option value="Şirvan" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Şirvan') ? 'selected' : ''; ?>>Şirvan</option>
            <option value="Lənkəran" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Lənkəran') ? 'selected' : ''; ?>>Lənkəran</option>
            <option value="Naxçıvan" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Naxçıvan') ? 'selected' : ''; ?>>Naxçıvan</option>
            <option value="Digər" <?php echo (isset($_POST['city']) && $_POST['city'] === 'Digər') ? 'selected' : ''; ?>>Digər</option>
          </select>
        </div>
        
        <!-- Şifrə -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Şifrə <span class="text-red-500">*</span></label>
          <div class="relative">
            <input 
              type="password" 
              id="password" 
              name="password" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              minlength="6"
            >
            <button type="button" id="togglePassword" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <i class="far fa-eye"></i>
            </button>
          </div>
          <p class="text-sm text-gray-500 mt-1">Şifrə ən azı 6 simvol olmalıdır.</p>
        </div>
        
        <!-- Şifrənin təkrarı -->
        <div>
          <label for="password_confirm" class="block text-sm font-medium text-gray-700 mb-1">Şifrənin təkrarı <span class="text-red-500">*</span></label>
          <div class="relative">
            <input 
              type="password" 
              id="password_confirm" 
              name="password_confirm" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              minlength="6"
            >
            <button type="button" id="toggleConfirmPassword" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <i class="far fa-eye"></i>
            </button>
          </div>
        </div>
        
        <!-- İstifadəçi şərtləri -->
        <div class="flex items-start">
          <input 
            type="checkbox" 
            id="terms" 
            name="terms" 
            required
            class="h-4 w-4 mt-1 text-primary focus:ring-primary border-gray-300 rounded"
          >
          <label for="terms" class="ml-2 block text-sm text-gray-700">
            <a href="terms.php" class="text-primary hover:underline" target="_blank">İstifadəçi şərtləri</a> və <a href="privacy.php" class="text-primary hover:underline" target="_blank">Məxfilik siyasəti</a> ilə razıyam
          </label>
        </div>
        
        <!-- Qeydiyyat düyməsi -->
        <div>
          <button 
            type="submit" 
            class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Qeydiyyatdan keç
          </button>
        </div>
        
        <!-- Giriş linki -->
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Artıq hesabınız var? <a href="login.php<?php echo $redirect ? '?redirect=' . urlencode($redirect) : ''; ?>" class="text-primary font-medium hover:underline">Daxil olun</a>
          </p>
        </div>
      </form>
    </div>
  </div>
</main>

<script>
  // Şifrə göstərmə/gizlətmə
  document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
  
  document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password_confirm');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
</script>

<?php
require_once 'includes/footer.php';
?>