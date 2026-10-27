<?php
// counter.php - 訪問カウンターAPI
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// HTTPメソッドの検証（GETのみ許可）
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// カウント数を保存するファイルのパス（外部直接アクセスは.htaccessで禁止）
$countFile = __DIR__ . '/count.txt';

// ファイルが存在しない場合は初期値「0」で作成する
if (!file_exists($countFile)) {
    file_put_contents($countFile, '0', LOCK_EX);
}

$count = 0;

// ファイルを読み書きモード（c+）で開く
$fp = fopen($countFile, 'c+');

if ($fp) {
    // 排他ロック（LOCK_EX）を取得
    if (flock($fp, LOCK_EX)) {
        // ファイル内容をすべて読み出す
        $content = stream_get_contents($fp);
        $count = (int) trim((string)$content);
        
        // カウントをインクリメント
        $count++;
        
        // ファイルの先頭に戻り、新しいカウント値で上書きする
        rewind($fp);
        fwrite($fp, (string)$count);
        ftruncate($fp, ftell($fp)); // 古いデータを切り詰める
        fflush($fp);
        
        // ロック解除
        flock($fp, LOCK_UN);
    } else {
        // ロック取得に失敗した場合は現在値を読み取りのみ行う
        $content = @file_get_contents($countFile);
        $count = (int) trim((string)$content);
    }
    fclose($fp);
} else {
    $content = @file_get_contents($countFile);
    $count = (int) trim((string)$content);
}

// JSON形式でレスポンス
echo json_encode(['count' => $count]);
?>
