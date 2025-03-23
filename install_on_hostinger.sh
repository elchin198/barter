#!/bin/bash

# BarterTap.az - Hostinger Quraşdırma Təlimatları
# Bu skript Hostinger serverində proyekti quraşdırmaq üçün lazımi addımları göstərir.
# SSH terminalında əl ilə yerinə yetirin.

echo "=== BarterTap.az Hostinger Quraşdırma Təlimatları ==="
echo ""

echo "1. İlk olaraq SSH vasitəsilə serverə qoşulun:"
echo "   ssh u726371272@46.202.156.134"
echo ""

echo "2. Ana kataloqa keçin və mövcud faylları yedəkləyin (əgər varsa):"
echo "   cd ~/public_html"
echo "   mkdir -p ~/backups"
echo "   zip -r ~/backups/site_backup_$(date +%Y%m%d).zip ./*"
echo ""

echo "3. Node.js və npm quraşdırın (əgər artıq quraşdırılmayıbsa):"
echo "   Hostinger Control Panel > Website > Node.js"
echo "   Ən azı Node.js 18 versiyasını seçin və 'Install' seçin"
echo ""

echo "4. PM2 Process Manager quraşdırın (Node.js tətbiqlərini idarə etmək üçün):"
echo "   npm install -g pm2"
echo ""

echo "5. MySQL verilənlər bazasını yaradın (əgər yaradılmayıbsa):"
echo "   Hostinger Control Panel > Verilənlər Bazaları > MySQL Verilənlər Bazası"
echo "   Verilənlər bazası adı: u726371272_barter_db"
echo "   İstifadəçi adı: u726371272_barter_db"
echo "   Şifrə: <güclü şifrə seçin>"
echo ""

echo "6. Proyekt fayllarını FTP vasitəsilə yükləyin:"
echo "   FileZilla məlumatları:"
echo "   Host: 46.202.156.134"
echo "   İstifadəçi: u726371272.bartertap.az"
echo "   Şifrə: <FTP şifrəniz>"
echo "   Port: 21"
echo "   Upload folder: public_html"
echo ""

echo "7. SSH ilə bağlantı qurduqdan sonra, asılılıqları quraşdırın:"
echo "   cd ~/public_html"
echo "   npm install --production"
echo ""

echo "8. .env faylını yaradın və düzgün məlumatları əlavə edin:"
echo "   Aşağıdakı komandaları SSH terminalında icra edin:"
echo '   cat > .env << EOL
NODE_ENV=production
PORT=5000
SESSION_SECRET=<güclü bir sesiya şifrəsi>
DATABASE_URL=mysql://u726371272_barter_db:<şifrə>@localhost:3306/u726371272_barter_db
EOL'
echo ""

echo "9. PM2 ilə serveri başladın və avtomatik başlanğıc konfiqurasiya edin:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""

echo "10. Nginx Reverse Proxy Konfiqurasiyası (əgər mümkündürsə):"
echo "    Hostinger adətən Nginx/Apache konfiqurasiyasını əvvəlcədən təmin edir,"
echo "    amma .htaccess faylını yükləmək də bu məqsədə xidmət edə bilər."
echo ""

echo "11. Domain və SSL konfiqurasiyası:"
echo "    Hostinger Control Panel > Website > SSL > Install SSL"
echo "    Hostinger Control Panel > Website > Domain > Point Domain"
echo ""

echo "12. Test edin ki, sayt işləyir:"
echo "    Brauzerinizdə bartertap.az ünvanını açın"
echo ""

echo "13. Hər hansı problem yaranacağı təqdirdə, jurnal fayllarını yoxlayın:"
echo "    pm2 logs"
echo ""

echo "=== Quraşdırma başa çatdı ==="
echo "Qeyd: Bu skript birbaşa icra edilmək üçün yazılmayıb, addım-addım təlimatlar kimi istifadə edilməlidir."