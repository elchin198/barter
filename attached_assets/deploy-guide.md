# BarterTap Deployment Guide for Hostinger

## Ümumi Məlumat

Bu bələdçi, BarterTap tətbiqinin Hostinger-də necə yerləşdiriləcəyinə dair addım-addım təlimatları təqdim edir.

## Sistem Tələbləri

- Node.js (v16 və ya daha yuxarı)
- MySQL verilənlər bazası
- PHP 8.0 və ya daha yuxarı (Hostinger-də PHP modulları üçün)

## Deployment Addımları

### 1. Server Konfiqurasiyasını Hazırlayın

- Hostinger hesabınıza daxil olun.
- Əmin olun ki, domen (bartertap.az) düzgün konfiqurasiya edilib.
- Əmin olun ki, verilənlər bazası yaradılıb və məlumatlar əlçatandır.

### 2. Layihəni Hazırlayın

```bash
# Build skriptini icra icazəsi verin
chmod +x build.sh

# Build prosesini işə salın
./build.sh
```

Bu komandlar layihənizi quracaq və `bartertap_deploy.zip` arxivini yaradacaq.

### 3. FTP Konfiqurasiyası

- FileZilla və ya oxşar FTP müştərisindən istifadə edin.
- FTP Konfiqurasiyası:
  - Host: `ftp://46.202.156.134` və ya `ftp://bartertap.az`
  - İstifadəçi adı: `u726371272.bartertap.az`
  - Şifrə: _(Hostinger-də təyin etdiyiniz şifrə)_
  - Port: 21 (standart)

### 4. Faylları Yükləyin

1. FTP müştərisini açın və serverə qoşulun.
2. `public_html` qovluğuna daxil olun.
3. `bartertap_deploy.zip` arxivini serverə yükləyin.
4. Arxivi serverdə açın (extract edin).
5. Əmin olun ki, bütün əsas fayllar `public_html` qovluğunda yerləşir.

### 5. Verilənlər Bazası Konfiqurasiyası

1. Hostinger nəzarət panelində MySQL bölməsinə keçin.
2. MySQL məlumatlarınızı qeyd edin:
   - Verilənlər bazası adı: `u726371272_vjEDR`
   - İstifadəçi adı: `u726371272_0J88F`
   - Şifrə: _(Hostinger-də təyin etdiyiniz şifrə)_
   - Host: `localhost`

3. Serverdə `.env` faylını düzənləyin və verilənlər bazası məlumatlarınızı daxil edin:

```
# .env faylı
DB_HOST=localhost
DB_USER=u726371272_0J88F
DB_NAME=u726371272_vjEDR
DB_PASSWORD=your_password_here
```

### 6. Node.js Tətbiqini Başladın

Hostinger-də Node.js tətbiqləri işə salmaq üçün cPanel-dəki "Setup Node.js App" bölməsindən istifadə edin:

1. cPanel-ə daxil olun.
2. "Setup Node.js App" bölməsini tapın və ona daxil olun.
3. "Create Application" düyməsini klikləyin.
4. Aşağıdakı məlumatları daxil edin:
   - Application Path: `/`
   - Application URL: `bartertap.az` 
   - Application Startup File: `dist/server/index.js`
   - Node.js version: (ən son mövcud versiyanı seçin)
   - Application Mode: Production
   - Application Root: `public_html`

5. "Create" düyməsini klikləyin.

### 7. PM2 ilə Tətbiqi İdarə edin

Hostinger-də PM2 modulunu istifadə edərək Node.js tətbiqinizi avtomatik başlatmaq üçün:

```bash
# PM2 qlobal şəkildə quraşdırın
npm install -g pm2

# Tətbiqi başladın
pm2 start dist/server/index.js --name bartertap

# Avtomatik başlatmağı konfiqurasiya edin
pm2 startup
pm2 save
```

### 8. Domain və SSL Konfiqurasiyası

1. Hostinger nəzarət panelində "SSL" bölməsinə keçin.
2. "Install SSL" düyməsini klikləyin və "Let's Encrypt" seçin.
3. Sertifikatın quraşdırılmasını gözləyin.

## Qarşılaşdığınız Problemlər

Əgər hər hansı problemlə qarşılaşırsınızsa, aşağıdakıları yoxlayın:

1. **Error Logs**: Hostinger nəzarət panelində "Error Logs" bölməsini yoxlayın.
2. **Node.js Versiyası**: Hostinger-də istifadə olunan Node.js versiyasının tətbiqinizlə uyğun olduğunu yoxlayın.
3. **.htaccess Yönləndirmələri**: .htaccess faylının düzgün konfiqurasiya edildiyini təmin edin.
4. **Verilənlər Bazası Bağlantısı**: Verilənlər bazası əlaqəsinin doğru olduğunu yoxlayın.

## İstismar və Texniki Xidmət

- **Backup**: Mütəmadi olaraq faylları və verilənlər bazasını yedəkləyin.
- **Monitoring**: Hostinger-in monitoring xidmətindən istifadə edərək tətbiqin performansını izləyin.
- **Updates**: Node.js və digər asılılıqları mütəmadi olaraq yeniləyin.

## Əlaqə

Problem yaşadığınız halda, dəstək üçün Hostinger müştəri xidmətləri ilə əlaqə saxlayın.