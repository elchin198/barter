#!/bin/bash
# BarterTap.az - Hostinger Avtomatik Təmir Skripti
# Bu skript Hostinger-də tez-tez yaranan problemləri avtomatik həll edir

# Rəng kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}    BarterTap.az Hostinger Avtomatik Təmir Skripti    ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Əsas qovluğu yoxla
ROOT_DIR="/home/u726371272/public_html"
if [ ! -d "$ROOT_DIR" ]; then
    echo -e "${RED}Xəta: $ROOT_DIR qovluğu tapılmadı${NC}"
    echo -e "${YELLOW}Zəhmət olmasa, doğru qovluqda işləyin və ya yolu düzəldin.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Hostinger mühiti yoxlanılır...${NC}"

# PHP versiyasını yoxla
PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2)
echo -e "- PHP Versiyası: ${GREEN}$PHP_VERSION${NC}"

# MySQL bağlantısını yoxla
echo -e "- MySQL bağlantısı yoxlanılır..."
DB_HOST="localhost"
DB_USER="u726371272_barter_user"

if mysql -h $DB_HOST -u $DB_USER -p -e "SELECT VERSION();" 2>/dev/null; then
    echo -e "  ${GREEN}MySQL bağlantısı uğurludur${NC}"
else
    echo -e "  ${RED}MySQL bağlantısında problem var${NC}"
    echo -e "  ${YELLOW}Zəhmət olmasa, məlumat bazası giriş məlumatlarını yoxlayın${NC}"
fi

echo -e "\n${YELLOW}Fayl sistemini yoxlanılır...${NC}"

# İcazələri yoxla və düzəlt
echo -e "- Kritik fayllar üçün icazələr yoxlanılır və təmir edilir..."

# İcazələri düzəlt
find $ROOT_DIR -type f -name "*.php" -exec chmod 644 {} \;
find $ROOT_DIR -type f -name "*.html" -exec chmod 644 {} \;
find $ROOT_DIR -type f -name "*.js" -exec chmod 644 {} \;
find $ROOT_DIR -type f -name "*.css" -exec chmod 644 {} \;
chmod 644 $ROOT_DIR/.htaccess 2>/dev/null || echo -e "  ${YELLOW}.htaccess faylı mövcud deyil${NC}"
chmod 644 $ROOT_DIR/index.php 2>/dev/null || echo -e "  ${YELLOW}index.php faylı mövcud deyil${NC}"
chmod 644 $ROOT_DIR/index.html 2>/dev/null || echo -e "  ${YELLOW}index.html faylı mövcud deyil${NC}"
chmod 644 $ROOT_DIR/api.php 2>/dev/null || echo -e "  ${YELLOW}api.php faylı mövcud deyil${NC}"

# Qovluqlara icazələri təyin et
find $ROOT_DIR -type d -exec chmod 755 {} \;

echo -e "  ${GREEN}Fayl icazələri yeniləndi${NC}"

# Kritik faylların mövcudluğunu yoxla
echo -e "- Kritik faylların mövcudluğu yoxlanılır..."
CRITICAL_FILES=(".htaccess" "index.php" "index.html" "api.php")
MISSING_FILES=()

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$ROOT_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "  ${GREEN}Bütün kritik fayllar mövcuddur${NC}"
else
    echo -e "  ${RED}Aşağıdakı kritik fayllar çatışmır:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "  - $file"
    done
    echo -e "  ${YELLOW}Zəhmət olmasa, çatışmayan faylları əlavə edin${NC}"
fi

# .htaccess faylı problemləri yoxla və düzəlt
if [ -f "$ROOT_DIR/.htaccess" ]; then
    echo -e "- .htaccess faylı yoxlanılır və təmir edilir..."
    
    # .htaccess faylının ehtiyat nüsxəsini yarat
    cp $ROOT_DIR/.htaccess $ROOT_DIR/.htaccess.backup
    
    # RewriteEngine On əlavə et (əgər yoxdursa)
    if ! grep -q "RewriteEngine On" $ROOT_DIR/.htaccess; then
        echo -e "  ${YELLOW}RewriteEngine On əlavə edilir...${NC}"
        echo "RewriteEngine On" > $ROOT_DIR/.htaccess.new
        cat $ROOT_DIR/.htaccess >> $ROOT_DIR/.htaccess.new
        mv $ROOT_DIR/.htaccess.new $ROOT_DIR/.htaccess
    fi
    
    # SPA yönləndirməsini əlavə et (əgər yoxdursa)
    if ! grep -q "RewriteRule ^" $ROOT_DIR/.htaccess; then
        echo -e "  ${YELLOW}SPA yönləndirməsi əlavə edilir...${NC}"
        cat >> $ROOT_DIR/.htaccess << EOF

# For static files
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# For all other requests, route to index.php
RewriteRule ^ index.php [L]
EOF
    fi
    
    echo -e "  ${GREEN}.htaccess faylı təmir edildi${NC}"
