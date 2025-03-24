# BarterTap Hostinger Probleminin Həlli Təlimatları

Bu sənəd "Oops, looks like the page is lost" xətasının həlli üçün təlimatları ehtiva edir.

## 1. Məsələnin Həlli Üçün Hazırlanan Fayllar

Aşağıdakı fayllar hazırlandı və artıq onları serverdə istifadə edə bilərsiniz:

1. `hostinger_fix.sh` - Bu skript bir çox problemləri avtomatik həll edəcək
2. `direct_fix_index.html` - Əgər skript işləməsə, bu HTML faylını birbaşa index.html kimi istifadə edə bilərsiniz

## 2. Hostingerdə Əl ilə Düzəliş Etmək

Əgər skripti işlədə bilmirsinizsə, aşağıdakı addımları izləyin:

1. Hostinger idarəetmə panelində File Manager (Fayl idarəçisi) bölməsinə daxil olun
2. public_html qovluğuna keçin
3. Mövcud index.html və .htaccess fayllarını silin (və ya adlarını dəyişin, məs. index.html.bak)
4. Yeni index.html faylı yaradın və məzmununu `direct_fix_index.html` faylından kopyalayın
5. Yeni .htaccess faylı yaradın və `hostinger_fix.sh` skriptindəki .htaccess məzmununu oraya kopyalayın

## 3. Əlavə Düzəlişlər

### Hostingerdə Node.js Server Aktivləşdirmə

Saytın tam funksionallığı üçün Node.js serveri aktivləşdirmək lazımdır:

1. Hostinger idarəetmə panelindən Website bölməsinə keçin
2. Advanced seçin
3. Node.js aktivləşdirin:
   - Giriş nöqtəsi: `server/index.js`
   - Node.js versiyası: 18.x (LTS) 

### Fayl İcazələrinin Düzəldilməsi

Əgər digər fayllarla əlaqədar problemlər varsa, fayl icazələrini yoxlayın:

```bash
# Qovluqlar üçün
find public_html -type d -exec chmod 755 {} \;

# Fayllar üçün
find public_html -type f -exec chmod 644 {} \;

# Skriptlər üçün
chmod +x public_html/*.sh
```

### MySQL Məlumat Bazası Bağlantısı

Məlumat bazası bağlantı problemi yaşayırsınızsa:

1. Əmin olun ki, .env faylınızda doğru məlumatlar var:
   ```
   DATABASE_URL=mysql://u726371272_barter_db:password@localhost:3306/u726371272_barter_db
   ```
2. Şifrəni düzgün yazdığınızdan əmin olun
3. Node.js serveri yenidən başladın

## 4. 4xx və 5xx Xətalar Üçün

404, 403 və 500 xəta səhifələrini yaratdığınızdan əmin olun. Bu xəta halları üçün istifadəçilərə görüntüləyəcək səhifələrdir.

## Problem Həll Olmadıqda

Əgər yuxarıdakı addımları izlədikdən sonra da problem həll olunmadısa:

1. Hostingerin Terminal/SSH xidmətindən istifadə edərək daxil olun
2. Serverdə günlük (logs) fayllarını yoxlayın:

```bash
tail -f /var/log/apache2/error.log   # Apache xətaları üçün
tail -f ~/path/to/your/application/logs/app.log  # Tətbiq jurnalları üçün (əgər varsa)
```

3. MySQL verilənlər bazasına birbaşa qoşulun və sorğu aparın:

```bash
mysql -u u726371272_barter_db -p
```

4. Hostinger dəstək xidməti ilə əlaqə saxlayın və onlara bu xətanı izah edin.