<?php
// Elan silmə səhifəsi
require_once 'includes/config.php';

// Giriş tələb olunur
requireLogin();

// Cari istifadəçini əldə et
$current_user = getCurrentUser();

// Əgər ID və təsdiq kodu yoxdursa, zəhmət olmasa
if (!isset($_GET['id']) || empty($_GET['id'])) {
    setErrorMessage("Düzgün elan ID-si göstərilməyib.");
    header("Location: profile.php");
    exit;
}

$item_id = (int)$_GET['id'];

// Elanı əldə et
$stmt = $pdo->prepare("SELECT * FROM items WHERE id = ?");
$stmt->execute([$item_id]);
$item = $stmt->fetch();

// Elan mövcud deyilsə və ya istifadəçinin öz elanı deyilsə
if (!$item || $item['user_id'] != $current_user['id']) {
    setErrorMessage("Bu elanı silmək üçün icazəniz yoxdur.");
    header("Location: profile.php");
    exit;
}

// Təsdiq kodu
$confirmation_token = isset($_GET['confirm']) ? $_GET['confirm'] : '';

// Əgər təsdiq olmadan gəlibsə, təsdiqləmə səhifəsini göstərin
if (empty($confirmation_token)) {
    // Təsadüfi təsdiq kodu yaradın
    $token = md5(uniqid(mt_rand(), true));
    
    // Tokeni sessiyada saxlayın
    $_SESSION['delete_confirmation_token'] = [
        'token' => $token,
        'item_id' => $item_id,
        'expires' => time() + 600 // 10 dəqiqə
    ];
    
    // Səhifə başlığı və açıqlaması
    $page_title = "Elanı Sil";
    $page_description = "Elanı silmək üçün təsdiqləmə səhifəsi.";
    
    require_once 'includes/header.php';
    ?>
    
    <main class="flex-1 bg-gray-50 py-10">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Elanı Silmək İstəyirsiniz?</h1>
            
            <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p><strong>Diqqət:</strong> Elanı silmək əməliyyatı geri qaytarıla bilməz. Bütün elan məlumatları və şəkillər daimi olaraq silinəcək.</p>
            </div>
            
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-700 mb-2">Elan məlumatları:</h2>
              <div class="border rounded-md p-4 bg-gray-50">
                <p><strong>Başlıq:</strong> <?php echo htmlspecialchars($item['title']); ?></p>
                <p><strong>Kateqoriya:</strong> 
                  <?php 
                  $stmt = $pdo->prepare("SELECT display_name FROM categories WHERE id = ?");
                  $stmt->execute([$item['category_id']]);
                  $category = $stmt->fetch();
                  echo htmlspecialchars($category['display_name']); 
                  ?>
                </p>
                <p><strong>Status:</strong> <?php echo getStatusName($item['status']); ?></p>
                <p><strong>Yaradılma tarixi:</strong> <?php echo formatDate($item['created_at']); ?></p>
                
                <?php
                // Şəkil sayını əldə et
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM images WHERE item_id = ?");
                $stmt->execute([$item_id]);
                $image_count = $stmt->fetchColumn();
                ?>
                <p><strong>Şəkil sayı:</strong> <?php echo $image_count; ?></p>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <a href="profile.php" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                Ləğv et
              </a>
              <a 
                href="delete-item.php?id=<?php echo $item_id; ?>&confirm=<?php echo $token; ?>" 
                class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Bəli, elanı sil
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <?php
    require_once 'includes/footer.php';
    exit;
}

// Təsdiqlənmiş silmə əməliyyatı
if (
    isset($_SESSION['delete_confirmation_token']) && 
    $_SESSION['delete_confirmation_token']['token'] === $confirmation_token &&
    $_SESSION['delete_confirmation_token']['item_id'] === $item_id &&
    $_SESSION['delete_confirmation_token']['expires'] > time()
) {
    try {
        // Verilənlər bazası əməliyyatını başladın (transaction)
        $pdo->beginTransaction();
        
        // Elanın şəkillərini silin (fiziki olaraq)
        $stmt = $pdo->prepare("SELECT file_path FROM images WHERE item_id = ?");
        $stmt->execute([$item_id]);
        $images = $stmt->fetchAll();
        
        foreach ($images as $image) {
            if (file_exists($image['file_path'])) {
                unlink($image['file_path']);
            }
        }
        
        // Şəkilləri verilənlər bazasından silin
        $stmt = $pdo->prepare("DELETE FROM images WHERE item_id = ?");
        $stmt->execute([$item_id]);
        
        // Favorilərdən silin
        $stmt = $pdo->prepare("DELETE FROM favorites WHERE item_id = ?");
        $stmt->execute([$item_id]);
        
        // Elanla əlaqəli bildirişləri silin
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE reference_id = ? AND type IN ('offer', 'status')");
        $stmt->execute([$item_id]);
        
        // Elanı silin
        $stmt = $pdo->prepare("DELETE FROM items WHERE id = ? AND user_id = ?");
        $result = $stmt->execute([$item_id, $current_user['id']]);
        
        if (!$result) {
            throw new Exception("Elan silinməsi zamanı xəta baş verdi.");
        }
        
        // Verilənlər bazası əməliyyatını təsdiqləyin
        $pdo->commit();
        
        // Təsdiq tokenini təmizləyin
        unset($_SESSION['delete_confirmation_token']);
        
        // Uğurlu mesaj
        setSuccessMessage("Elanınız uğurla silindi!");
        
        // Profil səhifəsinə yönləndirin
        header("Location: profile.php");
        exit;
        
    } catch (Exception $e) {
        // Xəta baş verərsə, əməliyyatı geri qaytarın
        $pdo->rollBack();
        
        setErrorMessage("Xəta: " . $e->getMessage());
        header("Location: profile.php");
        exit;
    }
} else {
    // Yanlış və ya vaxtı keçmiş təsdiq tokenı
    setErrorMessage("Yanlış və ya vaxtı keçmiş təsdiq kodu. Zəhmət olmasa, yenidən cəhd edin.");
    header("Location: profile.php");
    exit;
}
?>