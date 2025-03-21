<?php
// Təhlükəsizlik tənzimləmələri səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Təhlükəsizlik Tənzimləmələri | BarterTap.az";
$page_description = "BarterTap.az platformasında hesab təhlükəsizliyi və məxfilik tənzimləmələrinizi idarə edin.";

// İki faktorlu doğrulama (2FA) statusu
$stmt = $pdo->prepare("SELECT two_factor_enabled, email FROM users WHERE id = ?");
$stmt->execute([$current_user['id']]);
$security_info = $stmt->fetch();

$two_factor_enabled = $security_info['two_factor_enabled'] ?? false;
$email = $security_info['email'];

// Uğur və xəta mesajları
$success = '';
$error = '';

// Form göndərməni emal et
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF yoxlaması
    validate_csrf_token();
    
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    // İki faktorlu doğrulamanı aktivləşdir/deaktiv et
    if ($action === 'toggle_2fa') {
        $enable_2fa = isset($_POST['enable_2fa']) ? (bool)$_POST['enable_2fa'] : false;
        
        try {
            // İstifadəçi email-i doğrulama kodu ilə yoxlayıb 2FA-nı aktivləşdirmək istəyirsə
            if ($enable_2fa) {
                // Təsadüfi 6 rəqəmli kod yarat
                $verification_code = sprintf("%06d", mt_rand(0, 999999));
                
                // Kodu sessiyanı saxlayın (real mühitdə verilənlər bazasında saxlanılmalıdır)
                $_SESSION['two_factor_code'] = $verification_code;
                $_SESSION['two_factor_expiry'] = time() + 600; // 10 dəqiqə
                
                // Email-lə kodu göndər
                $to = $email;
                $subject = "BarterTap.az - İki faktorlu doğrulama kodu";
                $message = "Salam,\n\n";
                $message .= "İki faktorlu doğrulamanı aktivləşdirmək üçün kodunuz: $verification_code\n\n";
                $message .= "Bu kod 10 dəqiqə ərzində etibarlıdır.\n\n";
                $message .= "Əgər siz bu kodu tələb etməmisinizsə, zəhmət olmasa bu emaili nəzərə almayın.\n\n";
                $message .= "Hörmətlə,\n";
                $message .= "BarterTap.az Komandası";
                
                $headers = "From: noreply@bartertap.az\r\n";
                
                if (mail($to, $subject, $message, $headers)) {
                    // Uğurlu mesaj
                    $success = "Doğrulama kodu email-inizə göndərildi. Zəhmət olmasa emailinizi yoxlayın və kodu daxil edin.";
                    
                    // Kod göndərilmə vaxtını qeyd et
                    $_SESSION['two_factor_code_sent'] = true;
                } else {
                    $error = "Doğrulama kodu göndərilə bilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.";
                }
            } else {
                // 2FA-nı deaktiv et
                // Əvvəlcə şifrəni yoxla
                $password = isset($_POST['current_password']) ? $_POST['current_password'] : '';
                
                if (empty($password)) {
                    $error = "Təhlükəsizlik tənzimləmələrini dəyişmək üçün cari şifrənizi daxil edin.";
                } else {
                    // Şifrəni yoxla
                    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
                    $stmt->execute([$current_user['id']]);
                    $stored_hash = $stmt->fetchColumn();
                    
                    if (comparePasswords($password, $stored_hash)) {
                        // Şifrə doğrudur, 2FA-nı deaktiv et
                        $stmt = $pdo->prepare("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?");
                        $stmt->execute([$current_user['id']]);
                        
                        // Uğurlu mesaj
                        $success = "İki faktorlu doğrulama uğurla deaktiv edildi.";
                        
                        // Statusu yenilə
                        $two_factor_enabled = false;
                    } else {
                        $error = "Yanlış şifrə. Zəhmət olmasa cari şifrənizi düzgün daxil edin.";
                    }
                }
            }
        } catch (Exception $e) {
            $error = "Xəta baş verdi: " . $e->getMessage();
        }
    }
    
    // 2FA doğrulama kodunu təsdiq et
    if ($action === 'verify_2fa_code') {
        $entered_code = isset($_POST['verification_code']) ? $_POST['verification_code'] : '';
        
        if (empty($entered_code)) {
            $error = "Zəhmət olmasa doğrulama kodunu daxil edin.";
        } elseif (!isset($_SESSION['two_factor_code']) || !isset($_SESSION['two_factor_expiry'])) {
            $error = "Doğrulama kodu tapılmadı və ya müddəti bitib. Zəhmət olmasa yenidən cəhd edin.";
        } elseif ($_SESSION['two_factor_expiry'] < time()) {
            $error = "Doğrulama kodunun müddəti bitib. Zəhmət olmasa yenidən cəhd edin.";
        } elseif ($_SESSION['two_factor_code'] !== $entered_code) {
            $error = "Yanlış doğrulama kodu. Zəhmət olmasa yenidən cəhd edin.";
        } else {
            try {
                // Kod doğrudur, 2FA-nı aktivləşdir
                // Təsadüfi gizli açar yarat (real mühitdə TOTP üçün istifadə olunur)
                $two_factor_secret = bin2hex(random_bytes(16));
                
                // İstifadəçi məlumatlarını yenilə
                $stmt = $pdo->prepare("UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?");
                $stmt->execute([$two_factor_secret, $current_user['id']]);
                
                // Sessiya dəyişənlərini təmizlə
                unset($_SESSION['two_factor_code']);
                unset($_SESSION['two_factor_expiry']);
                unset($_SESSION['two_factor_code_sent']);
                
                // Uğurlu mesaj
                $success = "İki faktorlu doğrulama uğurla aktivləşdirildi. İndi hesabınız daha təhlükəsizdir!";
                
                // Statusu yenilə
                $two_factor_enabled = true;
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        }
    }
    
    // Şifrə dəyişdirmə
    if ($action === 'change_password') {
        $current_password = isset($_POST['current_password']) ? $_POST['current_password'] : '';
        $new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';
        $confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';
        
        if (empty($current_password)) {
            $error = "Cari şifrənizi daxil edin.";
        } elseif (empty($new_password)) {
            $error = "Yeni şifrənizi daxil edin.";
        } elseif (strlen($new_password) < 8) {
            $error = "Şifrə ən azı 8 simvol uzunluğunda olmalıdır.";
        } elseif ($new_password !== $confirm_password) {
            $error = "Yeni şifrə təsdiqi uyğun gəlmir.";
        } else {
            try {
                // Cari şifrəni yoxla
                $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$current_user['id']]);
                $stored_hash = $stmt->fetchColumn();
                
                if (comparePasswords($current_password, $stored_hash)) {
                    // Şifrə doğrudur, yeni şifrəni hashləyib yadda saxla
                    $hashed_password = hashPassword($new_password);
                    
                    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                    $stmt->execute([$hashed_password, $current_user['id']]);
                    
                    // Uğurlu mesaj
                    $success = "Şifrəniz uğurla dəyişdirildi.";
                } else {
                    $error = "Cari şifrə yanlışdır.";
                }
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        }
    }
    
    // Sessiya təhlükəsizliyi
    if ($action === 'session_security') {
        $logout_all = isset($_POST['logout_all']) ? (bool)$_POST['logout_all'] : false;
        
        if ($logout_all) {
            try {
                // İstifadəçinin bütün digər sessiyalarını sonlandır
                // Cari sessiya token-ini saxla
                $current_session_token = $_SESSION['session_token'] ?? null;
                
                // Sessiyanı yenilə
                session_regenerate_id(true);
                
                // Verilənlər bazasında digər sessiyaları təmizlə (real mühitdə)
                $stmt = $pdo->prepare("UPDATE user_sessions SET active = 0 WHERE user_id = ? AND session_token != ?");
                $stmt->execute([$current_user['id'], $current_session_token]);
                
                // Uğurlu mesaj
                $success = "Bütün digər cihazlardan çıxış edildi.";
            } catch (Exception $e) {
                $error = "Xəta baş verdi: " . $e->getMessage();
            }
        }
    }
}

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Səhifə başlığı -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Təhlükəsizlik Tənzimləmələri</h1>
            <p class="text-gray-600">Hesabınızın təhlükəsizliyini və məxfiliyini idarə edin</p>
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
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Sol panel - Təhlükəsizlik menüsü -->
            <div class="md:col-span-1">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                    <div class="p-4 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900">Təhlükəsizlik Menüsü</h2>
                    </div>
                    
                    <div class="p-2">
                        <nav class="space-y-1">
                            <a href="#password" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-lock w-5 text-gray-400 mr-2"></i>
                                <span>Şifrə dəyişdirmə</span>
                            </a>
                            <a href="#two-factor" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-shield-alt w-5 text-gray-400 mr-2"></i>
                                <span>İki faktorlu doğrulama</span>
                            </a>
                            <a href="#sessions" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-desktop w-5 text-gray-400 mr-2"></i>
                                <span>Aktiv sessiyalar</span>
                            </a>
                            <a href="#account-activity" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                                <i class="fas fa-history w-5 text-gray-400 mr-2"></i>
                                <span>Hesab aktivliyi</span>
                            </a>
                        </nav>
                    </div>
                </div>
            </div>
            
            <!-- Sağ panel - Tənzimləmələr -->
            <div class="md:col-span-2 space-y-6">
                <!-- Şifrə dəyişdirmə -->
                <div id="password" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-lock text-primary mr-2"></i>
                            Şifrə dəyişdirmə
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="change_password">
                            
                            <div class="mb-4">
                                <label for="current_password" class="block text-sm font-medium text-gray-700 mb-1">Cari şifrə</label>
                                <input 
                                    type="password" 
                                    id="current_password" 
                                    name="current_password" 
                                    required
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                            </div>
                            
                            <div class="mb-4">
                                <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1">Yeni şifrə</label>
                                <input 
                                    type="password" 
                                    id="new_password" 
                                    name="new_password" 
                                    required
                                    minlength="8"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                <p class="text-sm text-gray-500 mt-1">
                                    Şifrə ən azı 8 simvol uzunluğunda olmalıdır.
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">Yeni şifrəni təsdiqlə</label>
                                <input 
                                    type="password" 
                                    id="confirm_password" 
                                    name="confirm_password" 
                                    required
                                    minlength="8"
                                    class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                            </div>
                            
                            <div class="mt-5">
                                <button 
                                    type="submit" 
                                    class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-save mr-1"></i> Şifrəni dəyişdir
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- İki faktorlu doğrulama (2FA) -->
                <div id="two-factor" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-shield-alt text-primary mr-2"></i>
                            İki faktorlu doğrulama
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-medium text-gray-900">
                                    <?php echo $two_factor_enabled ? 'İki faktorlu doğrulama aktivdir' : 'İki faktorlu doğrulama deaktivdir'; ?>
                                </h3>
                                <p class="text-sm text-gray-600">
                                    İki faktorlu doğrulama ilə hesabınızı daha da təhlükəsiz edin. Aktivləşdirildiyi halda, 
                                    hər dəfə daxil olarkən əlavə təhlükəsizlik kodu tələb olunacaq.
                                </p>
                            </div>
                            
                            <?php if ($two_factor_enabled): ?>
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <i class="fas fa-check-circle mr-1"></i> Aktiv
                                </span>
                            <?php else: ?>
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    <i class="fas fa-times-circle mr-1"></i> Deaktiv
                                </span>
                            <?php endif; ?>
                        </div>
                        
                        <?php if (!$two_factor_enabled): ?>
                            <?php if (isset($_SESSION['two_factor_code_sent'])): ?>
                                <!-- Doğrulama kodu daxil etmə formu -->
                                <form method="POST" action="" class="mt-4 p-4 bg-blue-50 rounded-md">
                                    <?php echo csrf_field(); ?>
                                    <input type="hidden" name="action" value="verify_2fa_code">
                                    
                                    <p class="text-sm text-blue-700 mb-3">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        Email ünvanınıza doğrulama kodu göndərildi. Zəhmət olmasa emailinizi yoxlayın 
                                        və aşağıdakı formaya kodu daxil edin. Kod 10 dəqiqə ərzində etibarlıdır.
                                    </p>
                                    
                                    <div class="flex items-center space-x-2">
                                        <input 
                                            type="text" 
                                            name="verification_code" 
                                            placeholder="6 rəqəmli kod"
                                            maxlength="6"
                                            pattern="\d{6}"
                                            class="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            required
                                        >
                                        
                                        <button 
                                            type="submit" 
                                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <i class="fas fa-check mr-1"></i> Təsdiqlə
                                        </button>
                                    </div>
                                </form>
                            <?php else: ?>
                                <!-- 2FA aktivləşdirmə formu -->
                                <form method="POST" action="" class="mt-4">
                                    <?php echo csrf_field(); ?>
                                    <input type="hidden" name="action" value="toggle_2fa">
                                    <input type="hidden" name="enable_2fa" value="1">
                                    
                                    <button 
                                        type="submit" 
                                        class="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <i class="fas fa-shield-alt mr-1"></i> İki faktorlu doğrulamanı aktivləşdir
                                    </button>
                                </form>
                            <?php endif; ?>
                        <?php else: ?>
                            <!-- 2FA deaktiv etmə formu -->
                            <form method="POST" action="" class="mt-4">
                                <?php echo csrf_field(); ?>
                                <input type="hidden" name="action" value="toggle_2fa">
                                <input type="hidden" name="enable_2fa" value="0">
                                
                                <div class="mb-4">
                                    <label for="current_password_2fa" class="block text-sm font-medium text-gray-700 mb-1">Cari şifrə</label>
                                    <input 
                                        type="password" 
                                        id="current_password_2fa" 
                                        name="current_password" 
                                        required
                                        class="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    >
                                    <p class="text-sm text-gray-500 mt-1">
                                        Təhlükəsizlik səbəbilə, 2FA-nı deaktiv etmək üçün cari şifrənizi daxil edin.
                                    </p>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <i class="fas fa-shield-alt mr-1"></i> İki faktorlu doğrulamanı deaktiv et
                                </button>
                            </form>
                            
                            <div class="mt-4 p-4 bg-yellow-50 rounded-md">
                                <div class="flex items-start">
                                    <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5 mr-2"></i>
                                    <div>
                                        <h4 class="text-sm font-medium text-yellow-800">Diqqət!</h4>
                                        <p class="text-sm text-yellow-700 mt-1">
                                            İki faktorlu doğrulamanı deaktiv etmək hesabınızın təhlükəsizliyini azaldır. 
                                            Yalnız çox zəruri hallarda deaktiv edin.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Aktiv sessiyalar -->
                <div id="sessions" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-desktop text-primary mr-2"></i>
                            Aktiv sessiyalar
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Buradan digər cihazlarda aktiv olan sessiyalarınızı idarə edə bilərsiniz. 
                            Naməlum bir cihaz və ya brauzerdən daxil olmuşsunuzsa, bütün sessiyaları sonlandırmağınız tövsiyə olunur.
                        </p>
                        
                        <div class="mb-4 p-4 bg-gray-50 rounded-md">
                            <div class="flex items-start">
                                <div class="flex-shrink-0 mr-3">
                                    <i class="fas fa-laptop text-gray-500"></i>
                                </div>
                                
                                <div class="flex-1">
                                    <div class="flex justify-between items-center mb-1">
                                        <h4 class="font-medium text-gray-900">Cari cihaz</h4>
                                        <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Aktiv</span>
                                    </div>
                                    
                                    <div class="text-sm text-gray-600">
                                        <p class="mb-1">
                                            <i class="fas fa-globe mr-1"></i> 
                                            <?php echo htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown browser'); ?>
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-map-marker-alt mr-1"></i> 
                                            <?php echo htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'Unknown location'); ?>
                                        </p>
                                        <p>
                                            <i class="fas fa-clock mr-1"></i> 
                                            Daxil olma vaxtı: <?php echo date('d.m.Y H:i'); ?>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <form method="POST" action="">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="action" value="session_security">
                            <input type="hidden" name="logout_all" value="1">
                            
                            <button 
                                type="submit" 
                                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                <i class="fas fa-sign-out-alt mr-1"></i> Bütün digər cihazlardan çıxış et
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Hesab aktivliyi -->
                <div id="account-activity" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-5 bg-gray-50 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-900 flex items-center">
                            <i class="fas fa-history text-primary mr-2"></i>
                            Hesab aktivliyi
                        </h2>
                    </div>
                    
                    <div class="p-5">
                        <p class="text-sm text-gray-600 mb-4">
                            Hesabınızla bağlı son aktivliklər. Naməlum aktivlik görürsünüzsə, şifrənizi dəyişdirin və bütün sessiyaları sonlandırın.
                        </p>
                        
                        <?php
                        // Son aktivlikləri əldə et (nümunə)
                        $activities = [
                            [
                                'type' => 'login',
                                'date' => date('Y-m-d H:i:s', strtotime('-1 hour')),
                                'ip' => $_SERVER['REMOTE_ADDR'],
                                'device' => 'Current browser'
                            ],
                            [
                                'type' => 'password_change',
                                'date' => date('Y-m-d H:i:s', strtotime('-2 days')),
                                'ip' => '192.168.1.100',
                                'device' => 'Firefox on Windows'
                            ],
                            [
                                'type' => 'login',
                                'date' => date('Y-m-d H:i:s', strtotime('-3 days')),
                                'ip' => '192.168.1.100',
                                'device' => 'Firefox on Windows'
                            ]
                        ];
                        
                        // Aktivlik növlərini tərcümə et
                        $activity_types = [
                            'login' => 'Daxil olma',
                            'logout' => 'Çıxış',
                            'password_change' => 'Şifrə dəyişdirmə',
                            'profile_update' => 'Profil yeniləmə',
                            'two_factor_enabled' => 'İki faktorlu doğrulama aktivləşdirildi',
                            'two_factor_disabled' => 'İki faktorlu doğrulama deaktiv edildi'
                        ];
                        ?>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aktivlik növü
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tarix
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IP ünvan
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cihaz
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <?php foreach ($activities as $activity): ?>
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center">
                                                    <?php if ($activity['type'] === 'login'): ?>
                                                        <i class="fas fa-sign-in-alt text-green-500 mr-2"></i>
                                                    <?php elseif ($activity['type'] === 'logout'): ?>
                                                        <i class="fas fa-sign-out-alt text-red-500 mr-2"></i>
                                                    <?php elseif ($activity['type'] === 'password_change'): ?>
                                                        <i class="fas fa-key text-yellow-500 mr-2"></i>
                                                    <?php else: ?>
                                                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                                    <?php endif; ?>
                                                    
                                                    <span class="text-sm text-gray-900">
                                                        <?php echo $activity_types[$activity['type']] ?? $activity['type']; ?>
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <?php echo date('d.m.Y H:i', strtotime($activity['date'])); ?>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <?php echo htmlspecialchars($activity['ip']); ?>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <?php echo htmlspecialchars($activity['device']); ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<?php
require_once 'includes/footer.php';
?>