else
    echo -e "- ${RED}.htaccess faylı mövcud deyil, yaradılır...${NC}"
    
    cat > $ROOT_DIR/.htaccess << EOF
# Enable the rewrite engine
RewriteEngine On

# Serving Brotli compressed CSS/JS if available and the client accepts it
<IfModule mod_headers.c>
  # Serve brotli compressed CSS and JS files if they exist and the client accepts br encoding
  RewriteCond %{HTTP:Accept-encoding} br
  RewriteCond %{REQUEST_FILENAME}\.br -f
  RewriteRule ^(.*)\.css $1\.css\.br [QSA]
  RewriteRule ^(.*)\.js $1\.js\.br [QSA]

  # Serve correct content types and encodings
  RewriteRule \.css\.br$ - [T=text/css,E=no-gzip:1,E=BROTLI]
  RewriteRule \.js\.br$ - [T=text/javascript,E=no-gzip:1,E=BROTLI]

  <FilesMatch "(\.js\.br|\.css\.br)$">
    Header set Content-Encoding br
    Header append Vary Accept-Encoding
  </FilesMatch>
</IfModule>

# Handle front-end routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # For all static files
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # For all other requests, route to index.php
  RewriteRule ^ index.php [L]
</IfModule>

# Set security headers
<IfModule mod_headers.c>
  # XSS Protection
  Header set X-XSS-Protection "1; mode=block"
  
  # Prevent MIME-sniffing
  Header set X-Content-Type-Options "nosniff"
  
  # Referrer Policy
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  
  # HSTS (optional - enable once SSL is properly configured)
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>

# Serve correct MIME types
<IfModule mod_mime.c>
  # JavaScript
  AddType application/javascript js
  AddType application/json json
  
  # CSS
  AddType text/css css
  
  # Fonts
  AddType font/ttf ttf
  AddType font/otf otf
  AddType font/woff woff
  AddType font/woff2 woff2
  
  # SVG
  AddType image/svg+xml svg svgz
  
  # Images
  AddType image/jpeg jpeg jpg
  AddType image/png png
  AddType image/gif gif
  AddType image/webp webp
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  # Compress HTML, CSS, JavaScript, Text, XML and fonts
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE application/x-font
  AddOutputFilterByType DEFLATE application/x-font-opentype
  AddOutputFilterByType DEFLATE application/x-font-otf
  AddOutputFilterByType DEFLATE application/x-font-truetype
  AddOutputFilterByType DEFLATE application/x-font-ttf
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE font/opentype
  AddOutputFilterByType DEFLATE font/otf
  AddOutputFilterByType DEFLATE font/ttf
  AddOutputFilterByType DEFLATE image/svg+xml
  AddOutputFilterByType DEFLATE image/x-icon
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/xml
</IfModule>

# Enable browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  
  # Fonts
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/otf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  
  # CSS, JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # Others
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType application/x-shockwave-flash "access plus 1 month"
</IfModule>

# Disable directory listing
Options -Indexes

# In case of 500 errors, show an error page
ErrorDocument 500 /500.html
ErrorDocument 404 /404.html
ErrorDocument 403 /403.html
EOF
    
    echo -e "  ${GREEN}Yeni .htaccess faylı yaradıldı${NC}"
fi

# PHP konfiqurasiyası yaradın (xüsusi php.ini)
if [ ! -f "$ROOT_DIR/php.ini" ]; then
    echo -e "- PHP konfiquriyası yaradılır..."
    
    cat > $ROOT_DIR/php.ini << EOF
; Custom PHP settings for BarterTap.az
display_errors = Off
log_errors = On
error_log = /home/u726371272/php_errors.log
max_execution_time = 300
max_input_time = 60
memory_limit = 256M
post_max_size = 32M
upload_max_filesize = 16M
max_file_uploads = 20
default_charset = "UTF-8"
EOF
    
    echo -e "  ${GREEN}Xüsusi php.ini faylı yaradıldı${NC}"
fi

# Köməkçi göstərişlər
echo -e "\n${YELLOW}Təmir prosesi tamamlandı!${NC}"
echo -e "\n${BLUE}Problemləri həll edə bilmədikdə:${NC}"
echo -e "1. Hostinger-də hesabı yenidən yüklə və serveri yenidən başla"
echo -e "2. Veb domeni üzərində SSL sertifikatının düzgün qurulduğunu təmin edin"
echo -e "3. DNS qeydlərinin doğru olduğunu yoxlayın"
echo -e "4. Ətraflı səhv tapılması üçün error_log faylını yoxlayın"
echo -e "5. Hostinger dəstək xidməti ilə əlaqə saxlayın"

# Log məlumatlarını göstərin
if [ -f "/home/u726371272/php_errors.log" ]; then
    echo -e "\n${YELLOW}Son 10 PHP xətası:${NC}"
    tail -n 10 /home/u726371272/php_errors.log
fi

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${GREEN}Təmir skripti tamamlandı!${NC}"
echo -e "${BLUE}==================================================${NC}\n"