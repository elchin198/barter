<?php
// Barter Statistikaları səhifəsi
require_once 'includes/config.php';

// Giriş yoxlaması
requireLogin();

// Optimizasiya edilmiş sorğuları include et
require_once 'includes/optimized_queries.php';

// Cari istifadəçi məlumatlarını əldə et
$current_user = getCurrentUser();

// Səhifə başlığı və açıqlaması
$page_title = "Barter Statistikaları | BarterTap.az";
$page_description = "BarterTap.az platformasında barter fəaliyyətlərinizin statistikasını izləyin və analiz edin.";

// Vaxt aralığı filtri
$time_range = isset($_GET['range']) ? $_GET['range'] : 'all';
$range_sql = '';
$range_title = 'Bütün zamanlar';

switch ($time_range) {
    case 'week':
        $range_sql = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        $range_title = 'Son həftə';
        break;
    case 'month':
        $range_sql = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        $range_title = 'Son ay';
        break;
    case 'year':
        $range_sql = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        $range_title = 'Son il';
        break;
}

// Əsas statistikalar
$stats = [
    'total_items' => 0,
    'active_items' => 0,
    'completed_barters' => 0,
    'pending_barters' => 0,
    'cancelled_barters' => 0,
    'rejected_barters' => 0,
    'total_offers_sent' => 0,
    'total_offers_received' => 0,
    'avg_rating' => 0,
    'rating_count' => 0,
    'favorites_count' => 0,
    'avg_response_time' => 0,
    'most_active_category' => '',
    'most_successful_category' => '',
];

// Elan statistikaları
$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
    FROM items
    WHERE user_id = ? $range_sql
");
$stmt->execute([$current_user['id']]);
$item_stats = $stmt->fetch();

$stats['total_items'] = $item_stats['total_count'] ?? 0;
$stats['active_items'] = $item_stats['active_count'] ?? 0;

// Barter statistikaları - göndərilən təkliflər
$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM offers
    WHERE sender_id = ? $range_sql
");
$stmt->execute([$current_user['id']]);
$sent_stats = $stmt->fetch();

// Barter statistikaları - alınan təkliflər
$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM offers
    WHERE recipient_id = ? $range_sql
");
$stmt->execute([$current_user['id']]);
$received_stats = $stmt->fetch();

$stats['total_offers_sent'] = $sent_stats['total_count'] ?? 0;
$stats['total_offers_received'] = $received_stats['total_count'] ?? 0;
$stats['completed_barters'] = ($sent_stats['completed_count'] ?? 0) + ($received_stats['completed_count'] ?? 0);
$stats['pending_barters'] = ($sent_stats['pending_count'] ?? 0) + ($received_stats['pending_count'] ?? 0);
$stats['cancelled_barters'] = ($sent_stats['cancelled_count'] ?? 0) + ($received_stats['cancelled_count'] ?? 0);
$stats['rejected_barters'] = ($sent_stats['rejected_count'] ?? 0) + ($received_stats['rejected_count'] ?? 0);

