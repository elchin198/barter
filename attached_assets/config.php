<?php
/**
 * BarterTap.az - Konfiqurasiya faylı
 */

// Sessiya başlat
session_start();

// Xəta mesajlarını göstər (development mühitində; production-da false edin)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Verilənlər bazası quraşdırmaları
$db_config = [
    'host' => 'localhost', // Hostinger: təyin ediləcək host (MySQL Host)
    'dbname' => 'bartertap_db', // Hostinger: təyin ediləcək verilənlər bazası
    'username' => 'root', // Hostinger: təyin ediləcək istifadəçi
    'password' => '', // Hostinger: təyin ediləcək şifrə
    'charset' => 'utf8mb4' 
];

// Sayt məlumatları
$site = [
    'name' => 'BarterTap.az',
    'description' => 'Azərbaycanda ilk onlayn barter platforması. Əşya satmağa deyil, dəyişməyə gəlin!',
    'url' => 'https://bartertap.az',
    'email' => 'info@bartertap.az',
    'phone' => '+994 50 123 45 67',
    'address' => 'Bakı şəhəri, Nərimanov rayonu',
    'facebook' => 'https://facebook.com/bartertap.az',
    'instagram' => 'https://instagram.com/bartertap.az',
    'twitter' => 'https://twitter.com/bartertap_az',
    'youtube' => 'https://youtube.com/bartertap_az'
];

