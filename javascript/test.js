// 全ユーザー共通の訪問回数を取得し、画像カウンターとして表示する関数
async function updateAndDisplayPublicVisitCount() {
  const counterElement = document.getElementById('counter');
  
  try {
    // API(PHP)からカウントを取得
    const response = await fetch('/api/counter.php');
    const data = await response.json();
    const countStr = data.count.toString();
    
    counterElement.innerHTML = ''; // 初期テキストの "0" をクリア
    
    // 数値を1桁ずつ分解して画像(imgタグ)に置き換える
    for (let i = 0; i < countStr.length; i++) {
      const digit = countStr[i];
      const img = document.createElement('img');
      // 数字の画像ファイル(0.png 〜 9.png)を /imarge/ フォルダに用意してください
      img.src = `/imarge/counter/${digit}.png`;
      img.alt = digit;
      img.className = 'counter-digit-img'; // CSSでサイズ等を調整できるようにクラスを付与
      counterElement.appendChild(img);
    }
  } catch (error) {
    console.error('カウンターの取得に失敗しました', error);
    counterElement.textContent = '取得エラー';
  }
}

// 初期化処理
updateAndDisplayPublicVisitCount();


const canvas = document.getElementById('myCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = '/imarge/counter/0.png'
  img.src = '/imarge/counter/1.png'; // 対象の画像ファイルパスを設定
  img.src = '/imarge/counter/2.png'
  img.src = '/imarge/counter/3.png'
  img.src = '/imarge/counter/4.png'
  img.src = '/imarge/counter/5.png'
  img.src = '/imarge/counter/6.png'
  img.src = '/imarge/counter/7.png'
  img.src = '/imarge/counter/8.png'
  img.src = '/imarge/counter/9.png'
  
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let hueRotate = 0;
  
  img.onload = function() {
    animate();
  };
}
