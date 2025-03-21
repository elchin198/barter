<?php
// Təkmilləşdirilmiş profil səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Profil Tənzimləmələri | BarterTap.az";
$page_description = "BarterTap.az platformasında profil məlumatlarınızı təkmilləşdirin və idarə edin.";

// Xəta və uğur mesajları
$error = '';
$success = '';

// İstifadəçinin maraqlarını və ehtiyaclarını əldə et
$stmt = $pdo->prepare("
    SELECT 
        interests, 
        exchange_preferences, 
        bio, 
        social_links, 
        profile_status, 
        showcase_items,
        accomplishments,
        skills,
        personality_type
    FROM users 
    WHERE id = ?
");
$stmt->execute([$current_user['id']]);
$profile_data = $stmt->fetch(PDO::FETCH_ASSOC);

// Varsayılan dəyərləri təyin et
$interests = json_decode($profile_data['interests'] ?? '[]', true);
$exchange_preferences = json_decode($profile_data['exchange_preferences'] ?? '[]', true);
$social_links = json_decode($profile_data['social_links'] ?? '{}', true);
$showcase_items = json_decode($profile_data['showcase_items'] ?? '[]', true);
$accomplishments = json_decode($profile_data['accomplishments'] ?? '[]', true);
$skills = json_decode($profile_data['skills'] ?? '[]', true);
$personality_type = $profile_data['personality_type'] ?? '';
$bio = $profile_data['bio'] ?? '';
$profile_status = $profile_data['profile_status'] ?? 'active';

// Formu emal et
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF token yoxla
    validate_csrf_token();
    
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    // Əsas profil məlumatları yenilə
    if ($action === 'update_basic_info') {
        $full_name = trim($_POST['full_name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $bio = trim($_POST['bio'] ?? '');
        $profile_status = $_POST['profile_status'] ?? 'active';
        
        // Yoxlanılması lazım olan sahələr
        $validation_errors = [];
        
        if (empty($email)) {
            $validation_errors[] = "Email ünvanı boş ola bilməz.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $validation_errors[] = "Düzgün email ünvanı daxil edin.";
        }
        
        // Email unikallığını yoxla
        if ($email !== $current_user['email']) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $current_user['id']]);
            if ($stmt->fetch()) {
                $validation_errors[] = "Bu email ünvanı artıq istifadə olunub.";
            }
        }
        
        if (empty($validation_errors)) {
            try {
                // İstifadəçi məlumatlarını yenilə
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET full_name = ?, email = ?, phone = ?, city = ?, bio = ?, profile_status = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$full_name, $email, $phone, $city, $bio, $profile_status, $current_user['id']]);
                
                // Uğurlu mesaj
                $success = "Profil məlumatlarınız uğurla yeniləndi.";
                
                // İstifadəçi məlumatlarını yenilə
                $current_user = getCurrentUser(true);
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        } else {
            $error = implode(" ", $validation_errors);
        }
    }
    
    // Maraqları yenilə
    if ($action === 'update_interests') {
        $selected_interests = isset($_POST['interests']) ? $_POST['interests'] : [];
        
        try {
            // Maraqları JSON formatına çevir
            $interests_json = json_encode($selected_interests);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("UPDATE users SET interests = ? WHERE id = ?");
            $stmt->execute([$interests_json, $current_user['id']]);
            
            // Məlumatları yenilə
            $interests = $selected_interests;
            $success = "Maraqlarınız uğurla yeniləndi.";
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
    
    // Mübadilə seçimlərini yenilə
    if ($action === 'update_exchange_preferences') {
        $selected_categories = isset($_POST['preferred_categories']) ? $_POST['preferred_categories'] : [];
        $preferred_locations = isset($_POST['preferred_locations']) ? explode(',', $_POST['preferred_locations']) : [];
        $exchange_notes = trim($_POST['exchange_notes'] ?? '');
        
        try {
            // Mübadilə seçimlərini yarat
            $exchange_preferences = [
                'categories' => $selected_categories,
                'locations' => array_map('trim', $preferred_locations),
                'notes' => $exchange_notes
            ];
            
            // JSON formatına çevir
            $exchange_json = json_encode($exchange_preferences);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("UPDATE users SET exchange_preferences = ? WHERE id = ?");
            $stmt->execute([$exchange_json, $current_user['id']]);
            
            // Uğurlu mesaj
            $success = "Mübadilə seçimləriniz uğurla yeniləndi.";
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
    
    // Sosial linkləri yenilə
    if ($action === 'update_social_links') {
        $facebook = trim($_POST['facebook'] ?? '');
        $instagram = trim($_POST['instagram'] ?? '');
        $twitter = trim($_POST['twitter'] ?? '');
        $linkedin = trim($_POST['linkedin'] ?? '');
        $website = trim($_POST['website'] ?? '');
        
        try {
            // Sosial linkləri yarat
            $social_links = [
                'facebook' => $facebook,
                'instagram' => $instagram,
                'twitter' => $twitter,
                'linkedin' => $linkedin,
                'website' => $website
            ];
            
            // JSON formatına çevir
            $social_json = json_encode($social_links);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("UPDATE users SET social_links = ? WHERE id = ?");
            $stmt->execute([$social_json, $current_user['id']]);
            
            // Uğurlu mesaj
            $success = "Sosial profil linkləriniz uğurla yeniləndi.";
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
    
    // Bacarıqları və nailiyyətləri yenilə
    if ($action === 'update_skills_achievements') {
        $skills_input = isset($_POST['skills']) ? explode(',', $_POST['skills']) : [];
        $accomplishments_input = isset($_POST['accomplishments']) ? $_POST['accomplishments'] : [];
        $personality_type_input = $_POST['personality_type'] ?? '';
        
        try {
            // Bacarıqları təmizlə
            $skills = array_map('trim', $skills_input);
            $skills = array_filter($skills, function($item) { return !empty($item); });
            
            // Nailiyyətləri hazırla
            $accomplishments = [];
            foreach ($accomplishments_input as $key => $title) {
                if (!empty($title)) {
                    $accomplishments[] = [
                        'title' => $title,
                        'description' => $_POST['accomplishment_descriptions'][$key] ?? '',
                        'date' => $_POST['accomplishment_dates'][$key] ?? '',
                    ];
                }
            }
            
            // JSON formatına çevir
            $skills_json = json_encode(array_values($skills));
            $accomplishments_json = json_encode($accomplishments);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("
                UPDATE users 
                SET skills = ?, accomplishments = ?, personality_type = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $skills_json, 
                $accomplishments_json,
                $personality_type_input,
                $current_user['id']
            ]);
            
            // Məlumatları yenilə
            $skills = array_values($skills);
            $accomplishments = $accomplishments;
            $personality_type = $personality_type_input;
            
            // Uğurlu mesaj
            $success = "Bacarıqlarınız və nailiyyətləriniz uğurla yeniləndi.";
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
    
    // Vitrin elementlərini yenilə
    if ($action === 'update_showcase') {
        $showcase_item_ids = isset($_POST['showcase_items']) ? $_POST['showcase_items'] : [];
        
        try {
            // Vitrin elementlərini yoxla
            $valid_items = [];
            
            if (!empty($showcase_item_ids)) {
                $placeholders = implode(',', array_fill(0, count($showcase_item_ids), '?'));
                
                $stmt = $pdo->prepare("
                    SELECT id, title 
                    FROM items 
                    WHERE id IN ($placeholders) AND user_id = ?
                ");
                
                $params = array_merge($showcase_item_ids, [$current_user['id']]);
                $stmt->execute($params);
                
                while ($row = $stmt->fetch()) {
                    $valid_items[] = $row['id'];
                }
            }
            
            // JSON formatına çevir
            $showcase_json = json_encode($valid_items);
            
            // Verilənlər bazasını yenilə
            $stmt = $pdo->prepare("UPDATE users SET showcase_items = ? WHERE id = ?");
            $stmt->execute([$showcase_json, $current_user['id']]);
            
            // Uğurlu mesaj
            $success = "Vitrin elanlarınız uğurla yeniləndi.";
            
            // Məlumatları yenilə
            $showcase_items = $valid_items;
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
}

// Bütün kateqoriyaları əldə et
$stmt = $pdo->prepare("SELECT id, name, display_name, icon FROM categories ORDER BY display_name");
$stmt->execute();
$categories = $stmt->fetchAll();

// İstifadəçinin elanlarını əldə et
$stmt = $pdo->prepare("
    SELECT id, title, status, created_at,
           (SELECT file_path FROM images WHERE item_id = items.id AND is_main = 1 LIMIT 1) as main_image
    FROM items
    WHERE user_id = ? AND status != 'deleted'
    ORDER BY created_at DESC
");
$stmt->execute([$current_user['id']]);
$user_items = $stmt->fetchAll();

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Səhifə başlığı -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Profil Tənzimləmələri</h1>
            <p class="text-gray-600">Profil məlumatlarınızı daha ətraflı təqdim edin və barter təcrübənizi yaxşılaşdırın</p>
        </div>
        
        <?php if ($error): ?>
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span><?php echo $error; ?></span>
                </div>
            </div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span><?php echo $success; ?></span>
                </div>
            </div>
        <?php endif; ?>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- Sol panel - Naviqasiya -->
            <div class="md:col-span-1">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">Profil Tənzimləmələri</h2>
                    </div>
                    
                    <div class="p-2">
                        <nav class="space-y-1">
                            <a href="#basic-info" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary bg-opacity-10 text-primary">
                                <i class="fas fa-user w-5 mr-2"></i>
                                <span>Əsas məlumatlar</span>
                            </a>
                            <a href="#interests" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-heart w-5 text-gray-400 mr-2"></i>
                                <span>Maraqlar</span>
                            </a>
                            <a href="#exchange-preferences" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-exchange-alt w-5 text-gray-400 mr-2"></i>
                                <span>Mübadilə seçimləri</span>
                            </a>
                            <a href="#social-links" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-share-alt w-5 text-gray-400 mr-2"></i>
                                <span>Sosial profillər</span>
                            </a>
                            <a href="#skills-achievements" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-award w-5 text-gray-400 mr-2"></i>
                                <span>Bacarıqlar və nailiyyətlər</span>
                            </a>
                            <a href="#showcase" class="profile-nav-link flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-star w-5 text-gray-400 mr-2"></i>
                                <span>Vitrin elanları</span>
                            </a>
                        </nav>
                    </div>
                </div>
                
                <!-- Profil tamamlanma dərəcəsi -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">Profil tamamlanması</h2>
                    </div>
                    <div class="p-4">
                        <?php
                        // Profil tamamlanma dərəcəsini hesabla
                        $total_fields = 7; // Əsas məlumat, maraqlar, mübadilə seçimləri, sosial profillər, bacarıqlar, nailiyyətlər, vitrin elanları
                        $completed_fields = 0;
                        
                        // Əsas məlumatlar
                        if (!empty($bio) && !empty($current_user['full_name']) && !empty($current_user['city'])) {
                            $completed_fields++;
                        }
                        
                        // Maraqlar
                        if (!empty($interests)) {
                            $completed_fields++;
                        }
                        
                        // Mübadilə seçimləri
                        if (!empty($exchange_preferences) && !empty($exchange_preferences['categories'])) {
                            $completed_fields++;
                        }
                        
                        // Sosial profillər
                        if (!empty($social_links) && count(array_filter($social_links)) > 0) {
                            $completed_fields++;
                        }
                        
                        // Bacarıqlar
                        if (!empty($skills)) {
                            $completed_fields++;
                        }
                        
                        // Nailiyyətlər
                        if (!empty($accomplishments)) {
                            $completed_fields++;
                        }
                        
                        // Vitrin elanları
                        if (!empty($showcase_items)) {
                            $completed_fields++;
                        }
                        
                        $completion_percentage = ($completed_fields / $total_fields) * 100;
                        ?>
                        
                        <div class="mb-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-medium text-gray-700">Profil tamamlanması</span>
                                <span class="text-sm font-medium text-gray-700"><?php echo round($completion_percentage); ?>%</span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-primary" style="width: <?php echo $completion_percentage; ?>%"></div>
                            </div>
                        </div>
                        
                        <?php if ($completion_percentage < 100): ?>
                            <p class="text-sm text-gray-600">
                                Profilinizi tamamlayın və daha çox barter imkanlarına sahib olun.
                            </p>
                        <?php else: ?>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                                Təbriklər! Profiliniz tam tamamlanıb.
                            </p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Profil önizləməsi düyməsi -->
                <div class="mt-6 text-center">
                    <a href="profile.php?id=<?php echo $current_user['id']; ?>" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <i class="fas fa-eye mr-2"></i>
                        Profilə bax
                    </a>
                </div>
            </div>
            
            <!-- Sağ panel - Formlar -->
            <div class="md:col-span-3 space-y-6">
                <!-- Əsas məlumatlar -->
                <div id="basic-info" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-user text-primary mr-2"></i>
                            Əsas məlumatlar
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="update_basic_info">
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                    <input 
                                        type="text" 
                                        id="full_name" 
                                        name="full_name" 
                                        value="<?php echo htmlspecialchars($current_user['full_name'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        value="<?php echo htmlspecialchars($current_user['email'] ?? ''); ?>" 
                                        required
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input 
                                        type="text" 
                                        id="phone" 
                                        name="phone" 
                                        value="<?php echo htmlspecialchars($current_user['phone'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                                
                                <div>
                                    <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
                                    <input 
                                        type="text" 
                                        id="city" 
                                        name="city" 
                                        value="<?php echo htmlspecialchars($current_user['city'] ?? ''); ?>" 
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Haqqımda</label>
                                <textarea 
                                    id="bio" 
                                    name="bio" 
                                    rows="4" 
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                ><?php echo htmlspecialchars($bio); ?></textarea>
                                <p class="text-sm text-gray-500 mt-1">
                                    Özünüz haqqında qısa məlumat. Bu, profilinizin "Haqqımda" bölməsində göstəriləcək.
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <label for="profile_status" class="block text-sm font-medium text-gray-700 mb-1">Profil statusu</label>
                                <select 
                                    id="profile_status" 
                                    name="profile_status" 
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="active" <?php echo $profile_status === 'active' ? 'selected' : ''; ?>>Aktiv - Mübadilə təkliflərinə açığam</option>
                                    <option value="busy" <?php echo $profile_status === 'busy' ? 'selected' : ''; ?>>Məşğul - Hazırda yeni təkliflərə baxmıram</option>
                                    <option value="away" <?php echo $profile_status === 'away' ? 'selected' : ''; ?>>Müvəqqəti olaraq qeyri-aktiv</option>
                                </select>
                            </div>
                            
                            <div class="flex justify-end">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Maraqlar -->
                <div id="interests" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-heart text-primary mr-2"></i>
                            Maraqlar
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Maraqlarınızı və baxmaq istədiyiniz kateqoriyaları seçin. Bu, sizə daha uyğun elanların göstərilməsinə kömək edəcək.
                        </p>
                        
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="update_interests">
                            
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                <?php foreach ($categories as $category): ?>
                                    <label class="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="interests[]" 
                                            value="<?php echo $category['id']; ?>"
                                            <?php echo in_array($category['id'], $interests) ? 'checked' : ''; ?>
                                            class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        >
                                        <span class="ml-2 flex items-center">
                                            <i class="<?php echo $category['icon']; ?> mr-1 text-primary"></i>
                                            <span class="text-sm"><?php echo htmlspecialchars($category['display_name']); ?></span>
                                        </span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                            
                            <div class="flex justify-end">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Mübadilə seçimləri -->
                <div id="exchange-preferences" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-exchange-alt text-primary mr-2"></i>
                            Mübadilə seçimləri
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Hansı növ əşyalar almaq istədiyinizi və hansı şərtlərlə mübadilə etməyə hazır olduğunuzu bildirin. Bu, sizə daha uyğun təkliflər əldə etməyə kömək edəcək.
                        </p>
                        
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="update_exchange_preferences">
                            
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Maraqlandığınız kateqoriyalar</label>
                                
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                                    <?php foreach ($categories as $category): ?>
                                        <label class="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="preferred_categories[]" 
                                                value="<?php echo $category['id']; ?>"
                                                <?php echo isset($exchange_preferences['categories']) && in_array($category['id'], $exchange_preferences['categories']) ? 'checked' : ''; ?>
                                                class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            >
                                            <span class="ml-2 flex items-center">
                                                <i class="<?php echo $category['icon']; ?> mr-1 text-primary"></i>
                                                <span class="text-sm"><?php echo htmlspecialchars($category['display_name']); ?></span>
                                            </span>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label for="preferred_locations" class="block text-sm font-medium text-gray-700 mb-1">Tercih etdiyiniz bölgələr</label>
                                <input 
                                    type="text" 
                                    id="preferred_locations" 
                                    name="preferred_locations" 
                                    value="<?php echo isset($exchange_preferences['locations']) ? htmlspecialchars(implode(', ', $exchange_preferences['locations'])) : ''; ?>" 
                                    placeholder="Məsələn: Bakı, Sumqayıt, Gəncə"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                <p class="text-sm text-gray-500 mt-1">
                                    Vergül ilə ayıraraq daxil edin.
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <label for="exchange_notes" class="block text-sm font-medium text-gray-700 mb-1">Əlavə qeydlər</label>
                                <textarea 
                                    id="exchange_notes" 
                                    name="exchange_notes" 
                                    rows="3" 
                                    placeholder="Məsələn: Yalnız yeni və ya yaxşı vəziyyətdə olan əşyalar qəbul edirəm. Yük çatdırılma xərcləri barədə razılaşmalıyıq."
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                ><?php echo isset($exchange_preferences['notes']) ? htmlspecialchars($exchange_preferences['notes']) : ''; ?></textarea>
                            </div>
                            
                            <div class="flex justify-end">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Sosial profillər -->
                <div id="social-links" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-share-alt text-primary mr-2"></i>
                            Sosial profillər
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Sosial media profillərini əlavə et. Bu məlumatlar yalnız sizin icazənizlə istifadəçilərlə paylaşılacaq.
                        </p>
                        
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="update_social_links">
                            
                            <div class="space-y-4">
                                <div class="flex items-center">
                                    <div class="w-10 flex justify-center">
                                        <i class="fab fa-facebook text-blue-600 text-xl"></i>
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <input 
                                            type="text" 
                                            name="facebook" 
                                            value="<?php echo isset($social_links['facebook']) ? htmlspecialchars($social_links['facebook']) : ''; ?>" 
                                            placeholder="Facebook profil linki"
                                            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                    </div>
                                </div>
                                
                                <div class="flex items-center">
                                    <div class="w-10 flex justify-center">
                                        <i class="fab fa-instagram text-pink-600 text-xl"></i>
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <input 
                                            type="text" 
                                            name="instagram" 
                                            value="<?php echo isset($social_links['instagram']) ? htmlspecialchars($social_links['instagram']) : ''; ?>" 
                                            placeholder="Instagram profil linki"
                                            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                    </div>
                                </div>
                                
                                <div class="flex items-center">
                                    <div class="w-10 flex justify-center">
                                        <i class="fab fa-twitter text-blue-400 text-xl"></i>
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <input 
                                            type="text" 
                                            name="twitter" 
                                            value="<?php echo isset($social_links['twitter']) ? htmlspecialchars($social_links['twitter']) : ''; ?>" 
                                            placeholder="Twitter profil linki"
                                            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                    </div>
                                </div>
                                
                                <div class="flex items-center">
                                    <div class="w-10 flex justify-center">
                                        <i class="fab fa-linkedin text-blue-700 text-xl"></i>
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <input 
                                            type="text" 
                                            name="linkedin" 
                                            value="<?php echo isset($social_links['linkedin']) ? htmlspecialchars($social_links['linkedin']) : ''; ?>" 
                                            placeholder="LinkedIn profil linki"
                                            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                    </div>
                                </div>
                                
                                <div class="flex items-center">
                                    <div class="w-10 flex justify-center">
                                        <i class="fas fa-globe text-gray-600 text-xl"></i>
                                    </div>
                                    <div class="ml-3 flex-1">
                                        <input 
                                            type="text" 
                                            name="website" 
                                            value="<?php echo isset($social_links['website']) ? htmlspecialchars($social_links['website']) : ''; ?>" 
                                            placeholder="Şəxsi veb sayt linki"
                                            class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        >
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-5 flex justify-end">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Bacarıqlar və nailiyyətlər -->
                <div id="skills-achievements" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-award text-primary mr-2"></i>
                            Bacarıqlar və nailiyyətlər
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Bacarıqlarınızı və nailiyyətlərinizi əlavə edin. Bu, digər istifadəçilərə sizi daha yaxşı tanımağa kömək edəcək.
                        </p>
                        
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="update_skills_achievements">
                            
                            <div class="mb-4">
                                <label for="skills" class="block text-sm font-medium text-gray-700 mb-1">Bacarıqlar</label>
                                <input 
                                    type="text" 
                                    id="skills" 
                                    name="skills" 
                                    value="<?php echo implode(', ', $skills); ?>" 
                                    placeholder="Məsələn: Fotoqrafiya, Dizayn, Kompüter təmiri"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                <p class="text-sm text-gray-500 mt-1">
                                    Vergül ilə ayıraraq daxil edin.
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <label for="personality_type" class="block text-sm font-medium text-gray-700 mb-1">Şəxsiyyət növü</label>
                                <select 
                                    id="personality_type" 
                                    name="personality_type" 
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="" <?php echo empty($personality_type) ? 'selected' : ''; ?>>Seçin...</option>
                                    <option value="collector" <?php echo $personality_type === 'collector' ? 'selected' : ''; ?>>Koleksiyaçı</option>
                                    <option value="trader" <?php echo $personality_type === 'trader' ? 'selected' : ''; ?>>Ticarətçi</option>
                                    <option value="hobbyist" <?php echo $personality_type === 'hobbyist' ? 'selected' : ''; ?>>Həvəskar</option>
                                    <option value="professional" <?php echo $personality_type === 'professional' ? 'selected' : ''; ?>>Peşəkar</option>
                                    <option value="designer" <?php echo $personality_type === 'designer' ? 'selected' : ''; ?>>Dizayner</option>
                                    <option value="craftsman" <?php echo $personality_type === 'craftsman' ? 'selected' : ''; ?>>Sənətkar</option>
                                    <option value="recycler" <?php echo $personality_type === 'recycler' ? 'selected' : ''; ?>>Təkrar İstifadəçi</option>
                                    <option value="minimalist" <?php echo $personality_type === 'minimalist' ? 'selected' : ''; ?>>Minimalist</option>
                                </select>
                            </div>
                            
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nailiyyətlər</label>
                                
                                <div id="achievements-container" class="space-y-3 mb-3">
                                    <?php if (!empty($accomplishments)): ?>
                                        <?php foreach ($accomplishments as $index => $accomplishment): ?>
                                            <div class="achievement-item border border-gray-200 rounded-md p-3">
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                                    <div>
                                                        <label class="block text-xs font-medium text-gray-500 mb-1">Başlıq</label>
                                                        <input 
                                                            type="text" 
                                                            name="accomplishments[]" 
                                                            value="<?php echo htmlspecialchars($accomplishment['title']); ?>" 
                                                            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                            placeholder="Məsələn: Mükafat, sertifikat adı"
                                                        >
                                                    </div>
                                                    <div>
                                                        <label class="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                                                        <input 
                                                            type="text" 
                                                            name="accomplishment_dates[]" 
                                                            value="<?php echo htmlspecialchars($accomplishment['date']); ?>" 
                                                            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                            placeholder="Məsələn: 2022-ci il"
                                                        >
                                                    </div>
                                                </div>
                                                <div>
                                                    <label class="block text-xs font-medium text-gray-500 mb-1">Açıqlama</label>
                                                    <textarea 
                                                        name="accomplishment_descriptions[]" 
                                                        rows="2" 
                                                        class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Qısa açıqlama"
                                                    ><?php echo htmlspecialchars($accomplishment['description']); ?></textarea>
                                                </div>
                                                <div class="mt-2 text-right">
                                                    <button type="button" class="remove-achievement text-red-500 hover:text-red-700 text-sm">
                                                        <i class="fas fa-trash-alt"></i> Sil
                                                    </button>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <div class="achievement-item border border-gray-200 rounded-md p-3">
                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <label class="block text-xs font-medium text-gray-500 mb-1">Başlıq</label>
                                                    <input 
                                                        type="text" 
                                                        name="accomplishments[]" 
                                                        class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Məsələn: Mükafat, sertifikat adı"
                                                    >
                                                </div>
                                                <div>
                                                    <label class="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                                                    <input 
                                                        type="text" 
                                                        name="accomplishment_dates[]" 
                                                        class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="Məsələn: 2022-ci il"
                                                    >
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block text-xs font-medium text-gray-500 mb-1">Açıqlama</label>
                                                <textarea 
                                                    name="accomplishment_descriptions[]" 
                                                    rows="2" 
                                                    class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                    placeholder="Qısa açıqlama"
                                                ></textarea>
                                            </div>
                                            <div class="mt-2 text-right">
                                                <button type="button" class="remove-achievement text-red-500 hover:text-red-700 text-sm">
                                                    <i class="fas fa-trash-alt"></i> Sil
                                                </button>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <button 
                                    type="button" 
                                    id="add-achievement"
                                    class="text-primary hover:text-primary-700 text-sm flex items-center"
                                >
                                    <i class="fas fa-plus-circle mr-1"></i> Yeni nailiyyət əlavə et
                                </button>
                            </div>
                            
                            <div class="flex justify-end">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Yadda saxla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Vitrin elanları -->
                <div id="showcase" class="profile-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-star text-primary mr-2"></i>
                            Vitrin elanları
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Profil səhifənizdə xüsusi vurğulanacaq elanlarınızı seçin. Maksimum 3 elan seçə bilərsiniz.
                        </p>
                        
                        <?php if (empty($user_items)): ?>
                            <div class="bg-gray-50 border border-gray-200 rounded-md p-4 text-center my-4">
                                <p class="text-gray-600">
                                    Əvvəlcə elan əlavə edin, daha sonra onları vitrin elanları kimi seçə bilərsiniz.
                                </p>
                                <a href="create-item.php" class="mt-2 inline-block text-primary hover:underline">
                                    <i class="fas fa-plus-circle mr-1"></i> Yeni elan əlavə et
                                </a>
                            </div>
                        <?php else: ?>
                            <form method="POST" action="">
                                <?php echo csrf_field(); ?>
                                <input type="hidden" name="action" value="update_showcase">
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <?php foreach ($user_items as $item): ?>
                                        <?php
                                        // Yalnız aktiv elanlar seçilə bilər
                                        $disabled = $item['status'] !== 'active';
                                        ?>
                                        <label class="relative border border-gray-200 rounded-md overflow-hidden <?php echo $disabled ? 'opacity-50' : 'cursor-pointer hover:border-primary'; ?>">
                                            <input 
                                                type="checkbox" 
                                                name="showcase_items[]" 
                                                value="<?php echo $item['id']; ?>"
                                                <?php echo in_array($item['id'], $showcase_items) ? 'checked' : ''; ?>
                                                <?php echo $disabled ? 'disabled' : ''; ?>
                                                class="sr-only"
                                            >
                                            
                                            <div class="aspect-w-1 aspect-h-1 bg-gray-100">
                                                <?php if (!empty($item['main_image'])): ?>
                                                    <img 
                                                        src="<?php echo htmlspecialchars($item['main_image']); ?>" 
                                                        alt="<?php echo htmlspecialchars($item['title']); ?>" 
                                                        class="object-cover w-full h-full"
                                                    >
                                                <?php else: ?>
                                                    <div class="flex items-center justify-center h-full">
                                                        <i class="fas fa-image text-gray-400 text-3xl"></i>
                                                    </div>
                                                <?php endif; ?>
                                                
                                                <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center showcase-checkbox">
                                                    <i class="fas fa-check text-primary hidden"></i>
                                                </div>
                                            </div>
                                            
                                            <div class="p-3">
                                                <h3 class="font-medium text-gray-900 truncate">
                                                    <?php echo htmlspecialchars($item['title']); ?>
                                                </h3>
                                                <div class="text-xs text-gray-500 mt-1">
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        <?php echo getStatusBadge($item['status']); ?>
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                                
                                <div class="flex justify-end">
                                    <button 
                                        type="submit" 
                                        class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <i class="fas fa-save mr-1"></i> Yadda saxla
                                    </button>
                                </div>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<!-- Nailiyyətlər əlavə etmək üçün JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Nailiyyət əlavə et
    document.getElementById('add-achievement').addEventListener('click', function() {
        const container = document.getElementById('achievements-container');
        const template = `
            <div class="achievement-item border border-gray-200 rounded-md p-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Başlıq</label>
                        <input 
                            type="text" 
                            name="accomplishments[]" 
                            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Məsələn: Mükafat, sertifikat adı"
                        >
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Tarix</label>
                        <input 
                            type="text" 
                            name="accomplishment_dates[]" 
                            class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Məsələn: 2022-ci il"
                        >
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Açıqlama</label>
                    <textarea 
                        name="accomplishment_descriptions[]" 
                        rows="2" 
                        class="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Qısa açıqlama"
                    ></textarea>
                </div>
                <div class="mt-2 text-right">
                    <button type="button" class="remove-achievement text-red-500 hover:text-red-700 text-sm">
                        <i class="fas fa-trash-alt"></i> Sil
                    </button>
                </div>
            </div>
        `;
        
        // HTML əlavə et
        container.insertAdjacentHTML('beforeend', template);
        
        // Yeni əlavə edilmiş elementdə sil düyməsini aktivləşdir
        const newItem = container.lastElementChild;
        const removeButton = newItem.querySelector('.remove-achievement');
        removeButton.addEventListener('click', function() {
            this.closest('.achievement-item').remove();
        });
    });
    
    // Mövcud nailiyyətləri silmək
    document.querySelectorAll('.remove-achievement').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.achievement-item').remove();
        });
    });
    
    // Profil naviqasiya menyusu
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Bütün naviqasiya bəndlərindən aktiv sinifləri sil
            document.querySelectorAll('.profile-nav-link').forEach(item => {
                item.classList.remove('bg-primary', 'bg-opacity-10', 'text-primary');
                item.classList.add('text-gray-700');
            });
            
            // Klik edilmiş bəndə aktiv sinifləri əlavə et
            this.classList.remove('text-gray-700');
            this.classList.add('bg-primary', 'bg-opacity-10', 'text-primary');
            
            // Müvafiq bölməyə scroll et
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Vitrin checkbox
    document.querySelectorAll('input[name="showcase_items[]"]').forEach(checkbox => {
        // İlkin vəziyyəti təyin et
        const checkmarkIcon = checkbox.closest('label').querySelector('.showcase-checkbox i');
        if (checkbox.checked) {
            checkmarkIcon.classList.remove('hidden');
        }
        
        // Checkbox dəyişdikdə
        checkbox.addEventListener('change', function() {
            const checkmarkIcon = this.closest('label').querySelector('.showcase-checkbox i');
            
            if (this.checked) {
                checkmarkIcon.classList.remove('hidden');
                
                // Maksimum 3 elan yoxla
                const checkedItems = document.querySelectorAll('input[name="showcase_items[]"]:checked');
                if (checkedItems.length > 3) {
                    this.checked = false;
                    checkmarkIcon.classList.add('hidden');
                    alert('Maksimum 3 vitrin elanı seçə bilərsiniz.');
                }
            } else {
                checkmarkIcon.classList.add('hidden');
            }
        });
    });
});

// Helper funksiyalar
function getStatusBadge(status) {
    switch (status) {
        case 'active':
            return '<i class="fas fa-circle text-green-500 mr-1 text-xs"></i> Aktiv';
        case 'pending':
            return '<i class="fas fa-clock text-yellow-500 mr-1 text-xs"></i> Gözləmədə';
        case 'completed':
            return '<i class="fas fa-check-circle text-blue-500 mr-1 text-xs"></i> Tamamlanmış';
        case 'inactive':
            return '<i class="fas fa-pause-circle text-gray-500 mr-1 text-xs"></i> Deaktiv';
        case 'deleted':
            return '<i class="fas fa-trash-alt text-red-500 mr-1 text-xs"></i> Silinmiş';
        default:
            return status;
    }
}
</script>

<?php
require_once 'includes/footer.php';
?>