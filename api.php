<?php
// api.php
// ブラウザにJSONデータであることを伝えるヘッダー
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// HTTPメソッドの検証（GETのみ許可）
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// 設定ファイルの読み込み
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => '設定ファイルが見つかりません']);
    exit;
}

$config = require $configFile;
$service_id = $config['microcms']['service_id'] ?? '';
$api_key = $config['microcms']['api_key'] ?? '';

if (empty($service_id) || empty($api_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'microCMSの設定が不完全です']);
    exit;
}

// URLパラメータから記事IDを取得し、厳格にバリデーション（個別記事ページからの要求用）
$article_id_path = '';
if (isset($_GET['id']) && $_GET['id'] !== '') {
    $raw_id = trim((string)$_GET['id']);
    // microCMSのコンテンツID形式（英数字、ハイフン、アンダースコアの1〜64文字）を検証
    if (!preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $raw_id)) {
        http_response_code(400);
        echo json_encode(['error' => '無効な記事ID形式です']);
        exit;
    }
    $article_id_path = '/' . $raw_id;
}

// microCMSのAPIエンドポイントURLを構築
$url = "https://{$service_id}.microcms.io/api/v1/blogs{$article_id_path}";

// cURLを使用して安全にmicroCMSへ通信を行う
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-MICROCMS-API-KEY: {$api_key}"]);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// エラーハンドリング
if ($response === false || $httpcode !== 200) {
    $statusCode = ($httpcode >= 400 && $httpcode < 600) ? $httpcode : 502;
    http_response_code($statusCode);
    echo json_encode(['error' => 'データの取得に失敗しました']);
    exit;
}

// microCMSから取得したデータをそのままブラウザ（JavaScript）へ出力
echo $response;
?>