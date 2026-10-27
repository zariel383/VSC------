
 // ↓const(定数)↓　　　↓DOMツリーの中から特定のIDを取得するメソッド↓
const scrollButton = document.getElementById('scrollButton');
const targetElement = document.getElementById('targetElement');

// =>(アロー関数)funcrionの訳　　↓イベント(click)
scrollButton.addEventListener('click', () => {
  document.body.classList.remove('noscroll');
  // 　　　　　　　↓便利メソッド指定した要素がブラウザのビューポート内に移動させるための便利メソッド
  targetElement.scrollIntoView({
    // ↓スクロールをスムーズに行うためのオプション、ないと瞬時になる
    behavior: 'smooth' // スムーズなスクロール
    });
});


const mineralButtons = document.querySelectorAll(".mineral-button");
const mineralPopups = document.querySelectorAll(".mineral-popup");//ALLはすべてのクラスを適用させる
const scrollbutton = document.querySelector(".scrollbutton");
const menutexts = document.querySelectorAll(".menu_text");


mineralButtons.forEach(button => {
  button.addEventListener("click", () => {
    const targetPopupId = button.dataset.target;
    const targetPopup = document.getElementById(targetPopupId);
    targetPopup.style.display = "block";
  
  // scrollbuttonとその子要素のイベントを無効化
    scrollbutton.style.display = "none";
    
    menutexts.forEach(menutext => {
      menutext.style.display = "none";
    });

    //
  
  });
});

mineralPopups.forEach(popup => {
  const closeButton = popup.querySelector(".card-end-button"); // 閉じるボタンのクラスを適切に設定してください
  closeButton.addEventListener("click", () => {
    popup.style.display = "none";

    // scrollbuttonとその子要素のイベントを有効化
    scrollbutton.style.display = 'block';
    
    menutexts.forEach(menutext => {
      menutext.style.display = "block";
    });
  });
});


const target_Popup = document.querySelector(".mineral-popup");


//失敗作　↑のイベント制御に一行追加すれば解決した。
// ポップアップが表示されたとき
//if (target_Popup.style.display === "block") {
//  const scrollbuttonSets = document.querySelectorAll(".scrollbutton_set"); 
//  scrollbuttonSets.forEach(set => {
//    set.style.opacity = 0; // スクロールボタンを非表示にする
//    set.style.transition = "none"; // transitionを無効化
//  });
//};　コメント文範囲にしろよ‼

/*　DOM操作で呼び出したIDが存在しなかったら論理エラーになり、他のプログラムが正常に動作しない可能性がある。　※しっかりコンソールで確認する
const caldbutton = document.getElementById("caldbutton");
const cald_indication = document.getElementById("cald-indication");

        caldbutton.addEventListener("click", () => {
        cald_indication.style.display = "block";
        });

const cardendbutton = document.getElementById("card-end-button");

         cardendbutton.addEventListener("click", () => {
          cald_indication.style.display = "none";
         });
*/
//const maincolbuttonend = document.getElementById("maincol-button-end");
  
// maincolbuttonend.addEventListener("click", () => {
//       if(cald_indication.style.display == "block" && !cald_indication.contains(event.target)){
//         alert("性交");
//         cald_indication.style.display = "none";
//       }
//   })