// PDO bağlantısı
try {
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset={$db_config['charset']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
} catch (PDOException $e) {
    // Verilənlər bazası xətası baş verdi (development üçün göstərilir; production-da loglamaq lazımdır)
    if (strpos($e->getMessage(), "Unknown database") !== false) {
        // Verilənlər bazası mövcud deyil, setup-database.php yönləndirmək üçün
        header("Location: setup-database.php");
        exit;
    } else {
        die("Verilənlər bazası bağlantısı xətası: " . $e->getMessage());
    }
}

// Utilit funksiyaları

/**
 * Daxil edilən məlumatları təmizləyir
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Təsadüfi token yaradır
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Sessiyada mesaj saxlayır
 */
function setMessage($type, $message) {
    $_SESSION['message'] = [
        'type' => $type,
        'text' => $message
    ];
}

/**
 * Uğurlu mesaj əlavə edir
 */
function setSuccessMessage($message) {
    setMessage('success', $message);
}

/**
 * Xəta mesaj əlavə edir
 */
function setErrorMessage($message) {
    setMessage('error', $message);
}

/**
 * İnfo mesaj əlavə edir
 */
function setInfoMessage($message) {
    setMessage('info', $message);
}

/**
 * Mesaj göstərir və silir
 */
function showMessage() {
    if (isset($_SESSION['message'])) {
        $message = $_SESSION['message'];
        unset($_SESSION['message']);
        
        $class = '';
        $icon = '';
        
        switch ($message['type']) {
            case 'success':
                $class = 'bg-green-100 border-green-500 text-green-700';
                $icon = 'fas fa-check-circle text-green-500';
                break;
            case 'error':
                $class = 'bg-red-100 border-red-500 text-red-700';
                $icon = 'fas fa-exclamation-circle text-red-500';
                break;
            case 'info':
                $class = 'bg-blue-100 border-blue-500 text-blue-700';
                $icon = 'fas fa-info-circle text-blue-500';
                break;
            default:
                $class = 'bg-gray-100 border-gray-500 text-gray-700';
                $icon = 'fas fa-info-circle text-gray-500';
        }
        
        echo '<div class="' . $class . ' border-l-4 p-4 mb-4 flex items-start">';
        echo '<i class="' . $icon . ' mr-3 mt-1"></i>';
        echo '<div>' . $message['text'] . '</div>';
        echo '</div>';
    }
}

/**
 * İstifadəçinin giriş edib-etmədiyini yoxlayır
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Giriş etməyən istifadəçiləri giriş səhifəsinə yönləndirir
 */
function requireLogin() {
    if (!isLoggedIn()) {
        $current_url = urlencode($_SERVER['REQUEST_URI']);
        setErrorMessage("Bu səhifəyə daxil olmaq üçün əvvəlcə sistemə giriş etməlisiniz.");
        header("Location: login.php?redirect=$current_url");
        exit;
    }
}

/**
 * İstifadəçi məlumatlarını qaytarır
 */
function getCurrentUser() {
    global $pdo;
    
    if (!isLoggedIn()) {
        return null;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

/**
 * Vaxtı formatlaşdırır
 */
function formatDate($date, $format = 'd.m.Y') {
    return date($format, strtotime($date));
}

/**
 * Tarixin nə qədər əvvəl olduğunu göstərir (məsələn, "2 gün əvvəl")
 */
function timeAgo($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return "İndicə";
    } elseif ($diff < 3600) {
        $mins = floor($diff / 60);
        return $mins . " dəqiqə əvvəl";
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . " saat əvvəl";
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . " gün əvvəl";
    } elseif ($diff < 2592000) {
        $weeks = floor($diff / 604800);
        return $weeks . " həftə əvvəl";
    } elseif ($diff < 31536000) {
        $months = floor($diff / 2592000);
        return $months . " ay əvvəl";
    } else {
        $years = floor($diff / 31536000);
        return $years . " il əvvəl";
    }
}

/**
 * Mətnin qısa variantını yaradır
 */
function truncateText($text, $length = 100, $append = '...') {
    if (strlen($text) <= $length) {
        return $text;
    }
    
    $text = substr($text, 0, $length);
    $text = substr($text, 0, strrpos($text, ' '));
    return $text . $append;
}

/**
 * Qiymət formatını tətbiq edir
 */
function formatPrice($price) {
    return number_format($price, 2, '.', ' ') . ' ₼';
}

/**
 * Təhlükəsiz URL slug yaradır
 */
function createSlug($str) {
    // Azərbaycan dilində xüsusi simvolları dəyişdirin
    $str = str_replace(['ə', 'Ə'], 'e', $str);
    $str = str_replace(['ı', 'İ'], 'i', $str);
    $str = str_replace(['ö', 'Ö'], 'o', $str);
    $str = str_replace(['ü', 'Ü'], 'u', $str);
    $str = str_replace(['ğ', 'Ğ'], 'g', $str);
    $str = str_replace(['ç', 'Ç'], 'c', $str);
    $str = str_replace(['ş', 'Ş'], 's', $str);
    
    // Simvolları təmizləyin
    $str = preg_replace('/[^a-zA-Z0-9\s]/', '', $str);
    $str = strtolower(trim($str));
    $str = preg_replace('/\s+/', '-', $str);
    
    return $str;
}

/**
 * Cari səhifə URL-ini qaytarır
 */
function currentUrl() {
    return (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
}

/**
 * İtem Status rəngləri
 */
function getStatusClass($status) {
    switch ($status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'completed':
            return 'bg-purple-100 text-purple-800';
        case 'inactive':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

/**
 * İtem Status adları
 */
function getStatusName($status) {
    switch ($status) {
        case 'active':
            return 'Aktiv';
        case 'pending':
            return 'Gözləmədə';
        case 'completed':
            return 'Tamamlandı';
        case 'inactive':
            return 'Deaktiv';
        default:
            return 'Naməlum';
    }
}

// CSRF (Cross-Site Request Forgery) qorunması
function csrf_token() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field() {
    return '<input type="hidden" name="csrf_token" value="' . csrf_token() . '">';
}

function validate_csrf_token() {
    if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        setErrorMessage("Təhlükəsizlik xətası: CSRF token yanlış və ya mövcud deyil.");
        header("Location: " . $_SERVER['HTTP_REFERER'] ?? 'index.php');
        exit;
    }
}