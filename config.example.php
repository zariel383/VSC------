<?php
// config.example.php - アプリケーション設定テンプレート
// 
// 【使用方法】
// 1. このファイルをコピーして「config.php」という名前に変更します。
// 2. 下記の各 API キー項目に、再発行した本物のキーを入力してください。
// 3. 本物のキーが入った config.php は .gitignore により GitHub にコミットされません。

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit('Access denied.');
}

return [
    'microcms' => [
        // microCMS のサービスID（サブドメイン）
        'service_id' => 'ql07xyqewm',
        // microCMS の API キー（GET 権限のあるキー）
        'api_key'    => 'YOUR_MICROCMS_API_KEY_HERE',
    ],
    'gemini' => [
        // Google Gemini API キー
        'api_key'    => 'YOUR_GEMINI_API_KEY_HERE',
    ],
];
