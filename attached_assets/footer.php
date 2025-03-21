    </div><!-- Əsas məzmun konteyner sonu -->
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
        <div class="container mx-auto px-4">
            <!-- Footer üst hissə -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <!-- BarterTap haqqında -->
                <div>
                    <a href="/" class="inline-block mb-4">
                        <img src="/assets/images/logo-white.svg" alt="BarterTap.az" class="h-8" 
                             onerror="this.onerror=null; this.src='/assets/images/logo-white-placeholder.png'; this.className='h-7';">
                    </a>
                    <p class="text-gray-400 mb-4">
                        BarterTap.az - Azərbaycanda ilk onlayn barter platforması. Əşyalarınızı pulsuz dəyişin.
                    </p>
                    <div class="flex space-x-3">
                        <a href="https://facebook.com/bartertap" target="_blank" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://instagram.com/bartertap" target="_blank" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="https://twitter.com/bartertap" target="_blank" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-twitter"></i>
                        </a>
                    </div>
                </div>
                
                <!-- Sürətli keçidlər -->
                <div>
                    <h3 class="text-white font-medium mb-4">Sürətli keçidlər</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/" class="hover:text-white transition-colors">Ana səhifə</a></li>
                        <li><a href="/search.php" class="hover:text-white transition-colors">Elanlar</a></li>
                        <li><a href="/how-it-works.php" class="hover:text-white transition-colors">Necə işləyir</a></li>
                        <li><a href="/faq.php" class="hover:text-white transition-colors">Tez-tez soruşulan suallar</a></li>
                        <li><a href="/contact.php" class="hover:text-white transition-colors">Əlaqə</a></li>
                    </ul>
                </div>
                
                <!-- Kateqoriyalar -->
                <div>
                    <h3 class="text-white font-medium mb-4">Əsas kateqoriyalar</h3>
                    <?php
                    // Əsas kateqoriyaları əldə et
                    $main_categories_query = $pdo->query("
                        SELECT c.*, COUNT(i.id) as item_count
                        FROM categories c
                        LEFT JOIN items i ON c.id = i.category_id AND i.status = 'active'
                        WHERE c.parent_id IS NULL OR c.parent_id = 0
                        GROUP BY c.id
                        ORDER BY item_count DESC
                        LIMIT 6
                    ");
                    $main_categories = $main_categories_query->fetchAll();
                    ?>
                    <ul class="space-y-2 text-gray-400">
                        <?php foreach ($main_categories as $category): ?>
                            <li>
                                <a href="/category.php?id=<?php echo $category['id']; ?>" class="hover:text-white transition-colors">
                                    <?php echo htmlspecialchars($category['display_name']); ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                
                <!-- Əlaqə -->
                <div>
                    <h3 class="text-white font-medium mb-4">Əlaqə</h3>
                    <ul class="space-y-3 text-gray-400">
                        <li class="flex items-start">
                            <i class="fas fa-envelope mt-1 mr-2"></i>
                            <span><a href="mailto:info@bartertap.az" class="hover:text-white transition-colors">info@bartertap.az</a></span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-phone-alt mt-1 mr-2"></i>
                            <span><a href="tel:+994501234567" class="hover:text-white transition-colors">+994 50 123 45 67</a></span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-map-marker-alt mt-1 mr-2"></i>
                            <span>Bakı şəhəri, Azərbaycan</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <!-- Footer alt hissə -->
            <div class="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
                <div class="text-gray-400 text-sm mb-4 md:mb-0">
                    &copy; <?php echo date("Y"); ?> BarterTap.az. Bütün hüquqlar qorunur.
                </div>
                
                <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                    <a href="/terms.php" class="hover:text-white transition-colors">İstifadə şərtləri</a>
                    <a href="/privacy.php" class="hover:text-white transition-colors">Məxfilik siyasəti</a>
                    <a href="/cookie-policy.php" class="hover:text-white transition-colors">Cookie siyasəti</a>
                </div>
            </div>
        </div>
    </footer>
    
    <!-- Alpine.js -->
    <script src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.2/dist/alpine.min.js" defer></script>
    
    <!-- Əsas JavaScript -->
    <script src="/assets/js/main.js"></script>
    <script src="/assets/js/mobile.js"></script>
    
    <!-- Səhifə xüsusi JavaScript -->
    <script>
        // Page-specific handlers if needed
        function toggleDropdown(id) {
            const dropdown = document.getElementById(id);
            if (dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('mobile-menu-enter');
            } else {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('mobile-menu-enter');
            }
        }
    </script>
    
    <!-- Custom JavaScript -->
    <?php if (isset($page_scripts)): ?>
        <?php echo $page_scripts; ?>
    <?php endif; ?>
</body>
</html>