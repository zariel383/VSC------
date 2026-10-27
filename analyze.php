<?php
// analyze.php - ロシア語構文解析APIプロキシ（Gemini API連携）

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// HTTPメソッドの検証（POSTのみ許可）
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed. POST is required."]);
    exit;
}

// 設定ファイルの読み込み
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(["error" => "Configuration file not found."]);
    exit;
}

$config = require $configFile;
$apiKey = $config['gemini']['api_key'] ?? '';

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(["error" => "Gemini API key is not configured."]);
    exit;
}

// リクエストボディの取得とサイズ制限（最大32KB）
$rawInput = file_get_contents('php://input');
if ($rawInput === false || strlen($rawInput) > 32768) {
    http_response_code(400);
    echo json_encode(["error" => "Request payload too large or invalid."]);
    exit;
}

// フロントエンドからのJSONデータを受け取る
$input = json_decode($rawInput, true);
if (!is_array($input) || !isset($input['sentence']) || !is_string($input['sentence'])) {
    http_response_code(400);
    echo json_encode(["error" => "Sentence must be a valid string."]);
    exit;
}

$sentence = trim($input['sentence']);
if ($sentence === '') {
    http_response_code(400);
    echo json_encode(["error" => "Sentence is empty."]);
    exit;
}

// 文字数制限（最大500文字）
if (mb_strlen($sentence, 'UTF-8') > 500) {
    http_response_code(400);
    echo json_encode(["error" => "Sentence is too long (maximum 500 characters)."]);
    exit;
}

// ==========================================
// キャッシュ機構（同一文の再分析を高速化・7日間保持）
// ==========================================
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
    @file_put_contents($cacheDir . '/.htaccess', "Deny from all\n");
}
$cacheKey = md5(mb_strtolower($sentence, 'UTF-8'));
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400 * 7)) {
    $cachedData = file_get_contents($cacheFile);
    if ($cachedData !== false && $cachedData !== '') {
        http_response_code(200);
        echo $cachedData;
        exit;
    }
}

// プロンプト組み立て（JSONエンコード形式で安全に文を埋め込み）
$safeSentence = json_encode($sentence, JSON_UNESCAPED_UNICODE);

$prompt = "ロシア語の文を形態素・文法解析し、単語ごとの配列としてJSONで出力してください。
文: {$safeSentence}
各単語について品詞(pos)、基本形(base)、性(gender)、格(case)、アスペクト(aspect)、時制(tense)、人称・数(person)、格変化や活用(case_change)、簡単な日本語訳と文法注釈(note)、発音記号IPA(phonetic)、修飾や主述などの関係先単語の0始まりインデックス(target_index)と関係説明(type)を含めてください。該当しない値はnullにしてください。値はすべて日本語で記述してください。";

// Structured Outputs（JSONスキーマによる厳格な出力保証）
$schema = [
    "type" => "ARRAY",
    "items" => [
        "type" => "OBJECT",
        "properties" => [
            "word" => ["type" => "STRING"],
            "phonetic" => ["type" => "STRING", "nullable" => true],
            "analysis" => [
                "type" => "OBJECT",
                "properties" => [
                    "pos" => ["type" => "STRING", "nullable" => true],
                    "base" => ["type" => "STRING", "nullable" => true],
                    "gender" => ["type" => "STRING", "nullable" => true],
                    "case" => ["type" => "STRING", "nullable" => true],
                    "aspect" => ["type" => "STRING", "nullable" => true],
                    "tense" => ["type" => "STRING", "nullable" => true],
                    "person" => ["type" => "STRING", "nullable" => true],
                    "case_change" => ["type" => "STRING", "nullable" => true],
                    "note" => ["type" => "STRING", "nullable" => true]
                ],
                "required" => ["pos", "base", "note"]
            ],
            "relation" => [
                "type" => "OBJECT",
                "nullable" => true,
                "properties" => [
                    "target_index" => ["type" => "INTEGER", "nullable" => true],
                    "type" => ["type" => "STRING", "nullable" => true]
                ]
            ]
        ],
        "required" => ["word", "phonetic", "analysis", "relation"]
    ]
];

$payload = [
    "contents" => [ ["parts" => [ ["text" => $prompt] ]] ],
    "generationConfig" => [
        "temperature" => 0.1,
        "responseMimeType" => "application/json",
        "responseSchema" => $schema
    ]
];

// 高速かつ高精度な最新モデル gemini-3.1-flash-lite を指定
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" . urlencode($apiKey);

// cURLを使用してGemini APIにリクエストを送信
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(["error" => "Failed to communicate with Gemini API: " . $curlError]);
    exit;
}

// 正常応答時はキャッシュに保存
if ($httpCode === 200) {
    @file_put_contents($cacheFile, $response);
}

// APIからのレスポンスをフロントエンドに返す
http_response_code($httpCode);
echo $response;
?>