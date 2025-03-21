<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? htmlspecialchars($page_title) : 'BarterTap.az - Azərbaycanın ilk barter platforması'; ?></title>
    <meta name="description" content="<?php echo isset($page_description) ? htmlspecialchars($page_description) : 'Azərbaycanda ilk onlayn barter platforması. Əşya satmağa deyil, dəyişməyə gəlin!'; ?>">
    
    <!-- Favicon -->
    <link rel="icon" href="/assets/images/favicon.png" type="image/png">
    
    <!-- Fontlar -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    
    <!-- Tailwind CSS -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <!-- Əsas CSS -->
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/responsive.css">
    
    <!-- Open Graph məlumatları -->
    <meta property="og:title" content="<?php echo isset($page_title) ? htmlspecialchars($page_title) : 'BarterTap.az - Azərbaycanın ilk barter platforması'; ?>">
    <meta property="og:description" content="<?php echo isset($page_description) ? htmlspecialchars($page_description) : 'Azərbaycanda ilk onlayn barter platforması. Əşya satmağa deyil, dəyişməyə gəlin!'; ?>">
    <meta property="og:image" content="<?php echo $site['url']; ?>/assets/images/og-image.jpg">
    <meta property="og:url" content="<?php echo currentUrl(); ?>">
    <meta property="og:type" content="website">
    
    <!-- Twitter məlumatları -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo isset($page_title) ? htmlspecialchars($page_title) : 'BarterTap.az - Azərbaycanın ilk barter platforması'; ?>">
    <meta name="twitter:description" content="<?php echo isset($page_description) ? htmlspecialchars($page_description) : 'Azərbaycanda ilk onlayn barter platforması. Əşya satmağa deyil, dəyişməyə gəlin!'; ?>">
    <meta name="twitter:image" content="<?php echo $site['url']; ?>/assets/images/og-image.jpg">
    
    <!-- Tailwind CSS Əlavələri -->
    <style>
        :root {
            --primary: #367BF5;
            --primary-hover: #1E65E0;
            --primary-50: rgba(54, 123, 245, 0.05);
            --primary-100: rgba(54, 123, 245, 0.1);
            --primary-200: rgba(54, 123, 245, 0.2);
            --primary-700: #1E65E0;
            --primary-800: #1650B3;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        
        .bg-primary {
            background-color: var(--primary);
        }
        
        .bg-primary-50 {
            background-color: var(--primary-50);
        }
        
        .bg-primary-100 {
            background-color: var(--primary-100);
        }
        
        .hover\:bg-primary-700:hover {
            background-color: var(--primary-hover);
        }
        
        .text-primary {
            color: var(--primary);
        }
        
        .text-primary-800 {
            color: var(--primary-800);
        }
        
        .hover\:text-primary:hover {
            color: var(--primary);
        }
        
        .hover\:text-primary-700:hover {
            color: var(--primary-hover);
        }
        
        .border-primary {
            border-color: var(--primary);
        }
        
        .focus\:border-primary:focus {
            border-color: var(--primary);
        }
        
        .focus\:ring-primary:focus {
            --tw-ring-color: var(--primary);
        }
        
        /* Bouncing animation */
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-20px);
            }
        }
        
        .animate-bounce {
            animation: bounce 3s infinite;
        }
    </style>