// Reytinq statistikaları
$stmt = $pdo->prepare("
    SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
    FROM user_ratings
    WHERE rated_user_id = ? $range_sql
");
$stmt->execute([$current_user['id']]);
$rating_stats = $stmt->fetch();

$stats['avg_rating'] = $rating_stats['avg_rating'] ?? 0;
$stats['rating_count'] = $rating_stats['rating_count'] ?? 0;

// Favori statistikaları
$stmt = $pdo->prepare("
    SELECT COUNT(*) as count
    FROM favorites
    WHERE user_id = ? $range_sql
");
$stmt->execute([$current_user['id']]);
$stats['favorites_count'] = $stmt->fetchColumn() ?? 0;

// Ən aktiv kateqoriya
$stmt = $pdo->prepare("
    SELECT c.name, c.display_name, COUNT(*) as count
    FROM items i
    JOIN categories c ON i.category_id = c.id
    WHERE i.user_id = ? $range_sql
    GROUP BY i.category_id
    ORDER BY count DESC
    LIMIT 1
");
$stmt->execute([$current_user['id']]);
$most_active = $stmt->fetch();
$stats['most_active_category'] = $most_active ? $most_active['display_name'] : 'Məlumat yoxdur';

// Ən uğurlu kateqoriya (ən çox tamamlanmış barterlər)
$stmt = $pdo->prepare("
    SELECT c.name, c.display_name, COUNT(*) as count
    FROM offers o
    JOIN items i ON (o.offered_item_id = i.id OR o.wanted_item_id = i.id)
    JOIN categories c ON i.category_id = c.id
    WHERE (o.sender_id = ? OR o.recipient_id = ?) 
      AND o.status = 'completed' 
      AND i.user_id = ? $range_sql
    GROUP BY c.id
    ORDER BY count DESC
    LIMIT 1
");
$stmt->execute([$current_user['id'], $current_user['id'], $current_user['id']]);
$most_successful = $stmt->fetch();
$stats['most_successful_category'] = $most_successful ? $most_successful['display_name'] : 'Məlumat yoxdur';

// Ortalama cavab vaxtı (göndərilən təkliflər üçün)
$stmt = $pdo->prepare("
    SELECT AVG(TIMESTAMPDIFF(HOUR, o.created_at, h.created_at)) as avg_hours
    FROM offers o
    JOIN offer_status_history h ON o.id = h.offer_id
    WHERE o.sender_id = ? 
      AND h.status IN ('accepted', 'rejected') 
      AND h.changed_by != o.sender_id $range_sql
");
$stmt->execute([$current_user['id']]);
$avg_response = $stmt->fetchColumn();
$stats['avg_response_time'] = $avg_response ? round($avg_response, 1) : 0;

// Zaman əsasında barter fəaliyyəti
$activity_data = [];
$time_query = '';
$group_by = '';

switch ($time_range) {
    case 'week':
        $time_query = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
        $group_by = "GROUP BY DATE(created_at)";
        $order_by = "ORDER BY DATE(created_at) ASC";
        $date_format = "D"; // Gün
        break;
    case 'month':
        $time_query = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        $group_by = "GROUP BY DATE(created_at)";
        $order_by = "ORDER BY DATE(created_at) ASC";
        $date_format = "j M"; // Gün və ay
        break;
    case 'year':
        $time_query = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        $group_by = "GROUP BY MONTH(created_at), YEAR(created_at)";
        $order_by = "ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC";
        $date_format = "M Y"; // Ay və il
        break;
    default:
        $time_query = "";
        $group_by = "GROUP BY YEAR(created_at)";
        $order_by = "ORDER BY YEAR(created_at) ASC";
        $date_format = "Y"; // İl
}

// Zaman əsasında barter fəaliyyəti - göndərilən təkliflər
$stmt = $pdo->prepare("
    SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
    FROM offers
    WHERE sender_id = ? $time_query
    $group_by
    $order_by
");
$stmt->execute([$current_user['id']]);
$activity_sent = $stmt->fetchAll();

// Zaman əsasında barter fəaliyyəti - alınan təkliflər
$stmt = $pdo->prepare("
    SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
    FROM offers
    WHERE recipient_id = ? $time_query
    $group_by
    $order_by
");
$stmt->execute([$current_user['id']]);
$activity_received = $stmt->fetchAll();

// Qrafik üçün məlumatları hazırla
$activity_dates = [];
$activity_sent_counts = [];
$activity_received_counts = [];

// Tarixlər üçün boş massiv
foreach (array_merge($activity_sent, $activity_received) as $row) {
    $activity_dates[$row['date']] = true;
}
$activity_dates = array_keys($activity_dates);
sort($activity_dates);

// Göndərilən təkliflər üçün məlumatlar
$sent_by_date = [];
foreach ($activity_sent as $row) {
    $sent_by_date[$row['date']] = $row['count'];
}

// Alınan təkliflər üçün məlumatlar
$received_by_date = [];
foreach ($activity_received as $row) {
    $received_by_date[$row['date']] = $row['count'];
}

// Qrafik məlumatlarını hazırla
foreach ($activity_dates as $date) {
    $formatted_date = date($date_format, strtotime($date));
    $activity_data[] = [
        'date' => $formatted_date,
        'sent' => isset($sent_by_date[$date]) ? (int)$sent_by_date[$date] : 0,
        'received' => isset($received_by_date[$date]) ? (int)$received_by_date[$date] : 0
    ];
}

// Kateqoriyalar üzrə barter statistikaları
$stmt = $pdo->prepare("
    SELECT 
        c.name,
        c.display_name,
        COUNT(DISTINCT CASE WHEN o.sender_id = ? OR o.recipient_id = ? THEN o.id END) as total_barters,
        COUNT(DISTINCT CASE WHEN (o.sender_id = ? OR o.recipient_id = ?) AND o.status = 'completed' THEN o.id END) as completed_barters
    FROM categories c
    LEFT JOIN items i ON c.id = i.category_id
    LEFT JOIN offers o ON (i.id = o.offered_item_id OR i.id = o.wanted_item_id)
    WHERE i.user_id = ? $range_sql
    GROUP BY c.id
    ORDER BY completed_barters DESC, total_barters DESC
    LIMIT 10
");
$stmt->execute([$current_user['id'], $current_user['id'], $current_user['id'], $current_user['id'], $current_user['id']]);
$category_stats = $stmt->fetchAll();

// Son tamamlanmış barterlər
$stmt = $pdo->prepare("
    SELECT 
        o.id,
        o.status,
        o.created_at,
        o.updated_at,
        si.title as offered_item_title,
        si.id as offered_item_id,
        ri.title as wanted_item_title,
        ri.id as wanted_item_id,
        (SELECT file_path FROM images WHERE item_id = si.id AND is_main = 1 LIMIT 1) as offered_item_image,
        (SELECT file_path FROM images WHERE item_id = ri.id AND is_main = 1 LIMIT 1) as wanted_item_image,
        su.username as sender_username,
        ru.username as recipient_username,
        su.id as sender_id,
        ru.id as recipient_id
    FROM offers o
    JOIN items si ON o.offered_item_id = si.id
    JOIN items ri ON o.wanted_item_id = ri.id
    JOIN users su ON o.sender_id = su.id
    JOIN users ru ON o.recipient_id = ru.id
    WHERE (o.sender_id = ? OR o.recipient_id = ?) 
      AND o.status = 'completed' $range_sql
    ORDER BY o.updated_at DESC
    LIMIT 5
");
$stmt->execute([$current_user['id'], $current_user['id']]);
$recent_completed = $stmt->fetchAll();

// JavaScript qrafik məlumatları
$chart_data = json_encode($activity_data);

require_once 'includes/header.php';
?>

<main class="flex-1 bg-gray-50 py-6">
    <div class="container mx-auto px-4">
        <!-- Səhifə başlığı -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Barter Statistikaları</h1>
            <p class="text-gray-600">Platformdakı fəaliyyətinizin analizi və statistikaları</p>
        </div>
        
        <!-- Vaxt aralığı filtrləri -->
        <div class="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-gray-700 font-medium">Vaxt aralığı:</span>
                <a href="?range=week" class="px-3 py-1 rounded-lg <?php echo $time_range == 'week' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
                    Son həftə
                </a>
                <a href="?range=month" class="px-3 py-1 rounded-lg <?php echo $time_range == 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
                    Son ay
                </a>
                <a href="?range=year" class="px-3 py-1 rounded-lg <?php echo $time_range == 'year' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
                    Son il
                </a>
                <a href="?range=all" class="px-3 py-1 rounded-lg <?php echo $time_range == 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
                    Bütün zamanlar
                </a>
            </div>
        </div>
        
        <!-- Əsas statistika kartları -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-blue-50">
                    <h2 class="font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-exchange-alt text-blue-500 mr-2"></i>
                        Barter Fəaliyyəti
                    </h2>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600"><?php echo $stats['total_offers_sent']; ?></div>
                            <div class="text-sm text-gray-600">Göndərilən təklif</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600"><?php echo $stats['total_offers_received']; ?></div>
                            <div class="text-sm text-gray-600">Alınan təklif</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600"><?php echo $stats['completed_barters']; ?></div>
                            <div class="text-sm text-gray-600">Tamamlanmış</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600"><?php echo $stats['pending_barters']; ?></div>
                            <div class="text-sm text-gray-600">Gözləyən</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-green-50">
                    <h2 class="font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-boxes text-green-500 mr-2"></i>
                        Elanlar
                    </h2>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600"><?php echo $stats['total_items']; ?></div>
                            <div class="text-sm text-gray-600">Cəmi elan</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600"><?php echo $stats['active_items']; ?></div>
                            <div class="text-sm text-gray-600">Aktiv elan</div>
                        </div>
                        <div class="text-center col-span-2">
                            <div class="text-lg font-bold text-gray-700"><?php echo $stats['most_active_category']; ?></div>
                            <div class="text-sm text-gray-600">Ən aktiv kateqoriya</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-yellow-50">
                    <h2 class="font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-star text-yellow-500 mr-2"></i>
                        Reytinq və Rəylər
                    </h2>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600"><?php echo number_format($stats['avg_rating'], 1); ?></div>
                            <div class="text-sm text-gray-600">Ortalama reytinq</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600"><?php echo $stats['rating_count']; ?></div>
                            <div class="text-sm text-gray-600">Cəmi rəy</div>
                        </div>
                        <div class="text-center col-span-2">
                            <!-- Ulduzlar -->
                            <div class="flex justify-center mb-1">
                                <?php
                                $rating = $stats['avg_rating'];
                                $fullStars = floor($rating);
                                $halfStar = $rating - $fullStars >= 0.5 ? 1 : 0;
                                $emptyStars = 5 - $fullStars - $halfStar;
                                
                                for ($i = 0; $i < $fullStars; $i++) {
                                    echo '<i class="fas fa-star text-yellow-400 mx-0.5"></i>';
                                }
                                
                                if ($halfStar) {
                                    echo '<i class="fas fa-star-half-alt text-yellow-400 mx-0.5"></i>';
                                }
                                
                                for ($i = 0; $i < $emptyStars; $i++) {
                                    echo '<i class="far fa-star text-yellow-400 mx-0.5"></i>';
                                }
                                ?>
                            </div>
                            <div class="text-sm text-gray-600">İstifadəçi reytinqi</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-purple-50">
                    <h2 class="font-semibold text-gray-900 flex items-center">
                        <i class="fas fa-chart-line text-purple-500 mr-2"></i>
                        Digər Statistikalar
                    </h2>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600"><?php echo $stats['favorites_count']; ?></div>
                            <div class="text-sm text-gray-600">Favorilər</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600"><?php echo $stats['avg_response_time']; ?> saat</div>
                            <div class="text-sm text-gray-600">Orta cavab vaxtı</div>
                        </div>
                        <div class="text-center col-span-2">
                            <div class="text-lg font-bold text-gray-700"><?php echo $stats['most_successful_category']; ?></div>
                            <div class="text-sm text-gray-600">Ən uğurlu kateqoriya</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Barter fəaliyyəti qrafiki -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div class="p-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Barter Fəaliyyəti Qrafiki (<?php echo $range_title; ?>)</h2>
            </div>
            <div class="p-4">
                <div id="activity-chart" style="height: 300px;"></div>
            </div>
        </div>
        
        <!-- Kateqoriyalara görə barter statistikaları -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="font-semibold text-gray-900">Kateqoriyalara görə Barter Statistikaları</h2>
                </div>
                <div class="p-4">
                    <?php if (empty($category_stats)): ?>
                        <div class="text-center py-6 text-gray-500">
                            <i class="fas fa-chart-bar text-gray-300 text-3xl mb-2"></i>
                            <p>Bu zaman çərçivəsində kateqoriya statistikaları mövcud deyil.</p>
                        </div>
                    <?php else: ?>
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead>
                                    <tr class="bg-gray-50">
                                        <th class="py-2 px-3 text-left text-sm font-medium text-gray-700">Kateqoriya</th>
                                        <th class="py-2 px-3 text-center text-sm font-medium text-gray-700">Cəmi barterlər</th>
                                        <th class="py-2 px-3 text-center text-sm font-medium text-gray-700">Tamamlanmış</th>
                                        <th class="py-2 px-3 text-center text-sm font-medium text-gray-700">Uğur dərəcəsi</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <?php foreach ($category_stats as $cat): ?>
                                        <tr class="hover:bg-gray-50">
                                            <td class="py-2 px-3 text-sm text-gray-700">
                                                <?php echo htmlspecialchars($cat['display_name']); ?>
                                            </td>
                                            <td class="py-2 px-3 text-center text-sm text-gray-700">
                                                <?php echo $cat['total_barters']; ?>
                                            </td>
                                            <td class="py-2 px-3 text-center text-sm text-gray-700">
                                                <?php echo $cat['completed_barters']; ?>
                                            </td>
                                            <td class="py-2 px-3 text-center text-sm">
                                                <?php 
                                                $success_rate = $cat['total_barters'] > 0 ? ($cat['completed_barters'] / $cat['total_barters'] * 100) : 0;
                                                $success_color = 'bg-gray-200';
                                                
                                                if ($success_rate >= 75) {
                                                    $success_color = 'bg-green-500';
                                                } elseif ($success_rate >= 50) {
                                                    $success_color = 'bg-blue-500';
                                                } elseif ($success_rate >= 25) {
                                                    $success_color = 'bg-yellow-500';
                                                } else {
                                                    $success_color = 'bg-red-500';
                                                }
                                                ?>
                                                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div class="h-full <?php echo $success_color; ?>" style="width: <?php echo $success_rate; ?>%"></div>
                                                </div>
                                                <span class="text-xs text-gray-600 mt-1 inline-block">
                                                    <?php echo round($success_rate); ?>%
                                                </span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Son tamamlanmış barterlər -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="font-semibold text-gray-900">Son Tamamlanmış Barterlər</h2>
                </div>
                <div class="p-4">
                    <?php if (empty($recent_completed)): ?>
                        <div class="text-center py-6 text-gray-500">
                            <i class="fas fa-exchange-alt text-gray-300 text-3xl mb-2"></i>
                            <p>Bu zaman çərçivəsində tamamlanmış barterlər mövcud deyil.</p>
                        </div>
                    <?php else: ?>
                        <div class="space-y-4">
                            <?php foreach ($recent_completed as $barter): ?>
                                <?php 
                                $is_sender = $barter['sender_id'] == $current_user['id'];
                                $other_username = $is_sender ? $barter['recipient_username'] : $barter['sender_username'];
                                $other_id = $is_sender ? $barter['recipient_id'] : $barter['sender_id'];
                                $own_item = $is_sender ? $barter['offered_item_title'] : $barter['wanted_item_title'];
                                $other_item = $is_sender ? $barter['wanted_item_title'] : $barter['offered_item_title'];
                                $own_item_id = $is_sender ? $barter['offered_item_id'] : $barter['wanted_item_id'];
                                $other_item_id = $is_sender ? $barter['wanted_item_id'] : $barter['offered_item_id'];
                                $own_image = $is_sender ? $barter['offered_item_image'] : $barter['wanted_item_image'];
                                $other_image = $is_sender ? $barter['wanted_item_image'] : $barter['offered_item_image'];
                                ?>
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <div class="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                        <div class="flex items-center">
                                            <i class="fas fa-exchange-alt text-green-500 mr-2"></i>
                                            <span class="font-medium text-gray-700">Barter #<?php echo $barter['id']; ?></span>
                                        </div>
                                        <a href="barter-summary.php?id=<?php echo $barter['id']; ?>" class="text-primary hover:underline text-sm">
                                            Ətraflı
                                        </a>
                                    </div>
                                    
                                    <div class="p-3">
                                        <div class="flex flex-col sm:flex-row items-center">
                                            <!-- Öz əşyanız -->
                                            <div class="flex-1 flex items-center mb-3 sm:mb-0">
                                                <div class="flex-shrink-0 mr-3">
                                                    <div class="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                                        <?php if (!empty($own_image)): ?>
                                                            <img src="<?php echo htmlspecialchars($own_image); ?>" alt="<?php echo htmlspecialchars($own_item); ?>" class="w-full h-full object-cover">
                                                        <?php else: ?>
                                                            <div class="w-full h-full flex items-center justify-center">
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="text-xs text-gray-500">Sizin əşyanız:</div>
                                                    <div class="font-medium text-gray-800 text-sm">
                                                        <?php echo htmlspecialchars($own_item); ?>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- İkon -->
                                            <div class="flex-shrink-0 mx-2 mb-3 sm:mb-0">
                                                <i class="fas fa-exchange-alt text-gray-400"></i>
                                            </div>
                                            
                                            <!-- Qarşı tərəfin əşyası -->
                                            <div class="flex-1 flex items-center">
                                                <div class="flex-shrink-0 mr-3">
                                                    <div class="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                                        <?php if (!empty($other_image)): ?>
                                                            <img src="<?php echo htmlspecialchars($other_image); ?>" alt="<?php echo htmlspecialchars($other_item); ?>" class="w-full h-full object-cover">
                                                        <?php else: ?>
                                                            <div class="w-full h-full flex items-center justify-center">
                                                                <i class="fas fa-box text-gray-400"></i>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="text-xs text-gray-500">
                                                        <a href="profile.php?id=<?php echo $other_id; ?>" class="hover:underline">
                                                            <?php echo htmlspecialchars($other_username); ?>
                                                        </a>
                                                    </div>
                                                    <div class="font-medium text-gray-800 text-sm">
                                                        <?php echo htmlspecialchars($other_item); ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="mt-2 text-xs text-gray-500 text-right">
                                            <i class="far fa-calendar-check mr-1"></i> <?php echo date('d.m.Y', strtotime($barter['updated_at'])); ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <!-- PDF ixrac (əgər istifadəçinin tamamlanmış barter əməliyyatları varsa) -->
        <?php if ($stats['completed_barters'] > 0): ?>
            <div class="flex justify-center my-6">
                <a href="export-statistics.php?format=pdf&range=<?php echo $time_range; ?>" target="_blank" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center">
                    <i class="fas fa-file-pdf mr-2"></i> PDF kimi ixrac et
                </a>
                <a href="export-statistics.php?format=csv&range=<?php echo $time_range; ?>" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center ml-3">
                    <i class="fas fa-file-csv mr-2"></i> CSV kimi ixrac et
                </a>
            </div>
        <?php endif; ?>
    </div>
</main>

<!-- ApexCharts kitabxanasını əlavə et -->
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

<!-- Qrafik JavaScript kodu -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const chartData = <?php echo $chart_data; ?>;
    
    if (!chartData || chartData.length === 0) {
        document.getElementById('activity-chart').innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                <i class="fas fa-chart-line text-gray-300 text-5xl mb-3"></i>
                <p class="text-gray-500">Bu zaman çərçivəsində məlumat mövcud deyil.</p>
            </div>
        `;
        return;
    }
    
    const categories = chartData.map(item => item.date);
    const sentData = chartData.map(item => item.sent);
    const receivedData = chartData.map(item => item.received);
    
    const options = {
        series: [{
            name: 'Göndərilən',
            data: sentData
        }, {
            name: 'Alınan',
            data: receivedData
        }],
        chart: {
            type: 'bar',
            height: 300,
            stacked: false,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 2
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: categories
        },
        yaxis: {
            title: {
                text: 'Barterlər'
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " barter"
                }
            }
        },
        colors: ['#3B82F6', '#10B981'],
        legend: {
            position: 'top'
        }
    };

    const chart = new ApexCharts(document.getElementById("activity-chart"), options);
    chart.render();
});
</script>

<?php
require_once 'includes/footer.php';
?>