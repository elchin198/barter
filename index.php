<?php
/**
 * BarterTap.az - Ana səhifə
 * 
 * Bu fayl veb saytın əsas giriş nöqtəsidir. Hostinger mühitində işləyir.
 * Bütün ismarıcları münasib şəkildə emal edir və yönləndirir.
 */

// Hostinger mühiti üçün konfiqurasiya
$isApi = false;

// Sorğu yolunu yoxla
$request_uri = $_SERVER['REQUEST_URI'];

// API sorğusudursa
if (strpos($request_uri, '/api/') === 0) {
    $isApi = true;
    include 'api.php';
    exit;
}

// Əgər fiziki fayl mövcuddursa, onu göndərin
$request_path = parse_url($request_uri, PHP_URL_PATH);
$file_path = __DIR__ . $request_path;

if (file_exists($file_path) && !is_dir($file_path) && $request_path !== '/index.php') {
    // Faylın tipini müəyyən et
    $extension = pathinfo($file_path, PATHINFO_EXTENSION);
    $mime_types = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        'eot' => 'application/vnd.ms-fontobject',
        'ico' => 'image/x-icon',
        'pdf' => 'application/pdf',
        'txt' => 'text/plain',
        'xml' => 'application/xml',
    ];
    
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    readfile($file_path);
    exit;
}

// Bütün başqa hallar üçün index.html-ə yönləndir (SPA üçün)
include 'index.html';
exit;
?>