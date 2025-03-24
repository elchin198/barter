#!/bin/bash
# BarterTap.az Hostinger Quraşdırma Skripti
# Bu skript proyekti Hostinger-də yerləşdirmək üçün istifadə olunur

# Rəng kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    BarterTap.az Hostinger Quraşdırması    ${NC}"
echo -e "${GREEN}========================================${NC}"

# Funksiyanı icra etdikdən sonra nəticəsini yoxla
function check_result {
    if [ $? -ne 0 ]; then
        echo -e "${RED}Xəta: $1${NC}"
        exit 1
    else
        echo -e "${GREEN}Uğurlu: $2${NC}"
    fi
}

# Qurmaq üçün yoxlamalar
echo -e "\n${YELLOW}Başlanğıc yoxlanışları:${NC}"

# Node.js versiyasını yoxla
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js tapılmadı, zəhmət olmasa quraşdırın${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "- Node.js versiyası: ${NODE_VERSION}"

# npm versiyasını yoxla
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm tapılmadı, zəhmət olmasa quraşdırın${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "- npm versiyası: ${NPM_VERSION}"

# Qovluq strukturunu yoxla
if [ ! -d "client" ] || [ ! -d "server" ] || [ ! -d "shared" ]; then
    echo -e "${RED}Layihə strukturu düzgün deyil, zəhmət olmasa kök qovluqda işə salın${NC}"
    exit 1
fi

# Bağımlılıqları quraşdır
echo -e "\n${YELLOW}Bağımlılıqlar quraşdırılır:${NC}"
npm install
check_result "npm bağımlılıqları quraşdırıla bilmədi" "Bağımlılıqlar quraşdırıldı"

# Tətbiqi hazırla
echo -e "\n${YELLOW}Tətbiq hazırlanır...${NC}"
npm run build
check_result "Tətbiq hazırlana bilmədi" "Tətbiq uğurla hazırlandı"

# Hostinger üçün faylları hazırla
echo -e "\n${YELLOW}Hostinger üçün fayllar hazırlanır...${NC}"

# dist qovluğunu yoxla
if [ ! -d "dist" ]; then
    echo -e "${RED}dist qovluğu tapılmadı!${NC}"
    exit 1
fi

# 'hostinger_deploy' qovluğunu yaradıq (əgər varsa təmizləyirik)
if [ -d "hostinger_deploy" ]; then
    rm -rf hostinger_deploy
fi
mkdir -p hostinger_deploy

# Statik faylları və PHP adapterlərini köçür
echo -e "- Statik fayllar köçürülür..."
cp -r dist/* hostinger_deploy/
cp .htaccess hostinger_deploy/
cp api.php hostinger_deploy/
cp hostinger_db_setup.php hostinger_deploy/
cp index.html hostinger_deploy/
cp index.php hostinger_deploy/
cp 403.html hostinger_deploy/ 2>/dev/null || :
cp 404.html hostinger_deploy/ 2>/dev/null || :
cp 500.html hostinger_deploy/ 2>/dev/null || :

# .env.production hazırla və içini doldur
echo -e "- .env.production yaradılır..."
cat > hostinger_deploy/.env.production << EOF
# BarterTap.az Production Environment
MYSQL_HOST=localhost
MYSQL_USER=u726371272_barter_user
MYSQL_PASSWORD=your_database_password
MYSQL_DATABASE=u726371272_barter_db
EOF

echo -e "- SQL skripti köçürülür..."
# SQL initialization skriptini hazırla
cat > hostinger_deploy/setup_database.php << EOF
<?php
// Execute the database setup script
require_once('hostinger_db_setup.php');
EOF

# README hazırla
echo -e "- README faylı hazırlanır..."
cat > hostinger_deploy/README.txt << EOF
==================================
BarterTap.az Hostinger Quraşdırması
==================================

Quraşdırma addımları:
1. FTP vasitəsilə bu qovluqdakı bütün faylları Hostinger-in public_html qovluğuna köçürün
2. SSH vasitəsilə və ya phpMyAdmin ilə setup_database.php skriptini işə salın
3. Doğru MySQL məlumatlarını .env.production faylında quraşdırın

İlkin giriş:
- İstifadəçi adı: testuser
- Şifrə: password123

Problemlər olduqda:
- hicran.huseynli@gmail.com
- +994 55 255 48 00

==================================
EOF

# ZIP arxivini yaratmaq
echo -e "\n${YELLOW}Arxiv hazırlanır...${NC}"
cd hostinger_deploy
zip -r ../bartertap_hostinger.zip *
cd ..
check_result "Arxiv yaradıla bilmədi" "bartertap_hostinger.zip arxivi uğurla yaradıldı"

echo -e "\n${GREEN}Quraşdırma tamamlandı!${NC}"
echo -e "${YELLOW}Qeyd:${NC} Hostinger serverində yerləşdirmək üçün 'bartertap_hostinger.zip' faylından istifadə edin."
echo -e "${YELLOW}Təlimat:${NC} hostinger_deploy/README.txt faylına baxın.\n"