// 修正後: 自サーバーのPHPファイルを指定
const endpoint = '/api.php';

// URLパラメータからIDを取得
const urlParams = new URLSearchParams(window.location.search);
const currentArticleId = urlParams.get('id');

// メイン記事のレンダリング
async function fetchAndRenderArticle() {
  const contentEl = document.getElementById('post-content');

  // IDが存在しない場合のエラー処理
  if (!currentArticleId) {
    contentEl.innerHTML = '<p class="text-center text-slate-500 mt-20">左側のリストから記事を選択してください。</p>';
    return;
  }

  try {
    // 修正: api.phpに対して、取得した記事IDをパラメーターとして渡す
    const response = await fetch(`${endpoint}?id=${currentArticleId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const post = await response.json();
    
    // 日付のフォーマット処理
    const date = new Date(post.publishedAt);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    // カテゴリ (存在しなければ 'Blog')
    const categoryName = (post.category && post.category.name) ? post.category.name : 'Blog';

    // アイキャッチ画像の取得（eyecatch または thumbnail フィールドを想定）
    const eyecatchUrl = post.eyecatch ? post.eyecatch.url : (post.thumbnail ? post.thumbnail.url : null);
    const eyecatchImg = eyecatchUrl ? `<img src="${eyecatchUrl}" alt="${post.title}" class="w-full h-auto object-cover rounded-[2rem] shadow-sm mb-10 md:mb-16">` : '';

    // 取得したデータでHTMLを生成し、コンテナを上書き
    contentEl.innerHTML = `
        <div class="mb-10 md:mb-16 text-center">
            <span class="inline-block px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold tracking-widest uppercase mb-6">${categoryName}</span>
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">${post.title}</h1>
            <div class="flex items-center justify-center text-slate-500 text-sm font-medium">
                <svg class="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                ${formattedDate}
            </div>
        </div>
        ${eyecatchImg}
        <div class="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-700 leading-relaxed font-medium">
            ${post.content}
        </div>
    `;

    // ページのタイトルを記事のタイトルに変更（SEOおよびUXの向上）
    document.title = `${post.title} - マイウェブサイト`;

  } catch (error) {
    console.error('API Error:', error);
    contentEl.innerHTML = '<p class="text-center text-red-500 mt-20">記事の読み込みに失敗しました。</p>';
  }
}

// サイドバーリストのレンダリング
async function fetchAndRenderSideList() {
  const listEl = document.getElementById('post-list');
  
  try {
      // 一覧取得
      const response = await fetch(endpoint); 
      const data = await response.json();
      const posts = data.contents; // microCMSのリストレスポンス

      if (!posts) return;

      listEl.innerHTML = '';

      posts.forEach(post => {
          const isActive = post.id === currentArticleId;
          const date = new Date(post.publishedAt);
          const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
          
          // リンク要素を作成
          const link = document.createElement('a');
          link.href = `article.html?id=${post.id}`;
          
          // スタイルクラス
          const baseClasses = "block text-left p-5 rounded-2xl transition-all duration-300 flex-shrink-0 w-[260px] md:w-auto relative group border no-underline";
          const activeClasses = "bg-slate-900 text-white shadow-xl shadow-slate-900/10 border-slate-900 transform scale-[1.02] md:scale-100 md:-translate-y-1";
          const inactiveClasses = "bg-transparent hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-700";
          
          link.className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

          // サムネイル画像の取得
          const thumbnailUrl = post.eyecatch ? post.eyecatch.url : (post.thumbnail ? post.thumbnail.url : null);
          const thumbnailImg = thumbnailUrl ? `<div class="mb-4 rounded-xl overflow-hidden h-32 w-full"><img src="${thumbnailUrl}" alt="${post.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"></div>` : '';

          link.innerHTML = `
              <div class="text-xs mb-3 font-semibold tracking-wider uppercase ${isActive ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-500'}">${formattedDate}</div>
              ${thumbnailImg}
              <h3 class="font-extrabold text-lg leading-snug mb-2 ${isActive ? 'text-white' : 'text-slate-900'}">${post.title}</h3>
          `;
          
          listEl.appendChild(link);
      });

  } catch (error) {
      console.error(error);
  }
}

fetchAndRenderArticle();
fetchAndRenderSideList();