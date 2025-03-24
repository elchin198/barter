#!/bin/bash

# Bu skript saytınızın Hostinger üzərində işləməsini təmin etmək üçün lazım olan bütün tənzimləmələri edir

echo "BarterTap Hostinger Düzəliş Skripti"
echo "=================================="

# 1. Əsas HTML faylının yerləşməsini yoxlayaq
echo "Əsas HTML faylı yoxlanılır..."
if [ -f "public_html/index.html" ]; then
  echo "✓ index.html public_html qovluğunda tapıldı"
else
  echo "✗ index.html public_html qovluğunda tapılmadı"
  echo "  Əsas HTML faylı yaradılır..."
  
  cat > public_html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarterTap - Barter Mübadilə Platformu</title>
  <meta name="description" content="BarterTap - Azərbaycanda əşyaların barter mübadiləsi üçün platformadır. Burada istifadə etmədiyiniz əşyaları sizə lazım olan əşyalara səmərəli şəkildə dəyişə bilərsiniz." />
  <meta name="keywords" content="barter, mübadilə, əşya mübadiləsi, ikinci əl, Azerbaijan, tapıntı, dəyişmə, barter platform, elektron mübadilə" />
</head>
<body>
  <div id="root"></div>
  <script>
    // Yükləmə animasiyası
    document.addEventListener('DOMContentLoaded', function() {
      const root = document.getElementById('root');
      root.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh;"><div style="text-align: center;"><h1 style="font-family: Arial, sans-serif; color: #333;">BarterTap yüklənir...</h1><div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; margin: 20px auto; animation: spin 1s linear infinite;"></div></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>';
    });
  </script>
</body>
</html>
EOF
  echo "✓ index.html yaradıldı"
fi

# 2. .htaccess faylını yoxlayaq və düzəldək
echo "htaccess faylı yoxlanılır..."
if [ -f "public_html/.htaccess" ]; then
  echo "✓ .htaccess public_html qovluğunda tapıldı"
  echo "  .htaccess faylı əvəz edilir..."
else
  echo "✗ .htaccess public_html qovluğunda tapılmadı"
  echo "  .htaccess faylı yaradılır..."
fi

# .htaccess faylını yenidən yaradaq
cat > public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Əgər sorğu API və ya WebSocket üçündürsə, Node.js serverinə yönləndir
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/ws
  # Qeyd: Bu hissəni Hostinger tərəfindən təmin edilən Node.js port ilə əvəz edin
  RewriteRule ^(.*)$ http://localhost:8080/$1 [P,L]
  
  # Əgər sorğu mövcud olan bir fayl üçündürsə, birbaşa təqdim et
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Əgər sorğu /assets qovluğu üçündürsə, ancaq fayl mövcud deyilsə, 404 qaytarın
  RewriteCond %{REQUEST_URI} ^/assets/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ - [R=404,L]
  
  # Digər bütün sorğuları index.html-ə yönləndir
  RewriteRule ^ index.html [L]
</IfModule>

# Təhlükəsizlik başlıqları
<IfModule mod_headers.c>
  # XSS Qorunması
  Header set X-XSS-Protection "1; mode=block"
  
  # MIME-sniffing qarşısını al
  Header set X-Content-Type-Options "nosniff"
  
  # Referrer Siyasəti
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Qovluq siyahısını deaktiv et
Options -Indexes

# PHP parametrləri
<IfModule mod_php7.c>
  php_flag display_errors Off
  php_value memory_limit 256M
  php_value max_execution_time 300
  php_value post_max_size 64M
  php_value upload_max_filesize 16M
</IfModule>

# Xəta səhifələri
ErrorDocument 404 /404.html
ErrorDocument 403 /403.html
ErrorDocument 500 /500.html
EOF
echo "✓ .htaccess faylı yeniləndi"

