# BarterTap.az - Onlayn Barter Platforması (PHP Versiyası)

## Haqqında

BarterTap.az, Azərbaycanda ilk onlayn barter platformasıdır. İstifadəçilər öz əşyalarını pulsuz olaraq platformaya yerləşdirib digər maraqlı əşyalarla dəyişdirə bilərlər. Bu platforma, istifadəçilərin istifadə etmədikləri əşyaları pul xərcləmədən lazım olan əşyalarla dəyişməyə imkan yaradır.

## Texnologiyalar

- PHP 7.4+
- MySQL/MariaDB
- HTML5, CSS3, JavaScript
- Tailwind CSS
- Font Awesome
- Responsive Design

## Sistem Tələbləri

- PHP 7.4 və ya daha yüksək
- MySQL 5.7 və ya daha yüksək
- Apache/Nginx Web server
- mod_rewrite (Apache üçün)

## Quraşdırma

1. **Repozitosiyanı klonlayın:**
   ```
   git clone https://github.com/yourusername/bartertap.git
   cd bartertap
   ```

2. **Verilənlər bazası quraşdırması:**
   - MySQL-də 'bartertap_db' adında yeni verilənlər bazası yaradın
   - `includes/config.php` faylında verilənlər bazası quraşdırmalarını düzəldin:
     ```php
     $host = 'localhost';
     $db = 'bartertap_db';
     $user = 'your_database_user';
     $pass = 'your_database_password';
     ```

3. **Verilənlər bazası cədvəllərini yaradın:**
   ```
   php setup-database.php
   ```

4. **Sistemi icazələri nizamlayın:**
   ```
   chmod 755 -R .
   chmod 777 -R uploads/
   ```

5. **Web server quraşdırması:**
   - Apache: VirtualHost quraşdırın və ya sayt qovluğunu public_html-ə kopyalayın
   - nginx: Uyğun server bloku quraşdırın

6. **Saytı açın:**
   - Brauzerinizdə saytı açın (məsələn, http://localhost/bartertap veya http://bartertap.az)
   - İlk istifadəçi qeydiyyatını tamamlayın

## Layihə Strukturu

```
php_version/
├── assets/          # Statik fayllar (CSS, JavaScript, şəkillər)
│   ├── css/         # CSS faylları
│   ├── js/          # JavaScript faylları
│   └── images/      # Şəkillər və media faylları
├── includes/        # Komponentlər və yardımçı fayllər
│   ├── config.php   # Quraşdırma faylı
│   ├── header.php   # Sayt başlığı
│   ├── footer.php   # Sayt alt hissəsi
│   └── item-card.php # Əşya kartı komponenti
├── uploads/         # İstifadəçilər tərəfindən yüklənən fayllar
├── api/             # API ilə əlaqəli endpointlər
├── index.php        # Ana səhifə
├── how-it-works.php # Necə işləyir səhifəsi
├── faq.php          # Tez-tez soruşulan suallar
└── setup-database.php # Verilənlər bazası miqrasiyası
```

## Əsas Funksiyalar

- İstifadəçi qeydiyyatı və giriş sistemi
- Əşya elanı yerləşdirmə və idarə etmə
- Şəkil yükləmə və qalereyalar
- Elanlar üçün advanced axtarış və filtrlər
- Mesajlaşma sistemi
- Favorilər siyahısı
- Elanları kateqoriyalara bölmə
- Barter təklifi göndərmə sistemi
- Təhlükəsiz əşya dəyişmə prosesi
- İstifadəçi rəy və qiymətləndirmə sistemi
- Responsive dizayn (mobil və desktop dəstəyi)

## Təhlükəsizlik Məsləhətləri

- Şifrənizi mürəkkəb edin və heç kimlə paylaşmayın
- İctimai yerlərdə barter prosesini tamamlayın
- Əşyaları dəyişmədən əvvəl diqqətlə yoxlayın
- Şübhəli təklifləri şikayət edin
- Platformada təsdiq edilmiş istifadəçilərə üstünlük verin

## Lisenziya

Bu layihə azad istifadə üçün hazırlanmışdır. Təlimatlar üçün `LICENSE` faylına baxın.

## Dəstək

Əlavə suallar və dəstək üçün `support@bartertap.az` e-poçt ünvanı ilə əlaqə saxlaya bilərsiniz.