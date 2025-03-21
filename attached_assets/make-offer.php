<?php
// Barter təklifi göndərmə səhifəsi
require_once 'includes/config.php';

// Giriş tələb olunur
requireLogin();

// Cari istifadəçini əldə et
$current_user = getCurrentUser();

// Hədəf elan ID-si
$target_item_id = isset($_GET['item']) ? (int)$_GET['item'] : 0;

if ($target_item_id <= 0) {
    setErrorMessage("Düzgün elan ID-si göstərilməyib.");
    header("Location: index.php");
    exit;
}

// Hədəf elanı əldə et
$stmt = $pdo->prepare("
    SELECT i.*, 
           u.id as owner_id,
           u.username as owner_username,
           c.name as category_name,
           c.display_name as category_display_name,
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
    FROM items i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = ? AND i.status = 'active'
");
$stmt->execute([$target_item_id]);
$target_item = $stmt->fetch();

// Elan mövcud deyilsə və ya aktiv deyilsə
if (!$target_item) {
    setErrorMessage("Bu elan mövcud deyil və ya aktiv deyil.");
    header("Location: index.php");
    exit;
}

// Öz elanınıza təklif göndərə bilməzsiniz
if ($target_item['owner_id'] == $current_user['id']) {
    setErrorMessage("Öz elanınıza təklif göndərə bilməzsiniz.");
    header("Location: item.php?id=" . $target_item_id);
    exit;
}

// İstifadəçinin öz elanlarını əldə et (aktiv olanlar)
$stmt = $pdo->prepare("
    SELECT i.*, 
           c.name as category_name, 
           c.display_name as category_display_name,
           (SELECT file_path FROM images WHERE item_id = i.id AND is_main = 1 LIMIT 1) as main_image
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.user_id = ? AND i.status = 'active'
    ORDER BY i.created_at DESC
");
$stmt->execute([$current_user['id']]);
$user_items = $stmt->fetchAll();

// Səhifə başlığı və açıqlaması
$page_title = "Barter Təklifi Göndər";
$page_description = "BarterTap.az platformasında " . $target_item['title'] . " elanı üçün barter təklifi göndərin.";

// Təklif göndərmə əməliyyatı
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlanışı
    validate_csrf_token();
    
    $offered_item_id = isset($_POST['offered_item_id']) ? (int)$_POST['offered_item_id'] : 0;
    $note = sanitizeInput($_POST['note']);
    
    if ($offered_item_id <= 0) {
        $error = "Təklif etmək üçün bir elan seçin.";
    } else {
        try {
            // Təklif edilən elanın mövcudluğunu və istifadəçiyə aid olduğunu yoxlayın
            $stmt = $pdo->prepare("
                SELECT id FROM items WHERE id = ? AND user_id = ? AND status = 'active'
            ");
            $stmt->execute([$offered_item_id, $current_user['id']]);
            $offered_item = $stmt->fetch();
            
            if (!$offered_item) {
                throw new Exception("Təklif edilən elan sizə aid deyil və ya aktiv deyil.");
            }
            
            // Tranzaksiya başlat
            $pdo->beginTransaction();
            
            // Əvvəlcə söhbəti yoxlayın, yoxdursa yaradın
            $stmt = $pdo->prepare("
                SELECT c.id
                FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
                WHERE c.item_id = ?
                LIMIT 1
            ");
            $stmt->execute([$current_user['id'], $target_item['owner_id'], $target_item_id]);
            $conversation = $stmt->fetch();
            
            if ($conversation) {
                $conversation_id = $conversation['id'];
            } else {
                // Yeni söhbət yaradın
                $stmt = $pdo->prepare("
                    INSERT INTO conversations (item_id, initiated_by, created_at, last_message_at)
                    VALUES (?, ?, NOW(), NOW())
                ");
                $stmt->execute([$target_item_id, $current_user['id']]);
                $conversation_id = $pdo->lastInsertId();
                
                // Söhbət iştirakçılarını əlavə edin
                $stmt = $pdo->prepare("
                    INSERT INTO conversation_participants (conversation_id, user_id)
                    VALUES (?, ?)
                ");
                $stmt->execute([$conversation_id, $current_user['id']]);
                $stmt->execute([$conversation_id, $target_item['owner_id']]);
            }
            
            // Təklifi əlavə edin
            $stmt = $pdo->prepare("
                INSERT INTO offers (
                    conversation_id, 
                    sender_id, 
                    recipient_id, 
                    offered_item_id, 
                    wanted_item_id, 
                    note, 
                    status, 
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
            ");
            $stmt->execute([
                $conversation_id,
                $current_user['id'],
                $target_item['owner_id'],
                $offered_item_id,
                $target_item_id,
                $note
            ]);
            
            // Təklif haqqında mesaj göndər
            $message = "Sizə yeni bir barter təklifi göndərdim! Mənim \"" . 
                      getItemTitle($offered_item_id) . "\" elanım ilə sizin \"" . 
                      $target_item['title'] . "\" elanınızı dəyişmək istəyirəm.";
            
            if (!empty($note)) {
                $message .= "\n\nƏlavə qeydlərim: " . $note;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO messages (conversation_id, sender_id, content, status, created_at)
                VALUES (?, ?, ?, 'sent', NOW())
            ");
            $stmt->execute([$conversation_id, $current_user['id'], $message]);
            
            // Bildiriş əlavə et
            $stmt = $pdo->prepare("
                INSERT INTO notifications (
                    user_id, 
                    type, 
                    reference_id, 
                    content, 
                    is_read, 
                    created_at
                )
                VALUES (?, 'offer', ?, ?, 0, NOW())
            ");
            $stmt->execute([
                $target_item['owner_id'],
                $conversation_id,
                $current_user['username'] . " istifadəçisi sizə yeni bir barter təklifi göndərdi."
            ]);
            
            // Tranzaksiyanı tamamla
            $pdo->commit();
            
            // Uğurlu mesaj
            setSuccessMessage("Barter təklifiniz uğurla göndərildi! Qarşı tərəf təklifinizə baxdıqdan sonra sizə mesaj göndərəcək.");
            
            // Söhbət səhifəsinə yönləndirin
            header("Location: messages.php?conversation=" . $conversation_id);
            exit;
            
        } catch (Exception $e) {
            // Xəta baş verərsə, tranzaksiyanı geri qaytarın
            $pdo->rollBack();
            $error = "Xəta: " . $e->getMessage();
        }
    }
}

// Yardımçı funksiya - elan başlığını ID-yə görə əldə et
function getItemTitle($item_id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT title FROM items WHERE id = ?");
    $stmt->execute([$item_id]);
    $result = $stmt->fetch();
    return $result ? $result['title'] : 'Naməlum elan';
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-8">
  <div class="container mx-auto px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Geriyə linki -->
      <div class="mb-4">
        <a href="item.php?id=<?php echo $target_item_id; ?>" class="text-primary hover:underline flex items-center">
          <i class="fas fa-arrow-left mr-1"></i> Elana qayıt
        </a>
      </div>
      
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Barter Təklifi Göndər</h1>
      
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
      
      <!-- Təklif formunu göstərin -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Sol sütun: İstədiyiniz əşya (hədəf elan) -->
        <div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">İstədiyiniz Əşya</h2>
            <div class="border rounded-lg overflow-hidden">
              <div class="aspect-w-4 aspect-h-3 bg-gray-100">
                <img 
                  src="<?php echo $target_item['main_image'] ? htmlspecialchars($target_item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                  alt="<?php echo htmlspecialchars($target_item['title']); ?>" 
                  class="object-contain w-full h-full"
                >
              </div>
              <div class="p-4">
                <h3 class="font-medium text-gray-900"><?php echo htmlspecialchars($target_item['title']); ?></h3>
                <div class="mt-2 text-sm text-gray-600">
                  <div class="flex items-center mb-1">
                    <i class="fas fa-tag mr-1"></i>
                    <span><?php echo htmlspecialchars($target_item['category_display_name']); ?></span>
                  </div>
                  <?php if($target_item['location']): ?>
                    <div class="flex items-center mb-1">
                      <i class="fas fa-map-marker-alt mr-1"></i>
                      <span><?php echo htmlspecialchars($target_item['location']); ?></span>
                    </div>
                  <?php endif; ?>
                  <div class="flex items-center">
                    <i class="fas fa-user mr-1"></i>
                    <span><?php echo htmlspecialchars($target_item['owner_username']); ?></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sağ sütun: Təklif formu -->
        <div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Təklif Etdiyiniz Əşya</h2>
            
            <?php if (count($user_items) > 0): ?>
              <form method="POST" action="" class="space-y-4">
                <?php echo csrf_field(); ?>
                
                <!-- Təklif edilən əşya seçimi -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Təklif etmək istədiyiniz əşyanı seçin:</label>
                  
                  <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    <?php foreach ($user_items as $item): ?>
                      <label class="flex items-center border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input 
                          type="radio" 
                          name="offered_item_id" 
                          value="<?php echo $item['id']; ?>" 
                          class="text-primary focus:ring-primary h-4 w-4"
                          <?php echo (isset($_POST['offered_item_id']) && $_POST['offered_item_id'] == $item['id']) ? 'checked' : ''; ?>
                        >
                        <div class="ml-3 flex items-center flex-1 min-w-0">
                          <img 
                            src="<?php echo $item['main_image'] ? htmlspecialchars($item['main_image']) : 'assets/images/placeholder.jpg'; ?>" 
                            alt="<?php echo htmlspecialchars($item['title']); ?>" 
                            class="w-12 h-12 object-cover rounded-md mr-3"
                          >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate"><?php echo htmlspecialchars($item['title']); ?></p>
                            <p class="text-xs text-gray-500 truncate"><?php echo htmlspecialchars($item['category_display_name']); ?></p>
                          </div>
                        </div>
                      </label>
                    <?php endforeach; ?>
                  </div>
                </div>
                
                <!-- Əlavə qeyd -->
                <div>
                  <label for="note" class="block text-sm font-medium text-gray-700 mb-2">Əlavə qeyd (istəyə bağlı):</label>
                  <textarea 
                    id="note" 
                    name="note" 
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Təklifinizlə bağlı əlavə məlumat və ya şərtləri bura yazın..."
                  ><?php echo isset($_POST['note']) ? htmlspecialchars($_POST['note']) : ''; ?></textarea>
                </div>
                
                <!-- Göndər düyməsi -->
                <div class="pt-4">
                  <button 
                    type="submit" 
                    class="w-full bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <i class="fas fa-exchange-alt mr-1"></i> Təklifi göndər
                  </button>
                </div>
              </form>
            <?php else: ?>
              <!-- Aktiv elan yoxdursa -->
              <div class="text-center py-4">
                <i class="fas fa-exclamation-circle text-yellow-500 text-4xl mb-3"></i>
                <h3 class="text-lg font-medium text-gray-700 mb-2">Aktiv elanınız yoxdur</h3>
                <p class="text-gray-600 mb-4">
                  Barter təklifi göndərmək üçün aktiv elanlarınız olmalıdır. Yeni elan yaradaraq təklif göndərə bilərsiniz.
                </p>
                <a href="create-item.php" class="bg-primary hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center">
                  <i class="fas fa-plus mr-1"></i> Yeni elan yarat
                </a>
              </div>
            <?php endif; ?>
          </div>
        </div>
      </div>
      
      <!-- Barter haqqında informasiya -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Barter Prosesi Necə İşləyir?</h2>
        <div class="space-y-3">
          <div class="flex items-start">
            <div class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">1</div>
            <p class="text-gray-700">Təklif etmək istədiyiniz əşyanı seçin və təklifinizi göndərin.</p>
          </div>
          <div class="flex items-start">
            <div class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">2</div>
            <p class="text-gray-700">Elan sahibi təklifinizi qəbul edə, rədd edə və ya əks təklif göndərə bilər.</p>
          </div>
          <div class="flex items-start">
            <div class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">3</div>
            <p class="text-gray-700">Təklif qəbul edildikdən sonra, mesajlaşma vasitəsilə görüş yeri və vaxtını təyin edin.</p>
          </div>
          <div class="flex items-start">
            <div class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-medium mr-2 flex-shrink-0">4</div>
            <p class="text-gray-700">Görüşdə əşyaları dəyişdikdən sonra, platforma üzərindən barteri tamamlanmış kimi işarələyin.</p>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <p>
            <i class="fas fa-shield-alt text-blue-500 mr-1"></i>
            <strong>Təhlükəsizlik tövsiyəsi:</strong> Həmişə ictimai yerlərdə görüşün və əşyaları dəyişməzdən əvvəl diqqətlə yoxlayın.
          </p>
        </div>
      </div>
    </div>
  </div>
</main>

<?php
require_once 'includes/footer.php';
?>