# 3. Xəta səhifələrini yoxlayaq
echo "Xəta səhifələri yoxlanılır..."
for error_page in 404 403 500; do
  if [ -f "public_html/${error_page}.html" ]; then
    echo "✓ ${error_page}.html səhifəsi mövcuddur"
  else
    echo "✗ ${error_page}.html səhifəsi tapılmadı"
    echo "  ${error_page}.html səhifəsi yaradılır..."
    
    # Xəta səhifəsi şablonu (hər xəta növü üçün fərqli başlıq və mesaj)
    if [ "$error_page" = "404" ]; then
      TITLE="Səhifə Tapılmadı"
      MESSAGE="Axtardığınız səhifə mövcud deyil və ya başqa ünvana köçürülüb."
      COLOR="#0d6efd"
    elif [ "$error_page" = "403" ]; then
      TITLE="Giriş Qadağandır"
      MESSAGE="Bu səhifəyə giriş icazəniz yoxdur."
      COLOR="#dc3545"
    else # 500
      TITLE="Server Xətası"
      MESSAGE="Sorğunuzu emal edərkən gözlənilməz bir xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin."
      COLOR="#dc3545"
    fi
    
    # Xəta səhifəsini yaradaq
    cat > "public_html/${error_page}.html" << EOF
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${TITLE} - BarterTap</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #343a40;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .error-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        .error-code {
            font-size: 72px;
            font-weight: bold;
            color: ${COLOR};
            margin: 0;
        }
        h1 {
            font-size: 24px;
            margin: 10px 0 20px;
        }
        p {
            color: #6c757d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0b5ed7;
        }
        .logo {
            margin-bottom: 20px;
            max-width: 180px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-code">${error_page}</h1>
        <h1>${TITLE}</h1>
        <p>${MESSAGE}</p>
        <a href="/" class="btn">Ana Səhifəyə Qayıt</a>
    </div>
</body>
</html>
EOF
    echo "✓ ${error_page}.html səhifəsi yaradıldı"
  fi
done

# 4. index.php faylını yoxlayaq
echo "index.php faylı yoxlanılır..."
if [ -f "public_html/index.php" ]; then
  echo "✓ index.php mövcuddur"
else
  echo "✗ index.php tapılmadı"
  echo "  index.php yaradılır..."
  
  cat > public_html/index.php << 'EOF'
<?php
// This file is needed for PHP hosting environments
// It simply forwards to the index.html file
include_once('index.html');
?>
EOF
  echo "✓ index.php yaradıldı"
fi

# 5. robots.txt və sitemap.xml faylları
echo "SEO faylları yoxlanılır..."
if [ ! -f "public_html/robots.txt" ]; then
  echo "✗ robots.txt tapılmadı"
  echo "  robots.txt yaradılır..."
  
  cat > public_html/robots.txt << 'EOF'
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /ws/
Disallow: /admin/

Sitemap: https://bartertap.az/sitemap.xml
EOF
  echo "✓ robots.txt yaradıldı"
else
  echo "✓ robots.txt mövcuddur"
fi

if [ ! -f "public_html/sitemap.xml" ]; then
  echo "✗ sitemap.xml tapılmadı"
  echo "  sitemap.xml yaradılır..."
  
  cat > public_html/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bartertap.az/</loc>
    <lastmod>2025-03-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bartertap.az/items</loc>
    <lastmod>2025-03-24</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bartertap.az/map</loc>
    <lastmod>2025-03-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bartertap.az/auth</loc>
    <lastmod>2025-03-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
EOF
  echo "✓ sitemap.xml yaradıldı"
else
  echo "✓ sitemap.xml mövcuddur"
fi

# 6. Node.js serverin işləyib-işləmədiyini yoxlayaq
echo "Node.js serverin statusu yoxlanılır..."
if pgrep -f "node.*server/index.js" > /dev/null; then
  echo "✓ Node.js server işləyir"
else
  echo "✗ Node.js server işləmir"
  echo "  Qeyd: Server işləmədikdə, API sorğuları işləməyəcək"
  echo "  Node.js serveri işə salmaq üçün bu əmri işə salın:"
  echo "  cd public_html && node server/index.js"
fi

# 7. Bütün faylların icazələrini yoxlayaq
echo "Fayl icazələri yoxlanılır..."
find public_html -type d -exec chmod 755 {} \;
find public_html -type f -exec chmod 644 {} \;
echo "✓ Bütün fayl və qovluqların icazələri düzəldildi"

echo ""
echo "Düzəliş skripti tamamlandı!"
echo "Saytınız indi problemsiz işləməlidir. Əgər problemlər davam edirsə,"
echo "Hostinger-in node.js xidmətini aktivləşdirdiyinizi yoxlayın."