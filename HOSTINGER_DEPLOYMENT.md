# BarterTap.az Hostinger Yerləşdirmə Təlimatları

Bu sənəd BarterTap.az tətbiqinin Hostinger serverində yerləşdirilməsi üçün ətraflı addım-addım təlimatları təqdim edir.

## Ümumi məlumat

BarterTap.az barter mübadilə platforması aşağıdakı texnologiyalardan istifadə edir:

- **Frontend**: React.js + TypeScript
- **Backend**: PHP (Hostinger-də) / Node.js (yerli rejim)
- **Verilənlər bazası**: MySQL (Hostinger-də) / PostgreSQL (yerli rejim)
- **Hosting**: Hostinger serverləri

## Tələb olunan mühit

- PHP 8.0+ 
- MySQL 5.7+
- Veb server: Apache (mod_rewrite modullu)
- SSL sertifikatı (HTTPS üçün)

## Yerləşdirmə variantları

Tətbiqi Hostinger-də yerləşdirmək üçün əsasən iki yanaşma mövcuddur:

### 1. Avtomatik quraşdırma (Tövsiyə olunur)

Bu ən sadə və ən etibarlı yanaşmadır:

1. Yerli maşında işləyən kodu test et və hazırla
2. Skripti işə salın: `bash install_on_hostinger.sh`
3. Yaradılmış `bartertap_hostinger.zip` faylını endirin
4. FTP ilə Hostinger hesabınıza bağlanın (FileZilla və ya istənilən FTP klienti ilə)
5. Arxivi public_html qovluğuna yükləyin və çıxarın
6. Hostinger-də PhpMyAdmin ilə daxil olun və açın: `https://bartertap.az/setup_database.php` (ilk dəfə yalnız!)
7. MySQL məlumatlarını yoxlayın və düzəldin (lazım olarsa): `.env.production` faylında

### 2. Manual yerləşdirmə

Daha çox nəzarət istəyənlər üçün manual yerləşdirmə addımları:

1. Yerli build yaradın: `npm run build`
2. Aşağıdakı fayl və qovluqları FTP ilə Hostinger-dəki `public_html` qovluğuna yükləyin:
   - `dist/` qovluğunun bütün məzmunu
   - `.htaccess` faylı
   - `index.php` faylı
   - `api.php` faylı
   - `hostinger_db_setup.php` faylı
   - `.env.production` faylı (MySQL üçün konfiqurasiya etdikdən sonra)
   
3. PhpMyAdmin vasitəsilə ilk verilənlər bazası qurun və ya SSH ilə bağlanıb `php hostinger_db_setup.php` əmrini icra edin.

## Problemlərin həlli

Sistem Hostinger-də işləmədikdə aşağıdakı addımları atın:

1. Təmir skriptini işə salın: `bash hostinger_fix.sh`
2. Təmir skripti avtomatik olaraq bu problemləri həll etməyə çalışacaq:
   - Fayl icazələrini düzəltmək
   - .htaccess faylının düzgünlüyünü yoxlamaq və lazım olduqda yeniləmək
   - index.php və digər kritik faylların olub-olmadığını yoxlamaq
   - PHP konfiqurasiyasını optimallaşdırmaq

## Sistem doğrulama

Sistemin işləməsini yoxlamaq üçün aşağıdakı addımları yerinə yetirin:

1. Ana saytı açın: `https://bartertap.az`
2. API-ın işləməsini yoxlayın: `https://bartertap.az/api/health`
3. Testlərdən istifadə edin:
   - İstifadəçi: `testuser`
   - Şifrə: `password123`

## Hostinger spesifik parametrlər

Hostinger-də BarterTap.az üçün optimal parametrlər:

- PHP Versiyası: 8.3.16 (tövsiyə olunur)
- PHP Yaddaş limiti: 256MB
- MySQL verilənlər bazası: u726371272_barter_db
- MySQL istifadəçi: u726371272_barter_user
- FTP giriş məlumatları:
  - Host: 46.202.156.134
  - İstifadəçi adı: u726371272.bartertap.az
  - Port: 21
  - Yükləmə qovluğu: public_html

## Əlaqə məlumatı

Texniki dəstək və əlavə kömək üçün:

- Email: hicran.huseynli@gmail.com
- Telefon: +994 55 255 48 00