</head>
<body class="text-gray-900 bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
        <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <!-- Logo -->
                <a href="/" class="flex items-center">
                    <img src="/assets/images/logo.svg" alt="BarterTap.az" class="h-10" 
                         onerror="this.onerror=null; this.src='/assets/images/logo-placeholder.png'; this.className='h-8';">
                </a>
                
                <!-- PC menu -->
                <nav class="hidden md:flex space-x-1">
                    <a href="/" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Ana səhifə</a>
                    <a href="/search.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Elanlar</a>
                    <a href="/how-it-works.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Necə işləyir</a>
                    <a href="/faq.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">FAQ</a>
                </nav>
                
                <!-- İstifadəçi menyu (PC üçün) -->
                <div class="hidden md:flex items-center space-x-3">
                    <?php if (isLoggedIn()): ?>
                        <a href="/messages.php" class="p-2 rounded-full text-gray-700 hover:text-primary hover:bg-gray-100 relative">
                            <i class="fas fa-comments"></i>
                            <?php
                            // Oxunmamış mesajları yoxla
                            $unread_count_query = $pdo->prepare("
                                SELECT COUNT(*) 
                                FROM messages m
                                JOIN conversations c ON m.conversation_id = c.id
                                JOIN conversation_participants cp ON c.id = cp.conversation_id
                                WHERE cp.user_id = ? AND m.sender_id != ? AND m.status = 'sent'
                            ");
                            $unread_count_query->execute([$_SESSION['user_id'], $_SESSION['user_id']]);
                            $unread_count = $unread_count_query->fetchColumn();
                            
                            if ($unread_count > 0):
                            ?>
                            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"><?php echo $unread_count; ?></span>
                            <?php endif; ?>
                        </a>
                        
                        <div class="relative" x-data="{ open: false }">
                            <button @click="open = !open" class="flex items-center text-gray-700 hover:text-primary focus:outline-none">
                                <span class="mr-1"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </button>
                            
                            <div x-show="open" @click.away="open = false" class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                                <a href="/profile.php" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-user mr-2"></i> Profilim
                                </a>
                                <a href="/create-item.php" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-plus-circle mr-2"></i> Elan yerləşdir
                                </a>
                                <a href="/favorites.php" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-heart mr-2"></i> Favorilərim
                                </a>
                                <div class="border-t border-gray-100 my-1"></div>
                                <a href="/logout.php" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-sign-out-alt mr-2"></i> Çıxış
                                </a>
                            </div>
                        </div>
                    <?php else: ?>
                        <a href="/login.php" class="text-gray-700 hover:text-primary font-medium px-3 py-2">Daxil ol</a>
                        <a href="/register.php" class="bg-primary hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md transition-colors">Qeydiyyat</a>
                    <?php endif; ?>
                </div>
                
                <!-- Mobile menu button -->
                <div class="md:hidden">
                    <button onclick="toggleDropdown('mobileMenu')" class="text-gray-700 hover:text-primary focus:outline-none">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile menu -->
            <div id="mobileMenu" class="md:hidden hidden py-4 border-t border-gray-100">
                <nav class="flex flex-col space-y-2">
                    <a href="/" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Ana səhifə</a>
                    <a href="/search.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Elanlar</a>
                    <a href="/how-it-works.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Necə işləyir</a>
                    <a href="/faq.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">FAQ</a>
                    
                    <?php if (isLoggedIn()): ?>
                        <div class="border-t border-gray-100 pt-2 mt-2">
                            <a href="/profile.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center">
                                <i class="fas fa-user mr-2"></i> Profilim
                            </a>
                            <a href="/create-item.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center">
                                <i class="fas fa-plus-circle mr-2"></i> Elan yerləşdir
                            </a>
                            <a href="/messages.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center">
                                <i class="fas fa-comments mr-2"></i> Mesajlar
                                <?php if ($unread_count > 0): ?>
                                <span class="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full"><?php echo $unread_count; ?></span>
                                <?php endif; ?>
                            </a>
                            <a href="/favorites.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center">
                                <i class="fas fa-heart mr-2"></i> Favorilərim
                            </a>
                            <a href="/logout.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center">
                                <i class="fas fa-sign-out-alt mr-2"></i> Çıxış
                            </a>
                        </div>
                    <?php else: ?>
                        <div class="border-t border-gray-100 pt-2 mt-2 flex flex-col space-y-2">
                            <a href="/login.php" class="px-3 py-2 rounded text-gray-700 hover:text-primary hover:bg-gray-50">Daxil ol</a>
                            <a href="/register.php" class="bg-primary hover:bg-primary-700 text-white font-medium px-3 py-2 rounded-md transition-colors text-center">Qeydiyyat</a>
                        </div>
                    <?php endif; ?>
                </nav>
            </div>
        </div>
    </header>
    
    <!-- Əsas məzmun konteyner -->
    <div class="flex-1 flex flex-col">
        <!-- Notification bar -->
        <?php if (isset($_SESSION['message'])): ?>
            <?php showMessage(); ?>
        <?php endif; ?>
        
        <!-- Content -->