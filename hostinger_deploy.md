# Hostinger Yerləşdirmə Təlimatları

## 403 Xətasının Həlli üçün Əsas Səbəblər

Hostinger-də 403 "Forbidden" xətası aşağıdakı səbəblərdən ola bilər:

1. **İndeks faylının olmaması**: `index.html`, `index.php` və ya `index.js` fayl olmalıdır
2. **İcazə problemi**: Fayl icazələri düzgün təyin edilməyib (644 fayllar, 755 qovluqlar)
3. **Yanlış `.htaccess` faylı**: Hostinger konfiqurasiyası ilə uyğun olmaya bilər
4. **Səhv qovluq strukturu**: Fayllar `public_html` qovluğuna yüklənməyibsə

## Düzgün Yerləşdirmə Addımları

### 1. Tətbiqi Build Etmək

```bash
# Əvvəlcə tətbiq fayllarını hazırlayın
npm run build
```

### 2. Hostinger-ə Yüklənəcək Faylları Hazırlayın

Siz NodeJS tətbiqini iki yolla yerləşdirə bilərsiniz:

#### Variant A: Node.js Hosting istifadə edərək (Tövsiyə olunan)

1. Hostinger-in Node.js xidmətindən istifadə edin.
2. Bunun üçün Hostinger idarəetmə panelində "Vebsayt" > "Node.js" bölməsinə keçin.
3. Giriş nöqtəsi olaraq `server/index.js` və node versiyası ən az 18.x təyin edin.
4. Bütün repo-nu yükləyin.

#### Variant B: Statik Hosting istifadə edərək (Alternativ)

Bu variant üçün:

1. `dist/` qovluğunda frontend tətbiqi olmalıdır
2. `public_html` qovluğuna yüklənəcək aşağıdakı faylları hazırlayın:

```
public_html/
├── index.html      # Vite tərəfindən yaradılan əsas HTML fayl
├── index.php       # PHP hosting üçün yönləndiricı
├── .htaccess       # Apache konfiqurasyası
├── assets/         # Frontend assetləri (JS, CSS, şəkillər)
```

### 3. İndeks faylları yaradın

#### index.html
```html
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BarterTap - Mübadilə Platformu</title>
  <meta name="description" content="BarterTap - Azərbaycanda əşyaların barter mübadiləsi üçün platformadır." />
  <script type="module" crossorigin src="/assets/index-abc123.js"></script>
  <link rel="stylesheet" href="/assets/index-xyz789.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

#### index.php (PHP hostinqlər üçün)
```php
<?php
// Bu fayl PHP hosting mühitləri üçün lazımdır
// Sadəcə index.html faylına yönləndirir
include_once('index.html');
?>
```

### 4. Hostinger Node.js Qurulumu

Əgər Hostinger-də Node.js tətbiqinizi çalışdırmaq istəyirsinizsə:

1. Hostinger idarəetmə panelində "Vebsayt" > "Node.js" bölməsinə keçin
2. Yeni Node.js tətbiqi yaradın
3. Aşağıdakı parametrləri təyin edin:
   - Giriş nöqtəsi: `server/index.js`
   - Node.js versiyası: 18.x (LTS)
   - NPM versiyası: Ən son
4. "Node.js aktivləşdir" düyməsini klikləyin
5. Aktivləşdirdikdən sonra Terminal tabına keçin
6. Aşağıdakı əmrləri işə salın:
   ```
   npm install
   node server/index.js
   ```

### 5. MySQL Məlumat bazası Qurulumu

1. Hostinger idarəetmə panelində "Məlumat bazası" bölməsinə keçin
2. Yeni MySQL məlumat bazası yaradın
3. Məlumat bazası adını, istifadəçi adını, şifrəni və host məlumatlarını qeyd edin
4. `.env` faylını açın və DATABASE_URL-i Hostinger MySQL məlumatları ilə yeniləyin:
   ```
   DATABASE_URL=mysql://{username}:{password}@{host}:3306/{database}
   ```

### 6. Digər Vacib Dəyişikliklər

- **Fayl icazələri**: Bütün faylların icazələrini yoxlayın (adətən 644 fayllar, 755 qovluqlar üçün)
- **SSL aktivləşdirmə**: Hostinger idarəetmə panelində "SSL" bölməsindən Let's Encrypt SSL sertifikatını aktivləşdirin
- **Domain yönləndirmə**: www subdomenindən əsas domenə yönləndirmə qurun

## Həll Edilməmiş Problemlər Üçün

Əgər hələ də 403 xətası ilə qarşılaşırsınızsa:

1. Hostinger-in fayl menecerində `.htaccess` faylını doğru qovluqda olduğundan əmin olun
2. Bütün faylların yerində olduğunu və doğru icazələrə (644) sahib olduğunu yoxlayın
3. Hostinger-in texniki dəstəyi ilə əlaqə saxlayın və size Node.js tətbiqinin aktivləşdirilməsində kömək etmələrini istəyin