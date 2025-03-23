#!/bin/bash

# BarterTap.az Yerləşdirmə Skripti
# Bu skript proyekti Hostinger'ə yerləşdirmək üçün istifadə olunur.
# Lokal kompüterdə bu skripti işlətməzdən əvvəl chmod +x deploy.sh əmri ilə icazələri təyin edin.

echo "=== BarterTap.az Yerləşdirmə Skripti ==="
echo "Bu skript proyektinizi build edib Hostinger serverinə yükləyəcək."
echo ""

# Konfiqurasiya
HOSTINGER_USER="u726371272"
HOSTINGER_HOST="46.202.156.134"
HOSTINGER_PORT="65002"
REMOTE_DIR="public_html"
APP_NAME="bartertap-app"

echo "1. Asılılıqları yükləyir..."
npm install

echo "2. Proyekti build edir..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build prosesi zamanı xəta baş verdi!"
    exit 1
fi

echo "3. Lazımi faylları zip arxivinə əlavə edir..."
mkdir -p deploy
cp -r dist deploy/
cp package.json deploy/
cp package-lock.json deploy/
cp ecosystem.config.js deploy/
cp nginx.conf deploy/
cp .htaccess deploy/
cp -r public deploy/

# PHP fayllarını əlavə et
if [ -d "php" ]; then
    cp -r php deploy/
fi

# Lazımi qovluqları yarat
mkdir -p deploy/logs
mkdir -p deploy/uploads
touch deploy/.env

cat > deploy/.env << EOL
NODE_ENV=production
PORT=5000
SESSION_SECRET=changeme_with_strong_secret
DATABASE_URL=mysql://u726371272_barter_db:password@localhost:3306/u726371272_barter_db
EOL

cd deploy && zip -r ../bartertap-deployment.zip * .env .htaccess
cd ..

echo "4. Serverdə yedək yaradır və arxivi köçürür..."
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST "mkdir -p ~/backups && zip -r ~/backups/backup-\$(date +%Y%m%d-%H%M%S).zip ~/$REMOTE_DIR/* > /dev/null 2>&1 || true"

echo "5. Faylları serverə köçürür..."
scp -P $HOSTINGER_PORT bartertap-deployment.zip $HOSTINGER_USER@$HOSTINGER_HOST:~/

echo "6. Arxivi çıxarır və node.js tətbiqini başladır..."
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST << EOF
  cd ~/$REMOTE_DIR
  unzip -o ~/bartertap-deployment.zip
  rm ~/bartertap-deployment.zip
  
  # PHP 8.3 konfiqurasiyasını təyin et
  echo "php_value upload_max_filesize 20M" > .user.ini
  echo "php_value post_max_size 20M" >> .user.ini
  echo "php_value memory_limit 256M" >> .user.ini
  echo "php_value max_execution_time 300" >> .user.ini

  # Node.js asılılıqlarını quraşdır və tətbiqi başlat
  npm install --production
  
  # PM2 quraşdır (əgər artıq quraşdırılmayıbsa)
  npm install -g pm2 || true
  
  # Tətbiqi dayandır və yenidən başlat
  pm2 stop $APP_NAME || true
  pm2 delete $APP_NAME || true
  pm2 start ecosystem.config.js
  pm2 save
EOF

echo "7. Təmizləmə işləri yerinə yetirilir..."
rm -rf deploy
rm bartertap-deployment.zip

echo "=== Yerləşdirmə tamamlandı! ==="
echo "Saytı yoxlamaq üçün: https://bartertap.az"
echo "Hər hansı bir problem yaranarsa, serverə bağlanıb journalları yoxlaya bilərsiniz:"
echo "ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_HOST"
echo "pm2 logs $APP_NAME"