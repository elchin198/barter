#!/bin/bash

# BarterTap.az - Hostinger quraşdırma skripti

# Qovluqlar yaratmaq
echo "Zəruri qovluqlar yaradılır..."
mkdir -p /home/u726371272/bartertap.az/public_html/dist/client
mkdir -p /home/u726371272/bartertap.az/logs
mkdir -p /home/u726371272/bartertap.az/public_html/uploads

# Hostinger qovluq strukturunə uyğun olaraq faylları köçürmək
echo "Fayllar köçürülür..."
cp -r dist/client/* /home/u726371272/bartertap.az/public_html/dist/client/
cp -r public/images /home/u726371272/bartertap.az/public_html/dist/client/
cp public/favicon.ico /home/u726371272/bartertap.az/public_html/dist/client/
cp public/logo.png /home/u726371272/bartertap.az/public_html/dist/client/

# PM2 konfigurasiyasını quraşdırmaq
echo "PM2 konfiqurasiyası quraşdırılır..."
cp ecosystem.config.js /home/u726371272/bartertap.az/

# Nginx konfiqurasiyasını quraşdırmaq (əgər lazımdırsa)
echo "Nginx konfiqurasiyası quraşdırılır..."
if [ -d "/etc/nginx/sites-available" ]; then
  cp nginx.conf /etc/nginx/sites-available/bartertap.az.conf
  ln -sf /etc/nginx/sites-available/bartertap.az.conf /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
fi

# .env.production faylını köçürmək
echo "Mühit dəyişənləri quraşdırılır..."
cp .env.production /home/u726371272/bartertap.az/.env

# Serveri işə salmaq
echo "Server işə salınır..."
cd /home/u726371272/bartertap.az
pm2 start ecosystem.config.js

echo "BarterTap.az uğurla quraşdırıldı!"
echo "Sayt indi https://bartertap.az ünvanında əlçatandır."