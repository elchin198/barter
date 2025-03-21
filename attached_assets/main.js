/**
 * BarterTap.az - Əsas JavaScript
 * Bu fayl saytın ümumi funksionallığını təmin edir
 */

(function() {
    'use strict';
    
    /**
     * Dropdown menyuların idarəsi
     */
    function setupDropdowns() {
        // Data attribute ilə təyin olunmuş bütün dropdown'ları tap
        const toggleButtons = document.querySelectorAll('[data-dropdown-toggle]');
        
        toggleButtons.forEach(button => {
            const targetId = button.getAttribute('data-dropdown-toggle');
            const target = document.getElementById(targetId);
            
            if (target) {
                // Düyməyə klik olunduqda dropdown'u aç/bağla
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    
                    // Digər bütün açıq dropdown'ları bağla
                    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                        if (dropdown !== target && !dropdown.classList.contains('hidden')) {
                            dropdown.classList.add('hidden');
                        }
                    });
                    
                    // Bu dropdown'u toggle et
                    target.classList.toggle('hidden');
                });
            }
        });
        
        // Səhifənin digər yerlərinə klik olunduqda dropdown'ları bağla
        document.addEventListener('click', function() {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                if (!dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                }
            });
        });
    }
    
    /**
     * Form validasiyası
     */
    function setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                let isValid = true;
                const requiredFields = form.querySelectorAll('[required]');
                
                // Əvvəlcə bütün xəta mesajlarını təmizlə
                form.querySelectorAll('.form-error').forEach(error => {
                    error.textContent = '';
                    error.classList.add('hidden');
                });
                
                // Bütün tələb olunan sahələri yoxla
                requiredFields.forEach(field => {
                    // Yoxlanılmalı elementin əsas container'ını tap
                    const formGroup = field.closest('.form-group');
                    const errorElement = formGroup ? formGroup.querySelector('.form-error') : null;
                    
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('border-red-500');
                        
                        if (errorElement) {
                            errorElement.textContent = field.getAttribute('data-error-message') || 'Bu sahəni doldurmaq məcburidir';
                            errorElement.classList.remove('hidden');
                        }
                    } else {
                        field.classList.remove('border-red-500');
                    }
                    
                    // Email sahəsi xüsusi yoxlama
                    if (field.type === 'email' && field.value.trim()) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(field.value.trim())) {
                            isValid = false;
                            field.classList.add('border-red-500');
                            
                            if (errorElement) {
                                errorElement.textContent = 'Düzgün email formatı daxil edin';
                                errorElement.classList.remove('hidden');
                            }
                        }
                    }
                    
                    // Şifrə sahəsi xüsusi yoxlama
                    if (field.type === 'password' && field.hasAttribute('data-min-length')) {
                        const minLength = parseInt(field.getAttribute('data-min-length'));
                        if (field.value.length < minLength) {
                            isValid = false;
                            field.classList.add('border-red-500');
                            
                            if (errorElement) {
                                errorElement.textContent = `Şifrə ən az ${minLength} simvol olmalıdır`;
                                errorElement.classList.remove('hidden');
                            }
                        }
                    }
                    
                    // Şifrə təsdiqi yoxlama
                    if (field.hasAttribute('data-match')) {
                        const matchSelector = field.getAttribute('data-match');
                        const matchField = form.querySelector(matchSelector);
                        
                        if (matchField && field.value !== matchField.value) {
                            isValid = false;
                            field.classList.add('border-red-500');
                            
                            if (errorElement) {
                                errorElement.textContent = 'Şifrələr uyğun gəlmir';
                                errorElement.classList.remove('hidden');
                            }
                        }
                    }
                });
                
                if (!isValid) {
                    event.preventDefault();
                }
            });
        });
    }
    
    /**
     * Şəkil yükləmə qabaqcadan baxış
     */
    function setupImageUploadPreview() {
        const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
        
        fileInputs.forEach(input => {
            const previewSelector = input.getAttribute('data-preview');
            const previewContainer = document.querySelector(previewSelector);
            const maxFiles = parseInt(input.getAttribute('data-max-files') || '5');
            
            if (previewContainer) {
                input.addEventListener('change', function() {
                    // Əvvəlki şəkilləri təmizlə əgər multiple deyilsə
                    if (!input.multiple) {
                        previewContainer.innerHTML = '';
                    }
                    
                    // Olan şəkillərin sayını hesabla
                    const existingPreviews = previewContainer.querySelectorAll('.preview-item').length;
                    
                    // Yeni şəkilləri əlavə et
                    const files = Array.from(input.files);
                    const remainingSlots = maxFiles - existingPreviews;
                    
                    files.slice(0, remainingSlots).forEach(file => {
                        if (!file.type.match('image.*')) {
                            return; // Şəkil deyilsə, keç
                        }
                        
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            const preview = document.createElement('div');
                            preview.className = 'preview-item relative inline-block w-24 h-24 m-1';
                            
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.className = 'w-full h-full object-cover rounded border';
                            preview.appendChild(img);
                            
                            // Silmə düyməsi
                            const removeButton = document.createElement('button');
                            removeButton.type = 'button';
                            removeButton.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm';
                            removeButton.innerHTML = '×';
                            removeButton.addEventListener('click', function() {
                                preview.remove();
                            });
                            preview.appendChild(removeButton);
                            
                            previewContainer.appendChild(preview);
                        };
                        
                        reader.readAsDataURL(file);
                    });
                    
                    // Maksimum şəkil limitini aşdıqda
                    if (existingPreviews + files.length > maxFiles) {
                        alert(`Maksimum ${maxFiles} şəkil yükləyə bilərsiniz`);
                    }
                });
            }
        });
    }
    
    /**
     * Elan şəkillərinin gallery formatında göstərilməsi
     */
    function setupImageGallery() {
        const galleries = document.querySelectorAll('.image-gallery');
        
        galleries.forEach(gallery => {
            const mainImage = gallery.querySelector('.main-image img');
            const thumbnails = gallery.querySelectorAll('.thumbnails img');
            
            if (mainImage && thumbnails.length) {
                thumbnails.forEach(thumb => {
                    thumb.addEventListener('click', function() {
                        // Aktiv thumbnail'i dəyişdir
                        thumbnails.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                        
                        // Əsas şəkli yenisi ilə əvəz et
                        mainImage.src = this.getAttribute('src');
                        
                        // Əgər varsa, data-full atributunu da götür
                        if (this.hasAttribute('data-full')) {
                            mainImage.setAttribute('data-full', this.getAttribute('data-full'));
                        }
                    });
                });
                
                // Əsas şəklə klik olunduqda böyüt
                if (mainImage.parentElement.hasAttribute('data-zoom')) {
                    mainImage.addEventListener('click', function() {
                        const fullImage = this.getAttribute('data-full') || this.src;
                        
                        // Modal açmaq və böyük şəkli göstərmək
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
                        modal.innerHTML = `
                            <div class="max-w-4xl mx-auto p-4">
                                <img src="${fullImage}" alt="Full size image" class="max-w-full max-h-[80vh] object-contain">
                                <button class="absolute top-4 right-4 text-white text-3xl">&times;</button>
                            </div>
                        `;
                        
                        document.body.appendChild(modal);
                        
                        // Bağlama düyməsinə klik
                        modal.querySelector('button').addEventListener('click', function() {
                            modal.remove();
                        });
                        
                        // Modal xaricində klik edəndə bağla
                        modal.addEventListener('click', function(e) {
                            if (e.target === modal) {
                                modal.remove();
                            }
                        });
                    });
                }
            }
        });
    }
    
    /**
     * Filterlər və dropdown göstərilməsi
     */
    function setupFilters() {
        const filterToggles = document.querySelectorAll('[data-filter-toggle]');
        
        filterToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-filter-toggle');
                const target = document.getElementById(targetId);
                
                if (target) {
                    const isVisible = !target.classList.contains('hidden');
                    
                    // Digər bütün filtrləri bağla
                    document.querySelectorAll('.filter-content').forEach(filter => {
                        if (filter !== target) {
                            filter.classList.add('hidden');
                        }
                    });
                    
                    // Bu filtri toggle et
                    if (isVisible) {
                        target.classList.add('hidden');
                    } else {
                        target.classList.remove('hidden');
                    }
                }
            });
        });
        
        // Səhifənin digər yerlərinə klik olunduqda filtrləri bağla
        document.addEventListener('click', function(e) {
            if (!e.target.closest('[data-filter-toggle]') && !e.target.closest('.filter-content')) {
                document.querySelectorAll('.filter-content').forEach(filter => {
                    filter.classList.add('hidden');
                });
            }
        });
    }
    
    /**
     * Mobile menyu toogle etmək
     */
    function toggleMobileMenu(id) {
        const menu = document.getElementById(id);
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    /**
     * Bildirişlərin göstərilməsi
     */
    function showNotification(message, type = 'info', duration = 5000) {
        // Bildiriş elementini yarat
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} opacity-0 transition-opacity`;
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-1 pr-3">${message}</div>
                <button class="notification-close text-gray-500 hover:text-gray-800">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Body'yə əlavə et
        document.body.appendChild(notification);
        
        // Görünən et
        setTimeout(() => {
            notification.classList.remove('opacity-0');
        }, 10);
        
        // Bildirişi bağla düyməsi işləsin
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Avtomatik bağlanma
        setTimeout(() => {
            notification.classList.add('opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
        
        return notification;
    }
    
    /**
     * Sayt hazır olduqda işə düşəcək funksiyalar
     */
    function init() {
        setupDropdowns();
        setupFormValidation();
        setupImageUploadPreview();
        setupImageGallery();
        setupFilters();
        
        // Global funksiyaları pəncərəyə əlavə et
        window.toggleMobileMenu = toggleMobileMenu;
        window.showNotification = showNotification;
    }
    
    // DOMContentLoaded hadisəsi baş verdikdə
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();