<?php
// Giriş səhifəsi
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "Giriş";
$page_description = "BarterTap.az hesabınıza daxil olun və barter əməliyyatlarına başlayın.";

// Yönləndirmə URL-i
$redirect = isset($_GET['redirect']) ? $_GET['redirect'] : '';

// Giriş əməliyyatı
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = sanitizeInput($_POST['username']);
  $password = $_POST['password'];
  
  if (empty($username) || empty($password)) {
    $error = "İstifadəçi adı və şifrə boş ola bilməz.";
  } else {
    // İstifadəçi məlumatlarını yoxlayın
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
      // Giriş uğurludur, sessiyanı başlat
      $_SESSION['user_id'] = $user['id'];
      $_SESSION['username'] = $user['username'];
      
      // Uğurlu giriş mesajını göstərin
      setSuccessMessage("Hesabınıza uğurla daxil oldunuz!");
      
      // Yönləndirmə
      if (!empty($redirect)) {
        header("Location: $redirect");
        exit;
      } else {
        header("Location: index.php");
        exit;
      }
    } else {
      $error = "İstifadəçi adı və ya şifrə yanlışdır.";
    }
  }
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-10">
  <div class="container mx-auto px-4">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">Hesabınıza daxil olun</h1>
      
      <?php if ($error): ?>
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p><?php echo $error; ?></p>
        </div>
      <?php endif; ?>
      
      <?php if ($success): ?>
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p><?php echo $success; ?></p>
        </div>
      <?php endif; ?>
      
      <form method="POST" action="" class="space-y-4 validate">
        <!-- İstifadəçi adı -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">İstifadəçi adı</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>"
          >
        </div>
        
        <!-- Şifrə -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
          <div class="relative">
            <input 
              type="password" 
              id="password" 
              name="password" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
            <button type="button" id="togglePassword" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <i class="far fa-eye"></i>
            </button>
          </div>
        </div>
        
        <!-- Xatırla məni -->
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="remember" 
            name="remember" 
            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          >
          <label for="remember" class="ml-2 block text-sm text-gray-700">Məni xatırla</label>
          <a href="forgot-password.php" class="ml-auto text-sm text-primary hover:underline">Şifrəni unutmusunuz?</a>
        </div>
        
        <!-- Giriş düyməsi -->
        <div>
          <button 
            type="submit" 
            class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Daxil ol
          </button>
        </div>
        
        <!-- Qeydiyyat linki -->
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            Hesabınız yoxdur? <a href="register.php<?php echo $redirect ? '?redirect=' . urlencode($redirect) : ''; ?>" class="text-primary font-medium hover:underline">Qeydiyyatdan keçin</a>
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
</script>

<?php
require_once 'includes/footer.php';
?>