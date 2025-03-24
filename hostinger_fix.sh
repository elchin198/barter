#!/bin/bash
# BarterTap Hostinger Avtomatik Düzəliş Skripti
# v1.0.0

# Rəng kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # Rəng sıfırlama

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}BarterTap Hostinger Düzəliş Skripti${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Əsas qovluğu müəyyənləşdir
PUBLIC_HTML="${HOME}/public_html"
if [ ! -d "$PUBLIC_HTML" ]; then
  echo -e "${RED}Xəta: public_html qovluğu tapılmadı.${NC}"
  echo -e "${YELLOW}Bu skript Hostinger hostingdə işlədilməlidir.${NC}"
  exit 1
fi

echo -e "${YELLOW}İşləmə qovluğu: ${PUBLIC_HTML}${NC}"
cd "$PUBLIC_HTML" || exit 1

# Backup qovluğu yarat
BACKUP_DIR="${HOME}/bartertap_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Backup qovluğu yaradıldı: ${BACKUP_DIR}${NC}"

# Mövcud faylların yedəklənməsi
echo -e "${YELLOW}Mövcud konfiqurasiya faylları yedəklənir...${NC}"
if [ -f "$PUBLIC_HTML/.htaccess" ]; then
  cp "$PUBLIC_HTML/.htaccess" "$BACKUP_DIR/.htaccess.bak"
  echo -e "${GREEN}.htaccess yedəkləndi${NC}"
fi

if [ -f "$PUBLIC_HTML/index.html" ]; then
  cp "$PUBLIC_HTML/index.html" "$BACKUP_DIR/index.html.bak"
  echo -e "${GREEN}index.html yedəkləndi${NC}"
fi

if [ -f "$PUBLIC_HTML/index.php" ]; then
  cp "$PUBLIC_HTML/index.php" "$BACKUP_DIR/index.php.bak"
  echo -e "${GREEN}index.php yedəkləndi${NC}"
fi

# .htaccess yaradılması
echo -e "${YELLOW}Yeni .htaccess faylı yaradılır...${NC}"
cat > "$PUBLIC_HTML/.htaccess" << 'EOF'
# BarterTap əsas .htaccess faylı
# Avtomatik yaradılmışdır: $(date)

# Enable rewrite engine
RewriteEngine On
RewriteBase /

# Əgər fiziki fayl və ya qovluqdursa, birbaşa istifadə et
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# API və WebSocket sorğuları
RewriteCond %{REQUEST_URI} ^/api/ [OR]
RewriteCond %{REQUEST_URI} ^/ws
RewriteRule ^(.*)$ index.php?route=$1 [L,QSA]

# Bütün digər sorğuları index.html-ə yönləndir
RewriteRule ^ index.html [L]

# Təhlükəsizlik 
<IfModule mod_headers.c>
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Qovluq indekslənməsini qadağan et
Options -Indexes

# Xəta səhifələri
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html
ErrorDocument 500 /index.html
EOF

chmod 644 "$PUBLIC_HTML/.htaccess"
echo -e "${GREEN}.htaccess yaradıldı${NC}"

# index.html yaradılması
echo -e "${YELLOW}Yeni index.html faylı yaradılır...${NC}"
cat > "$PUBLIC_HTML/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarterTap - Barter Mübadilə Platformu</title>
  <meta name="description" content="BarterTap - Azərbaycanda əşyaların barter mübadiləsi üçün platformadır." />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background-color: #fff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 15px 0;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      text-decoration: none;
    }
    
    .nav-links {
      display: flex;
      gap: 20px;
    }
    
    .nav-link {
      color: #333;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    
    .nav-link:hover {
      color: #0066cc;
    }
    
    .main-section {
      padding: 50px 20px;
      text-align: center;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #333;
    }
    
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    
    .btn {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    
    .btn:hover {
      background-color: #0052a3;
    }
    
    .features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 30px;
      margin-top: 50px;
    }
    
    .feature {
      background: white;
      border-radius: 8px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
      padding: 25px;
      width: 280px;
      text-align: center;
    }
    
    .feature h3 {
      margin-top: 15px;
      color: #333;
    }
    
    .feature p {
      font-size: 0.95rem;
      color: #666;
    }
    
    .feature-icon {
      background-color: #e6f2ff;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      color: #0066cc;
      font-size: 28px;
    }
    
    footer {
      background-color: #333;
      color: white;
      padding: 40px 0;
      margin-top: 80px;
    }
    
    .footer-content {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .footer-section {
      width: 250px;
      margin-bottom: 30px;
    }
    
    .footer-section h4 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #fff;
    }
    
    .footer-section a {
      color: #ddd;
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      transition: color 0.2s;
    }
    
    .footer-section a:hover {
      color: #fff;
    }
    
    .copyright {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #444;
      margin-top: 30px;
      font-size: 14px;
      color: #aaa;
    }
    
    @media (max-width: 768px) {
      .features {
        gap: 20px;
      }
      
      .feature {
        width: 100%;
        max-width: 320px;
      }
      
      .footer-section {
        width: 100%;
        text-align: center;
      }
      
      .nav-links {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <a href="/" class="logo">BarterTap</a>
      <div class="nav-links">
        <a href="/" class="nav-link">Ana Səhifə</a>
        <a href="/items" class="nav-link">Bütün Əşyalar</a>
        <a href="/map" class="nav-link">Xəritədə Axtar</a>
        <a href="/auth" class="nav-link">Daxil Ol</a>
      </div>
    </div>
  </header>

  <section class="main-section">
    <div class="container">
      <h1>BarterTap - Əşyalarınızı Dəyişdirin</h1>
      <p>
        BarterTap platforması ilə istifadə etmədiyiniz əşyaları sizə lazım olan əşyalara səmərəli şəkildə dəyişin. 
        Pulsuz, rahat və ekoloji təmiz alqı-satqı alternatividir.
      </p>
      <a href="/items" class="btn">Əşyalara Bax</a>
      <a href="/auth" class="btn" style="background-color: #28a745; margin-left: 10px;">Hesab Yarat</a>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🔄</div>
          <h3>Dəyiş-Dəyişdir</h3>
          <p>İstifadə etmədiyiniz əşyalardan qurtulun və sizə lazım olanı tapın.</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">🗺️</div>
          <h3>Yerli Əməkdaşlıq</h3>
          <p>Xəritə üzərində yaxınlıqdakı əşyaları və istifadəçiləri tapın.</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">💬</div>
          <h3>Təklif və Əlaqə</h3>
          <p>İstifadəçilərlə əlaqə qurun və əşyalarla bağlı təkliflər verin.</p>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="footer-content">
      <div class="footer-section">
        <h4>BarterTap</h4>
        <a href="/">Ana Səhifə</a>
        <a href="/how-it-works">Necə İşləyir</a>
        <a href="/about">Haqqımızda</a>
        <a href="/contact">Əlaqə</a>
      </div>
      
      <div class="footer-section">
        <h4>Kateqoriyalar</h4>
        <a href="/items?category=elektronika">Elektronika</a>
        <a href="/items?category=geyim">Geyim</a>
        <a href="/items?category=ev-esyalari">Ev Əşyaları</a>
        <a href="/items?category=hobbi">Hobbi və İdman</a>
      </div>
      
      <div class="footer-section">
        <h4>Əlaqə</h4>
        <p style="color: #ddd; font-size: 14px;">
          Əhməd Rəcəbli, Bakı<br>
          +994 55 255 48 00<br>
          info@bartertap.az
        </p>
      </div>
    </div>
    
    <div class="container">
      <div class="copyright">
        &copy; 2025 BarterTap. Bütün hüquqlar qorunur.
      </div>
    </div>
  </footer>
</body>
</html>
EOF

chmod 644 "$PUBLIC_HTML/index.html"
echo -e "${GREEN}index.html yaradıldı${NC}"

# index.php yaradılması
echo -e "${YELLOW}Yeni index.php faylı yaradılır...${NC}"
cat > "$PUBLIC_HTML/index.php" << 'EOF'
<?php
/**
 * BarterTap API və Yönləndirmə Skripti
 * Bu fayl API sorğuları üçün əsas giriş nöqtəsidir
 */

// Xəta mesajlarını bildirmək
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Sorğu URL-ni əldə et
$request_uri = $_SERVER['REQUEST_URI'];
$route = isset($_GET['route']) ? $_GET['route'] : '';

// API sorğularına cavab ver
if (strpos($request_uri, '/api/') === 0) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'API tezliklə işləyəcək',
        'route' => $route,
        'time' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// WebSocket sorğularına cavab ver
if (strpos($request_uri, '/ws') === 0) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'WebSocket tezliklə işləyəcək',
        'time' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Statik HTML səhifəsinə yönləndir
include 'index.html';
EOF

chmod 644 "$PUBLIC_HTML/index.php"
echo -e "${GREEN}index.php yaradıldı${NC}"

# 404.html və 500.html yaradılması
echo -e "${YELLOW}Xəta səhifələri yaradılır...${NC}"
cat > "$PUBLIC_HTML/404.html" << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Səhifə Tapılmadı - BarterTap</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 40px 20px;
    }
    h1 {
      font-size: 3.5rem;
      margin: 0;
      color: #0066cc;
    }
    p {
      font-size: 1.1rem;
      margin: 20px 0 30px;
      color: #555;
    }
    .btn {
      display: inline-block;
      background: #0066cc;
      color: #fff;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.3s ease;
    }
    .btn:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Axtardığınız səhifə tapılmadı. Səhifə silinmiş və ya yerləşdiyi yer dəyişdirilmiş ola bilər.</p>
    <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
  </div>
</body>
</html>
EOF

cat > "$PUBLIC_HTML/500.html" << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 - Server Xətası - BarterTap</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 40px 20px;
    }
    h1 {
      font-size: 3.5rem;
      margin: 0;
      color: #0066cc;
    }
    p {
      font-size: 1.1rem;
      margin: 20px 0 30px;
      color: #555;
    }
    .btn {
      display: inline-block;
      background: #0066cc;
      color: #fff;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.3s ease;
    }
    .btn:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>500</h1>
    <p>Server xətası baş verdi. Texniki komandamız bu problemi həll etmək üçün çalışır.</p>
    <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
  </div>
</body>
</html>
EOF

chmod 644 "$PUBLIC_HTML/404.html"
chmod 644 "$PUBLIC_HTML/500.html"
echo -e "${GREEN}Xəta səhifələri yaradıldı${NC}"

# İcazələri təyin et
echo -e "${YELLOW}Fayl icazələri tənzimlənir...${NC}"
find "$PUBLIC_HTML" -type f -exec chmod 644 {} \;
find "$PUBLIC_HTML" -type d -exec chmod 755 {} \;
echo -e "${GREEN}Fayl icazələri tənzimləndi${NC}"

echo -e "${GREEN}Bütün əməliyyatlar uğurla tamamlandı!${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}Tamamlanıdı: $(date)${NC}"
echo -e "${YELLOW}Yedəkləmələr buraya saxlanıldı: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""
echo -e "${GREEN}İndi veb saytınızı yoxlaya bilərsiniz. Əsas problemi həll etməlidir.${NC}"
echo -e "${YELLOW}Əgər problem davam edərsə, lütfən Hostinger dəstəyi ilə əlaqə saxlayın: https://www.hostinger.az/contact${NC}"

exit 0