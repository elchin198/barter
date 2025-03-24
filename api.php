<?php
/**
 * BarterTap.az API Adapter for Hostinger
 * 
 * Bu fayl Hostinger mühitində API istəklərini emal etmək üçündür.
 * Node.js/Express əvəzinə PHP istifadə edilir.
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Preflight OPTIONS sorğusunu emal et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verilənlər bazası bağlantısı
function connectDB() {
    $host = getenv('MYSQL_HOST') ?: 'localhost';
    $user = getenv('MYSQL_USER') ?: 'u726371272_barter_user';
    $pass = getenv('MYSQL_PASSWORD') ?: 'your_database_password';
    $db = getenv('MYSQL_DATABASE') ?: 'u726371272_barter_db';
    
    $conn = new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        returnError('Database connection failed: ' . $conn->connect_error, 500);
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// JSON ilə cavab qaytarmaq
function returnJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Səhv mesajı
function returnError($message, $statusCode = 400) {
    returnJSON(['error' => $message], $statusCode);
}

// Sorğu yolunu parçala
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';

// API sorğusu olub-olmadığını yoxla
if (strpos($request_uri, $base_path) !== 0) {
    returnError('Invalid API path', 404);
}

// API yolunu çıxart
$api_path = substr($request_uri, strlen($base_path));
$path_parts = explode('/', trim($api_path, '/'));
$resource = $path_parts[0] ?? '';

// Sorğu verilənlərini al
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$query = $_GET;

// Sessiya işləmə
session_start();
$user_id = $_SESSION['user_id'] ?? null;

// API marşrutları
switch ($resource) {
    case 'health':
        returnJSON([
            'status' => 'ok',
            'environment' => 'hostinger',
            'time' => date('Y-m-d H:i:s')
        ]);
        break;

    case 'auth':
        handleAuth($path_parts, $method, $input);
        break;
        
    case 'items':
        handleItems($path_parts, $method, $input, $query);
        break;
        
    case 'users':
        handleUsers($path_parts, $method, $input);
        break;
        
    case 'conversations':
        handleConversations($path_parts, $method, $input);
        break;
        
    case 'messages':
        handleMessages($path_parts, $method, $input);
        break;
        
    case 'offers':
        handleOffers($path_parts, $method, $input);
        break;
        
    case 'notifications':
        handleNotifications($path_parts, $method, $input);
        break;
        
    case 'favorites':
        handleFavorites($path_parts, $method, $input);
        break;
        
    case 'reviews':
        handleReviews($path_parts, $method, $input);
        break;
        
    default:
        returnError('Unknown API endpoint: ' . $resource, 404);
}

// Auth API
function handleAuth($path_parts, $method, $input) {
    $action = $path_parts[1] ?? '';
    
    switch ($action) {
        case 'login':
            if ($method !== 'POST') {
                returnError('Method not allowed', 405);
            }
            
            if (!isset($input['username']) || !isset($input['password'])) {
                returnError('Username and password are required', 400);
            }
            
            $conn = connectDB();
            $stmt = $conn->prepare("SELECT id, username, password, role, email, fullName FROM users WHERE username = ?");
            $stmt->bind_param("s", $input['username']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                returnError('Invalid username or password', 401);
            }
            
            $user = $result->fetch_assoc();
            
            // Şifrəni yoxla
            if (!password_verify($input['password'], $user['password'])) {
                returnError('Invalid username or password', 401);
            }
            
            // Sessiyada saxla
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            
            // Həssas məlumatları silmək
            unset($user['password']);
            
            returnJSON($user);
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                returnError('Method not allowed', 405);
            }
            
            // Sessiyanı təmizlə
            session_destroy();
            returnJSON(['success' => true]);
            break;
            
        case 'me':
            if ($method !== 'GET') {
                returnError('Method not allowed', 405);
            }
            
            // Authenticate
            if (!isset($_SESSION['user_id'])) {
                returnError('Unauthorized', 401);
            }
            
            $conn = connectDB();
            $stmt = $conn->prepare("SELECT id, username, role, email, fullName, phoneNumber, location, avatar, createdAt FROM users WHERE id = ?");
            $stmt->bind_param("i", $_SESSION['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                // User not found in db, clear session
                session_destroy();
                returnError('Unauthorized', 401);
            }
            
            $user = $result->fetch_assoc();
            returnJSON($user);
            break;
            
        case 'register':
            if ($method !== 'POST') {
                returnError('Method not allowed', 405);
            }
            
            if (!isset($input['username']) || !isset($input['password']) || !isset($input['email'])) {
                returnError('Username, password and email are required', 400);
            }
            
            $conn = connectDB();
            
            // İstifadəçi adının mövcud olub-olmadığını yoxla
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->bind_param("s", $input['username']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                returnError('Username already exists', 400);
            }
            
            // E-poçtun mövcud olub-olmadığını yoxla
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->bind_param("s", $input['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                returnError('Email already exists', 400);
            }
            
            // Şifrəni hash et
            $hashed_password = password_hash($input['password'], PASSWORD_DEFAULT);
            
            // İstifadəçini yarat
            $stmt = $conn->prepare("INSERT INTO users (username, password, email, fullName, phoneNumber, role, createdAt) VALUES (?, ?, ?, ?, ?, 'user', NOW())");
            $fullName = $input['fullName'] ?? '';
            $phoneNumber = $input['phoneNumber'] ?? '';
            $stmt->bind_param("sssss", $input['username'], $hashed_password, $input['email'], $fullName, $phoneNumber);
            
            if (!$stmt->execute()) {
                returnError('Failed to create user: ' . $conn->error, 500);
            }
            
            $user_id = $conn->insert_id;
            
            // İstifadəçini al
            $stmt = $conn->prepare("SELECT id, username, role, email, fullName, phoneNumber, createdAt FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            // Sessiyada saxla
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            
            returnJSON($user, 201);
            break;
            
        default:
            returnError('Unknown auth endpoint: ' . $action, 404);
    }
}

// Items API
function handleItems($path_parts, $method, $input, $query) {
    $item_id = isset($path_parts[1]) && is_numeric($path_parts[1]) ? intval($path_parts[1]) : null;
    
    // GET /api/items or GET /api/items?category=X&search=Y
    if ($method === 'GET' && $item_id === null) {
        $conn = connectDB();
        
        // SQL sorğusunu qur
        $sql = "SELECT i.*, CONCAT(u.username) as owner_username, 
                (SELECT filePath FROM images WHERE itemId = i.id AND isMain = 1 LIMIT 1) as mainImage
                FROM items i
                JOIN users u ON i.ownerId = u.id
                WHERE 1=1";
        $params = [];
        $types = "";
        
        // Kateqoriya filtri
        if (isset($query['category']) && $query['category']) {
            $sql .= " AND i.category = ?";
            $params[] = $query['category'];
            $types .= "s";
        }
        
        // Axtarış filtri
        if (isset($query['search']) && $query['search']) {
            $search = "%" . $query['search'] . "%";
            $sql .= " AND (i.title LIKE ? OR i.description LIKE ?)";
            $params[] = $search;
            $params[] = $search;
            $types .= "ss";
        }
        
        // Status filtri
        if (isset($query['status']) && $query['status']) {
            $sql .= " AND i.status = ?";
            $params[] = $query['status'];
            $types .= "s";
        }
        
        // Şəhər filtri
        if (isset($query['city']) && $query['city']) {
            $sql .= " AND i.city = ?";
            $params[] = $query['city'];
            $types .= "s";
        }
        
        // Vəziyyət filtri
        if (isset($query['condition']) && $query['condition']) {
            $sql .= " AND i.condition = ?";
            $params[] = $query['condition'];
            $types .= "s";
        }
        
        // Sıralama
        if (isset($query['sort'])) {
            switch ($query['sort']) {
                case 'newest':
                    $sql .= " ORDER BY i.createdAt DESC";
                    break;
                case 'oldest':
                    $sql .= " ORDER BY i.createdAt ASC";
                    break;
                case 'title_asc':
                    $sql .= " ORDER BY i.title ASC";
                    break;
                case 'title_desc':
                    $sql .= " ORDER BY i.title DESC";
                    break;
                default:
                    $sql .= " ORDER BY i.createdAt DESC";
            }
        } else {
            $sql .= " ORDER BY i.createdAt DESC";
        }
        
        // Limit və ofset
        $limit = isset($query['limit']) ? intval($query['limit']) : 20;
        $offset = isset($query['offset']) ? intval($query['offset']) : 0;
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        // Sorğunu icra et
        $stmt = $conn->prepare($sql);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        returnJSON($items);
    }
    
    // GET /api/items/:id
    else if ($method === 'GET' && $item_id !== null) {
        $conn = connectDB();
        
        // Əsas məlumatları al
        $stmt = $conn->prepare("
            SELECT i.*, u.id as owner_id, u.username as owner_username, u.fullName as owner_fullName, u.avatar as owner_avatar
            FROM items i
            JOIN users u ON i.ownerId = u.id
            WHERE i.id = ?
        ");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            returnError('Item not found', 404);
        }
        
        $item = $result->fetch_assoc();
        
        // Şəkilləri al
        $stmt = $conn->prepare("SELECT id, filePath, isMain FROM images WHERE itemId = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $images = [];
        
        while ($row = $result->fetch_assoc()) {
            $images[] = $row;
        }
        
        $item['images'] = $images;
        
        // İstifadəçi seçilmişlərini yoxla
        if (isset($_SESSION['user_id'])) {
            $stmt = $conn->prepare("SELECT 1 FROM favorites WHERE userId = ? AND itemId = ?");
            $stmt->bind_param("ii", $_SESSION['user_id'], $item_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $item['isFavorite'] = $result->num_rows > 0;
        }
        
        returnJSON($item);
    }
    
    // POST /api/items
    else if ($method === 'POST' && $item_id === null) {
        // İstifadəçi autentifikasiya olunub-olunmadığını yoxla
        if (!isset($_SESSION['user_id'])) {
            returnError('Unauthorized', 401);
        }
        
        // Lazımi sahələri yoxla
        if (!isset($input['title']) || !isset($input['description']) || !isset($input['category'])) {
            returnError('Title, description, and category are required', 400);
        }
        
        $conn = connectDB();
        
        // Elementı daxil et
        $stmt = $conn->prepare("
            INSERT INTO items (
                title, description, category, condition, value, city, coordinates, status, ownerId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $condition = $input['condition'] ?? 'used';
        $value = $input['value'] ?? 0;
        $city = $input['city'] ?? '';
        $coordinates = $input['coordinates'] ?? null;
        $status = 'active';
        
        $stmt->bind_param(
            "ssssdsssi",
            $input['title'], $input['description'], $input['category'],
            $condition, $value, $city, $coordinates, $status, $_SESSION['user_id']
        );
        
        if (!$stmt->execute()) {
            returnError('Failed to create item: ' . $conn->error, 500);
        }
        
        $item_id = $conn->insert_id;
        
        // Yaradılmış elementı al
        $stmt = $conn->prepare("SELECT * FROM items WHERE id = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $item = $result->fetch_assoc();
        
        returnJSON($item, 201);
    }
    
    // Digər marşrutlar...
    else {
        returnError('Method not allowed or invalid resource', 405);
    }
}

// Other API handlers would be defined similarly
function handleUsers($path_parts, $method, $input) {
    // Authentication check for user operations
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for user operations
    returnError('Not implemented yet', 501);
}

function handleConversations($path_parts, $method, $input) {
    // Authentication check for conversations
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for conversations
    returnError('Not implemented yet', 501);
}

function handleMessages($path_parts, $method, $input) {
    // Authentication check for messages
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for messages
    returnError('Not implemented yet', 501);
}

function handleOffers($path_parts, $method, $input) {
    // Authentication check for offers
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for offers
    returnError('Not implemented yet', 501);
}

function handleNotifications($path_parts, $method, $input) {
    // Authentication check for notifications
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for notifications
    returnError('Not implemented yet', 501);
}

function handleFavorites($path_parts, $method, $input) {
    // Authentication check for favorites
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for favorites
    returnError('Not implemented yet', 501);
}

function handleReviews($path_parts, $method, $input) {
    // Authentication check for reviews
    if (!isset($_SESSION['user_id'])) {
        returnError('Unauthorized', 401);
    }
    
    // Implementation details for reviews
    returnError('Not implemented yet', 501);
}
?>