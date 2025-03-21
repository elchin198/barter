<div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
        <div class="relative h-48">
            <img src="<?php echo $imageUrl; ?>" alt="<?php echo $item['title']; ?>" class="w-full h-full object-cover">
            <span class="absolute top-3 left-3 bg-primary/90 text-white text-xs px-2 py-1 rounded"><?php echo $item['categoryName']; ?></span>
            <?php if (isLoggedIn()): ?>
                <?php
                // Əşya favorilərə əlavə olunub-olunmadığını yoxlamaq
                $fav_sql = "SELECT id FROM favorites WHERE userId = ? AND itemId = ?";
                $fav_stmt = $pdo->prepare($fav_sql);
                $fav_stmt->execute([$_SESSION['user_id'], $item['id']]);
                $isFavorite = $fav_stmt->rowCount() > 0;
                ?>
                <button 
                    class="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition-colors favorite-button"
                    data-item-id="<?php echo $item['id']; ?>"
                    data-is-favorite="<?php echo $isFavorite ? 'true' : 'false'; ?>"
                    onclick="toggleFavorite(event, this)">
                    <i class="<?php echo $isFavorite ? 'fas' : 'far'; ?> fa-heart text-red-500"></i>
                </button>
            <?php endif; ?>
        </div>
    </a>
    
    <div class="p-4">
        <div class="flex items-start justify-between gap-2">
            <a href="item.php?id=<?php echo $item['id']; ?>" class="block">
                <h3 class="font-medium text-lg mb-1 hover:text-primary transition-colors"><?php echo $item['title']; ?></h3>
            </a>
            <?php if ($item['status'] === 'completed'): ?>
                <span class="bg-gray-500 text-white text-xs px-2 py-1 rounded">Tamamlanıb</span>
            <?php elseif ($item['status'] === 'pending'): ?>
                <span class="bg-amber-500 text-white text-xs px-2 py-1 rounded">Gözləmədə</span>
            <?php endif; ?>
        </div>
        
        <div class="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <i class="fas fa-map-marker-alt text-gray-400"></i>
            <span><?php echo $item['location']; ?></span>
            <span class="mx-2">•</span>
            <span><?php echo formatDate($item['createdAt']); ?></span>
        </div>
        
        <div class="border-t border-gray-100 pt-3 mt-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <a href="profile.php?id=<?php echo $item['userId']; ?>">
                        <img src="<?php echo !empty($item['avatar']) ? $item['avatar'] : 'assets/images/default-avatar.png'; ?>" alt="<?php echo $item['username']; ?>" class="w-8 h-8 rounded-full object-cover">
                    </a>
                    <a href="profile.php?id=<?php echo $item['userId']; ?>" class="text-sm hover:text-primary transition-colors">
                        <?php echo $item['username']; ?>
                    </a>
                </div>
                <div class="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    <span class="text-gray-600">Dəyişmək istəyir:</span> <strong><?php echo $item['wantedExchange']; ?></strong>
                </div>
            </div>
        </div>
    </div>
</div>