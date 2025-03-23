# GitHub Reposuna Əlavə Etmək Təlimatları

## Hazırlıq

1. Lokal kompüterinizdə git yüklü olduğundan əmin olun.
2. GitHub hesabınıza daxil olun.

## Lokal Reponu Hazırlamaq

1. Projektinizin kökündən başlayın və aşağıdakı əmrləri terminal/command prompt pəncərəsində daxil edin:

```bash
# Git reponu başladın
git init

# .gitignore faylını yarat
cat > .gitignore << EOF
node_modules/
.env
.env.local
.vscode/
dist/
build/
public/uploads/*
!public/uploads/.gitkeep
logs/
*.log
.DS_Store
*.pem
coverage/
EOF

# Tüm faylları git-ə əlavə et
git add .

# İlk commit-i yarat
git commit -m "BarterTap.az - İlkin versiya"
```

## GitHub ilə Əlaqələndirmək

```bash
# GitHub repository-nizi uzaq repo kimi əlavə edin
git remote add origin https://github.com/elchin198/barter-backend.git

# Ana branch-i main olaraq təyin edin
git branch -M main

# Kod dəyişikliklərini GitHub-a push edin
git push -u origin main
```

## GitHub Repositoridən serverə birbaşa deploy

Hostinger serveriniz SSH girişi təmin edir, ona görə də GitHub-dan birbaşa çəkib ala bilərsiniz:

```bash
# Hostinger serverinə SSH ilə qoşulun
ssh -p 65002 u726371272@46.202.156.134

# public_html qovluğuna keçin
cd ~/public_html

# Əgər artıq fayl varsa və yeni quraşdırma etmək istəyirsinizsə, qovluğu təmizləyin
# Diqqət: Bu prosesi yalnız yeni quraşdırma üçün edin və mövcud sayt varsa, əvvəlcə yedəkləyin
# rm -rf *

# GitHub repositorini klonlaştırın
git clone https://github.com/elchin198/barter-backend.git .

# Asılılıqları quraşdırın
npm install --production

# .env faylını yaradın
cat > .env << EOL
NODE_ENV=production
PORT=5000
SESSION_SECRET=<güclü bir sesiya şifrəsi>
DATABASE_URL=mysql://u726371272_barter_db:<şifrə>@localhost:3306/u726371272_barter_db
EOL

# PM2 process manager-i quraşdırın (əgər quraşdırılmayıbsa)
npm install -g pm2

# Tətbiqi başladın
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Yerləşdirmə Təlimatları

Repo əlavə ediləndən sonra Hostinger-də yerləşdirmə bəzi seçimlə edilə bilər:

### Seçim 1: GitHub-dan birbaşa çekmək

```bash
# Hostinger serverinə SSH ilə qoşulun
ssh u726371272@bartertap.az

# GitHub-dan kodu çəkin
cd ~/public_html
git clone https://github.com/elchin198/barter-backend.git .

# Asılılıqları quraşdırın
npm install --production

# Server-i başladın
pm2 start ecosystem.config.js
```

### Seçim 2: FTP ilə yükləmək

1. Proyekti build edin: `npm run build`
2. FileZilla kimi FTP proqramı ilə aşağıdakı göstərilənləri yükləyin:
   - dist/ (bütün məzmun)
   - ecosystem.config.js
   - package.json və package-lock.json 
   - Digər lazımi statik fayllar

3. Hostinger serverinə SSH ilə qoşulun:
   - `npm install --production` əmri ilə asılılıqları quraşdırın
   - `pm2 start ecosystem.config.js` ilə serveri başladın

## Vacib Qeydlər

1. `.env` faylında verilənlər bazası məlumatlarını təyin edin:
   - DB_USER: u726371272_barter_db
   - DB_PASSWORD: (verilənlər bazası şifrəsi)
   - DB_NAME: u726371272_barter_db
   - SESSION_SECRET: (təhlükəsiz bir təsadüfi sətir)

2. Nginx konfiqurasiyasını yoxlayın və lazım olduqda Hostinger tərəfindən təmin edilən şablona uyğunlaşdırın.

3. Xüsusi subdomain üçün DNS-i konfiqurasiya edin (əgər lazımdırsa):
   - Tip: A 
   - Host: bartertap.az
   - IP: 46.202.156.134

## Hostinger-də Avtomatik Deploy (Seçim)

GitHub Actions vasitəsilə avtomatik yerləşdirməni konfiqurasiya edə bilərsiniz:

1. GitHub reposunda `.github/workflows/deploy.yml` faylını yaradın.
2. GitHub Actions'i ve Hostinger'i birləşdirmək üçün SSH key təyin edin.
3. Hər push-dan sonra avtomatik yerləşdirmə işini təyin edin.

## İzləmə və Təminat

Yerləşdirmədən sonra:

1. Hostingerin cPanel/Log-larını yoxlayın
2. `pm2 logs` əmri ilə tətbiqin özünün jurnallarını yoxlayın
3. Tətbiqin əsas funksiyalarını yoxlamaq üçün sınaq keçirin