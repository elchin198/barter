<?php
/**
 * BarterTap.az - Şifrələmə funksiyaları
 * 
 * Bu fayl, verilənlərin şifrələnməsi və şifrələrin açılması üçün funksiyalar təmin edir.
 */

/**
 * Həssas məlumatları şifrələ
 * 
 * @param string $data Şifrələnəcək məlumat
 * @param string|null $custom_key Xüsusi şifrələmə açarı (dəstəklənərsə)
 * @return string Şifrələnmiş məlumat
 */
function encryptData($data, $custom_key = null) {
    if (empty($data)) {
        return '';
    }
    
    // Xüsusi açarı yoxla
    $encryption_key = $custom_key ?? getEncryptionKey();
    
    // Təsadüfi initialization vector (IV) yarat
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    
    // Verilənləri şifrələ
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', $encryption_key, 0, $iv);
    
    // IV və şifrələnmiş verilənləri birləşdir və base64 kodla
    $result = base64_encode($iv . $encrypted);
    
    return $result;
}

/**
 * Şifrələnmiş məlumatları aç
 * 
 * @param string $data Şifrələnmiş məlumat
 * @param string|null $custom_key Xüsusi şifrələmə açarı (dəstəklənərsə)
 * @return string|false Açılmış məlumat və ya xəta olduqda false
 */
function decryptData($data, $custom_key = null) {
    if (empty($data)) {
        return '';
    }
    
    // Xüsusi açarı yoxla
    $encryption_key = $custom_key ?? getEncryptionKey();
    
    // Base64 dekodla
    $data = base64_decode($data);
    
    // IV-ni ayır
    $iv_size = openssl_cipher_iv_length('aes-256-cbc');
    $iv = substr($data, 0, $iv_size);
    
    // Şifrələnmiş verilənləri ayır
    $encrypted = substr($data, $iv_size);
    
    // Məlumatları deşifrələ
    $decrypted = openssl_decrypt($encrypted, 'aes-256-cbc', $encryption_key, 0, $iv);
    
    return $decrypted;
}

/**
 * Əsas şifrələmə açarını əldə et
 * 
 * @return string Şifrələmə açarı
 */
function getEncryptionKey() {
    // Mühitdən açarı əldə et və ya default açar istifadə et
    $key = getenv('ENCRYPTION_KEY');
    
    if (empty($key)) {
        // Təhlükəsizlik üçün açarı konfiqurasiya faylında və ya mühit dəyişənlərində saxlamaq daha yaxşıdır
        // Bu sadəcə nümunə üçündür, real layihədə bu açar təhlükəsiz şəkildə saxlanılmalıdır
        $key = 'bartertap_default_encryption_key_change_this_in_production';
    }
    
    // 32 bayt uzunluğunda açarı qaytarın (AES-256 üçün)
    return substr(hash('sha256', $key, true), 0, 32);
}

/**
 * İki istiqamətli şifrələmədən istifadə etdiyimiz sahələri şifrələ
 * 
 * @param array $data Şifrələnəcək massiv
 * @param array $fields_to_encrypt Şifrələnəcək sahələr
 * @return array Şifrələnmiş verilənlər
 */
function encryptFields($data, $fields_to_encrypt = []) {
    if (empty($data) || empty($fields_to_encrypt)) {
        return $data;
    }
    
    foreach ($fields_to_encrypt as $field) {
        if (isset($data[$field]) && !empty($data[$field])) {
            $data[$field] = encryptData($data[$field]);
        }
    }
    
    return $data;
}

/**
 * Şifrələnmiş sahələri aç
 * 
 * @param array $data Şifrələnmiş massiv
 * @param array $fields_to_decrypt Açılacaq sahələr
 * @return array Açılmış verilənlər
 */
function decryptFields($data, $fields_to_decrypt = []) {
    if (empty($data) || empty($fields_to_decrypt)) {
        return $data;
    }
    
    foreach ($fields_to_decrypt as $field) {
        if (isset($data[$field]) && !empty($data[$field])) {
            $data[$field] = decryptData($data[$field]);
        }
    }
    
    return $data;
}

/**
 * API tələbi üçün HMAC imzası yarat
 * 
 * @param string $method HTTP metodu (GET, POST, etc.)
 * @param string $endpoint API endpoint
 * @param array $params Sorğu parametrləri
 * @param string $secret_key Gizli açar
 * @return string HMAC imzası
 */
function generateApiSignature($method, $endpoint, $params, $secret_key) {
    // Parametrləri əlifba sırası ilə düz
    ksort($params);
    
    // Sorğu mətni yarat
    $query_string = '';
    foreach ($params as $key => $value) {
        $query_string .= "$key=$value&";
    }
    $query_string = rtrim($query_string, '&');
    
    // İmzalama mətni yarat
    $string_to_sign = strtoupper($method) . "\n" . $endpoint . "\n" . $query_string;
    
    // HMAC-SHA256 ilə imzala
    $signature = hash_hmac('sha256', $string_to_sign, $secret_key);
    
    return $signature;
}

/**
 * API imzasını yoxla
 * 
 * @param string $method HTTP metodu
 * @param string $endpoint API endpoint
 * @param array $params Sorğu parametrləri
 * @param string $expected_signature Gözlənilən imza
 * @param string $secret_key Gizli açar
 * @return bool İmza düzgündürmü?
 */
function verifyApiSignature($method, $endpoint, $params, $expected_signature, $secret_key) {
    $calculated_signature = generateApiSignature($method, $endpoint, $params, $secret_key);
    return hash_equals($calculated_signature, $expected_signature);
}

/**
 * Təsadüfi token yarat
 * 
 * @param int $length Token uzunluğu
 * @return string Yaradılan token
 */
function generateRandomToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}
?>