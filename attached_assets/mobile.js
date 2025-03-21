/**
 * BarterTap.az - Mobil cihazlar üçün funksionallıq
 * Bu JavaScript faylı mobil istifadəçi təcrübəsini yaxşılaşdırmaq üçün
 * lazım olan funksiyaları təmin edir
 */

(function() {
    'use strict';
    
    // DOM elementlərini əldə et
    const mobileNav = document.getElementById('mobileMenu');
    const mobileNavToggle = document.getElementById('mobileMenuToggle');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    /**
     * Mobil Menü idarəetməsi
     */
    function setupMobileMenu() {
        // Menyu düyməsi varsa
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', function(e) {
                e.preventDefault();
                if (mobileNav) {
                    const isHidden = mobileNav.classList.contains('hidden');
                    if (isHidden) {
                        mobileNav.classList.remove('hidden');
                        mobileNav.classList.add('mobile-menu-enter');
                    } else {
                        mobileNav.classList.add('hidden');
                        mobileNav.classList.remove('mobile-menu-enter');
                    }
                }
            });
        }
        
        // Bütün dropdownları idarə et
        dropdowns.forEach(dropdown => {
            const toggleBtn = dropdown.querySelector('[data-dropdown-toggle]');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggleBtn && menu) {
                toggleBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const isHidden = menu.classList.contains('hidden');
                    
                    // Digər bütün açıq dropdown'ları bağla
                    document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(openMenu => {
                        if (openMenu !== menu) {
                            openMenu.classList.add('hidden');
                        }
                    });
                    
                    // Bu dropdown'u aç/bağla
                    if (isHidden) {
                        menu.classList.remove('hidden');
                    } else {
                        menu.classList.add('hidden');
                    }
                });
            }
        });
        
        // Səhifənin başqa yerinə klik olunduqda bütün dropdown'ları bağla
        document.addEventListener('click', function() {
            document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(menu => {
                menu.classList.add('hidden');
            });
        });
    }
    
    /**
     * İmage lazy loading - şəkillərin lazımi zamanda yüklənməsi
     */
    function setupLazyLoading() {
        // Lazy load üçün olan şəkilləri tap
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        // Şəkilləri yavaş-yavaş yüklə
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        image.src = image.dataset.src;
                        
                        // Əgər data-srcset varsa, onu da əlavə et
                        if (image.dataset.srcset) {
                            image.srcset = image.dataset.srcset;
                        }
                        
                        // Yüklənmə tamamlandıqda "lazy" klassını sil
                        image.onload = function() {
                            image.classList.remove('lazy');
                            image.removeAttribute('data-src');
                            image.removeAttribute('data-srcset');
                        };
                        
                        // Bu şəkli artıq izləmə
                        imageObserver.unobserve(image);
                    }
                });
            });
            
            lazyImages.forEach(function(image) {
                imageObserver.observe(image);
            });
        } else {
            // IntersectionObserver dəstəklənmirsə, sadə üsul istifadə et
            let lazyLoadThrottleTimeout;
            
            function lazyLoad() {
                if (lazyLoadThrottleTimeout) {
                    clearTimeout(lazyLoadThrottleTimeout);
                }
                
                lazyLoadThrottleTimeout = setTimeout(function() {
                    const scrollTop = window.pageYOffset;
                    
                    lazyImages.forEach(function(img) {
                        if (img.offsetTop < (window.innerHeight + scrollTop)) {
                            img.src = img.dataset.src;
                            if (img.dataset.srcset) {
                                img.srcset = img.dataset.srcset;
                            }
                            img.classList.remove('lazy');
                        }
                    });
                    
                    if (lazyImages.length == 0) {
                        document.removeEventListener('scroll', lazyLoad);
                        window.removeEventListener('resize', lazyLoad);
                        window.removeEventListener('orientationChange', lazyLoad);
                    }
                }, 20);
            }
            
            document.addEventListener('scroll', lazyLoad);
            window.addEventListener('resize', lazyLoad);
            window.addEventListener('orientationChange', lazyLoad);
        }
    }
    
    /**
     * Toxunuş cihazları üçün xüsusi davranışlar
     */
    function setupTouchBehavior() {
        // Toxunuş cihazı olub-olmadığını yoxla
        const isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            
            // Karusel sürüşdürmə
            const carousels = document.querySelectorAll('.touch-scroll');
            carousels.forEach(carousel => {
                let isDown = false;
                let startX;
                let scrollLeft;
                
                carousel.addEventListener('mousedown', (e) => {
                    isDown = true;
                    carousel.classList.add('active');
                    startX = e.pageX - carousel.offsetLeft;
                    scrollLeft = carousel.scrollLeft;
                });
                
                carousel.addEventListener('mouseleave', () => {
                    isDown = false;
                    carousel.classList.remove('active');
                });
                
                carousel.addEventListener('mouseup', () => {
                    isDown = false;
                    carousel.classList.remove('active');
                });
                
                carousel.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - carousel.offsetLeft;
                    const walk = (x - startX) * 2;
                    carousel.scrollLeft = scrollLeft - walk;
                });
            });
        }
    }
    
    /**
     * Mobil cihazlar üçün bildirişlərin göstərilməsi
     */
    function setupNotifications() {
        const notifications = document.querySelectorAll('.notification');
        
        notifications.forEach(notification => {
            // Bildirişləri 5 saniyə sonra gizlət
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 5000);
            
            // Bildirişi qapatma düyməsi
            const closeButton = notification.querySelector('.notification-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    notification.classList.add('opacity-0');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                });
            }
        });
    }
    
    /**
     * Elan şəkillərinin yüklənmə animasiyası
     */
    function setupImageLoading() {
        const blurDivs = document.querySelectorAll('.blur-load');
        
        blurDivs.forEach(div => {
            const img = div.querySelector('img');
            
            function loaded() {
                div.classList.add('loaded');
            }
            
            if (img.complete) {
                loaded();
            } else {
                img.addEventListener('load', loaded);
            }
        });
    }
    
    /**
     * Cihazın orientasiyası dəyişdikdə və ya ölçüsü dəyişdikdə
     * müəyyən elementləri yenidən hesabla
     */
    function handleResize() {
        const resizeHandler = () => {
            // Mobil cihazlarda menyu bağlansın
            if (window.innerWidth > 768 && mobileNav && !mobileNav.classList.contains('hidden')) {
                mobileNav.classList.add('hidden');
            }
            
            // Elan kartların hündürlükləri uyğunlaşsın
            const itemCards = document.querySelectorAll('.item-card');
            let maxHeight = 0;
            
            // Əvvəlcə hamısının hündürlüyünü sıfırla
            itemCards.forEach(card => {
                card.style.height = 'auto';
            });
            
            // Sonra maksimum hündürlüyü tap
            itemCards.forEach(card => {
                if (card.offsetHeight > maxHeight) {
                    maxHeight = card.offsetHeight;
                }
            });
            
            // Hamısını eyni hündürlükdə et (desktop görünüşdə)
            if (window.innerWidth >= 768) {
                itemCards.forEach(card => {
                    card.style.height = maxHeight + 'px';
                });
            }
        };
        
        // Cihaz döndərildikdə və ya ekran ölçüsü dəyişdikdə
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', resizeHandler);
        
        // Səhifə ilk yükləndikdə
        resizeHandler();
    }
    
    /**
     * Sayt hazır olduqda işə salınacaq funksiyalar
     */
    function init() {
        setupMobileMenu();
        setupLazyLoading();
        setupTouchBehavior();
        setupNotifications();
        setupImageLoading();
        handleResize();
        
        // Form elementlərinə kliklər
        document.addEventListener('click', function(e) {
            // Favorilərə əlavə et
            if (e.target.closest('.favorite-button')) {
                const btn = e.target.closest('.favorite-button');
                toggleFavorite(btn);
            }
        });
    }
    
    /**
     * Favorilərə əlavə/silmə əməliyyatı
     */
    function toggleFavorite(button) {
        const itemId = button.getAttribute('data-item-id');
        
        if (!itemId) return;
        
        // Vizual əks əlaqə
        button.classList.toggle('favorited');
        
        // Server ilə əlaqə qur
        fetch('/api/favorites.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
                action: button.classList.contains('favorited') ? 'add' : 'remove'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                button.classList.toggle('favorited'); // Uğursuz olduqda, dəyişikliyi geri al
                console.error(data.error);
            }
        })
        .catch(error => {
            button.classList.toggle('favorited'); // Xəta olduqda, dəyişikliyi geri al
            console.error('Xəta baş verdi:', error);
        });
    }
    
    // DOMContentLoaded hadisəsi ilə funksiyaları işə sal
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();