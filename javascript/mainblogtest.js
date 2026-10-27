const endpoint = '/api.php';

async function fetchAndRenderBlogs() {
  const container = document.getElementById('blog-list');

  try {
    // 修正: apiKeyの送信ヘッダー設定を削除し、シンプルにリクエスト
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // レスポンスデータをJSON形式に変換
    const data = await response.json();

    console.log(data);
    
    // 取得成功時、コンテナ内の「読み込み中...」のテキストを消去
    container.innerHTML = '';
    
    // 記事データ（配列）が空の場合の処理
    if (data.contents.length === 0) {
      container.innerHTML = '<p>まだ記事がありません。</p>';
      return;
    }

    // 取得した記事データをもとにHTML要素を生成して追加
    data.contents.forEach(post => {
      // 日付のフォーマット処理（例: 2026-02-22T00:00:00.000Z -> 2026年02月22日）
      const date = new Date(post.publishedAt);
      const formattedDate = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;

      // 新しいarticle要素を作成
      const article = document.createElement('article');
      article.className = 'blog-card';
      
      // スタイルを直接適用（CSSファイルで .blog-card に記述する方が一般的ですが、JSのみで行う場合はこちら）
      article.style.borderBottom = '1px solid #c7b460';
      article.style.margin = '20px';

      // サムネイル画像の取得（eyecatch または thumbnail フィールドを想定）
      const thumbnailUrl = post.eyecatch ? post.eyecatch.url : (post.thumbnail ? post.thumbnail.url : null);
      const thumbnailImg = thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${post.title}" class="post-thumbnail" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px; max-height: 200px; object-fit: cover;">` : '';

      // 記事のHTML構造をテンプレートリテラルで定義
      article.innerHTML = `
        
        <time class="post-date" datetime="${post.publishedAt}">${formattedDate}</time>
        ${thumbnailImg}
        <h3 class="post-title">${post.title}</h3>
        <a href="article.html?id=${post.id}" class="read-more">記事を読む</a>
      `;

      // 構築したarticle要素を画面のコンテナに追加
      container.appendChild(article);
    });

  } catch (error) {
    // エラー発生時のUX配慮
    console.error('APIの取得に失敗しました:', error);
    container.innerHTML = '<p class="error-message">記事の読み込みに失敗しました。時間をおいて再度お試しください。</p>';
  }
}

// ページ読み込み時に関数を実行
fetchAndRenderBlogs();