(function() {
    const NUM_FLIES = 8;
    const FLY_SIZE = 40;
    // 飛行時・静止時の画像ファイルのパス
    const FLY_IMAGE_FLYING = '/imarge/ka/ka-tobi.png'; // 飛行状態の画像
    const FLY_IMAGE_RESTING = '/imarge/ka/ka-toma.png'; // 静止状態の画像
    const FLY_IMAGE_DEAD = '/imarge/ka/ka-si.png'; // 死亡時の画像
    const BATIN_IMAGES = [ // 叩きエフェクト画像
        '/imarge/ka/batin-0.png',
        '/imarge/ka/batin-1.png',
        '/imarge/ka/batin-2.png'
    ];
    
    // 叩きエフェクト画像のプリロード（初回クリック時の読み込み遅延による非表示を防ぐ）
    BATIN_IMAGES.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    // ★速度調整用の設定
    const MOVE_SPEED = 5.0; // ハエの移動速度（1フレームあたりの移動ピクセル数）。この値で一定の速度が決まります。
    const FLY_SPEED_MULTIPLIER = 2; // 飛行速度の倍率（1.0が基準。2.0にすると2倍の速さになります）

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let lastMoveTime = Date.now();

    // パニック演出（散り散りに逃げる）用の変数
    let lastCursorX = cursorX;
    let lastCursorY = cursorY;
    let lastEventTime = Date.now();
    let panicEndTime = 0;
    let lastRestEndTime = 0; // 追加：最後に止まっていた時間を記録する変数

    // カーソルの動きを監視
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        const dx = e.clientX - lastCursorX;
        const dy = e.clientY - lastCursorY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = now - lastEventTime;

        // 5秒以上動きがなかった（ハエが止まっていた）状態から動いた場合、その時間を記録
        if (now - lastMoveTime > 3000) {
            lastRestEndTime = now;
        }

        // 停止状態が解除されてからわずかな時間（500ms以内）を「ハエが止まっている時」として判定
        const isJustAfterRest = (now - lastRestEndTime) < 500;

        // 「ハエが止まっている時」かつ「移動速度（px/ms）がしきい値を超えたら」驚きモードに移行
        if (isJustAfterRest && timeDiff > 0 && (dist / timeDiff) > 1.5) {
            panicEndTime = now + 2000; // 2秒間パニックモード
            lastRestEndTime = 0; // 連続発動を防ぐためにリセット
            const pCursorX = cursorX;
            const pCursorY = cursorY;
            flies.forEach(fly => {
                // パニック発生時のカーソル位置から外側に向かう角度
                fly.angle = Math.atan2(fly.currentY - pCursorY, fly.currentX - pCursorX);
                // 逃げ先の中心座標を計算（カーソルから300〜500px離れた位置）
                const escapeDist = 300 + Math.random() * 200;
                fly.panicCenterX = pCursorX + Math.cos(fly.angle) * escapeDist;
                fly.panicCenterY = pCursorY + Math.sin(fly.angle) * escapeDist;
            });
        }

        cursorX = e.clientX;
        cursorY = e.clientY;
        lastCursorX = cursorX;
        lastCursorY = cursorY;
        lastEventTime = now;
        lastMoveTime = now;
    });

    const flies = [];

    // ハエを初期化
    for (let i = 0; i < NUM_FLIES; i++) {
        const flyEl = document.createElement('img');
        flyEl.setAttribute('src', FLY_IMAGE_FLYING);
        flyEl.classList.add('fly-element'); // モード時にCSSで操作するためクラス付与
        // flyEl.style.backgroundColor = '#1a1a1a'; // 画像読み込みエラー時の代替色
        flyEl.style.width = FLY_SIZE + 'px';
        flyEl.style.height = FLY_SIZE + 'px';
        flyEl.style.position = 'fixed';
        flyEl.style.pointerEvents = 'none'; // クリック等の妨げにならないようにする
        flyEl.style.zIndex = '9999';
        flyEl.style.borderRadius = '30% 70% 70% 30%'; // 少し歪な形にする
        document.body.appendChild(flyEl);

        // 各個体のランダムなスピードと回転方向（時計回り/反時計回り）
        const speed = (0.05 + Math.random() * 0.05) * FLY_SPEED_MULTIPLIER * (Math.random() < 0.5 ? 1 : -1);
        
        // 画面端のランダムな位置を計算
        let startX, startY;
        if (Math.random() < 0.5) {
            startX = Math.random() * window.innerWidth;
            startY = Math.random() < 0.5 ? -FLY_SIZE : window.innerHeight + FLY_SIZE;
        } else {
            startX = Math.random() < 0.5 ? -FLY_SIZE : window.innerWidth + FLY_SIZE;
            startY = Math.random() * window.innerHeight;
        }

        const flyObj = {
            element: flyEl,
            angle: Math.random() * Math.PI * 2,
            baseRadius: 30 + Math.random() * 500, // 30〜80pxの距離を漂う
            baseSpeed: speed,
            currentSpeed: speed,
            noiseTimeX: Math.random() * 100,
            noiseTimeY: Math.random() * 100,
            noiseSpeedX: (0.1 + Math.random() * 0.1) * FLY_SPEED_MULTIPLIER,
            noiseSpeedY: (0.1 + Math.random() * 0.1) * FLY_SPEED_MULTIPLIER,
            willLand: Math.random() < 0.8, // 止まる個体をランダムに設定(約半分)
            currentRadius: 50,
            currentX: startX,
            currentY: startY,
            panicCenterX: cursorX,
            panicCenterY: cursorY,
            isDead: false // 死亡判定フラグ
        };

        flies.push(flyObj);

        // ハエを叩いた時の処理
        flyEl.addEventListener('mousedown', (e) => {
            const isSwatterMode = document.body.classList.contains('fly-swatter-active');
            if (!isSwatterMode || flyObj.isDead) return;

            // 死亡状態に移行
            flyObj.isDead = true;
            flyObj.element.setAttribute('src', FLY_IMAGE_DEAD);

            // フェードアウト処理 (1秒後に2秒かけて消える)
            setTimeout(() => {
                flyObj.element.style.transition = 'opacity 10s ease';
                flyObj.element.style.opacity = '0';
                setTimeout(() => {
                    flyObj.element.style.display = 'none';
                }, 10000);
            }, 1000);

            // 確実にクリックした座標（マウス位置）にエフェクトを出す
            showBatin(e.clientX, e.clientY);
            checkAllDead();
        });
    }

    // エフェクト「batin」をランダムに表示してフェードアウトさせる処理
    function showBatin(x, y) {
        const batinEl = document.createElement('img');
        const rIndex = Math.floor(Math.random() * BATIN_IMAGES.length);
        batinEl.setAttribute('src', BATIN_IMAGES[rIndex]);
        batinEl.style.position = 'fixed';
        
        const bSize = 128; // 叩きエフェクトの表示サイズ
        batinEl.style.width = bSize + 'px';
        batinEl.style.height = bSize + 'px';
        batinEl.style.left = (x - bSize / 2) + 'px';
        batinEl.style.top = (y - bSize / 2) + 'px';
        batinEl.style.pointerEvents = 'none';
        batinEl.style.zIndex = '10000';
        // batinEl.style.transform = `rotate(${Math.random() * 360}deg)`; // 角度をランダムに
        document.body.appendChild(batinEl);

        // 少し待ってからフェードアウト
        setTimeout(() => {
            batinEl.style.transition = 'opacity 1s ease';
            batinEl.style.opacity = '0';
            setTimeout(() => {
                batinEl.remove();
            }, 1000);
        }, 500);
    }

    // ハエが全滅したか判定
    let isGameCleared = false;
    function checkAllDead() {
        const allDead = flies.every(f => f.isDead);
        if (allDead && !isGameCleared) {
            isGameCleared = true;
            const tBtn = document.getElementById('fly-swatter-mode-toggle');
            if (tBtn) tBtn.disabled = true; // 全滅した瞬間にスイッチ操作を無効化する
            setTimeout(() => {
                const overlay = document.getElementById('fly-swatter-overlay');
                if (overlay) overlay.style.display = 'flex';
            }, 200); // すべて叩き終わって1秒後にクリア表示
        }
    }

    function animate() {
        const now = Date.now();
        const isResting = (now - lastMoveTime) > 3000; // 3秒以上動きがないか判定
        const isPanicked = now < panicEndTime; // パニックモード判定

        flies.forEach(fly => {
            if (fly.isDead) return; // 死んだハエは動かさずにスキップ

            let targetRadius = fly.baseRadius;
            let targetSpeed = fly.baseSpeed;
            let noiseAmp = 40; // 不規則な動きの振り幅

            // 目標とする旋回中心座標（通常時はカーソル位置）
            let centerX = cursorX;
            let centerY = cursorY;
            let targetImage = FLY_IMAGE_FLYING; // 通常は飛行状態の画像

            // 3秒経過 ＋ 止まる設定のハエの場合
            if (isResting && fly.willLand) {
                targetRadius = Math.random() * 20; // カーソル中心に集める
                targetSpeed = 0;                   // 回転を止める
                noiseAmp = 0;                      // 揺らぎをなくす
                targetImage = FLY_IMAGE_RESTING;   // 静止状態の画像にする
            } else if (isPanicked) {
                // パニック時は逃げた先の座標を中心に飛び回る（カーソルに追従しない）
                centerX = fly.panicCenterX;
                centerY = fly.panicCenterY;
                targetSpeed = fly.baseSpeed * 2.5; // 焦って速く飛び回る
                noiseAmp = 80;                     // 激しくブレる
            }

            // 画像の状態を更新（無駄な書き換えを防ぐため、違う場合のみ設定）
            if (fly.element.getAttribute('src') !== targetImage) {
                fly.element.setAttribute('src', targetImage);
            }

            // カーソルから左側の場合に画像を反転させる
            const targetScaleX = fly.currentX < cursorX ? -1 : 1;
            if (fly.element.style.transform !== `scaleX(${targetScaleX})`) {
                fly.element.style.transform = `scaleX(${targetScaleX})`;
            }

            // 状態の滑らかな変化
            fly.currentRadius += (targetRadius - fly.currentRadius) * 0.1;
            fly.currentSpeed += (targetSpeed - fly.currentSpeed) * 0.1;
            fly.angle += fly.currentSpeed;
            
            // サイン波を利用したハエ特有の不規則な動き（ノイズ）
            fly.noiseTimeX += fly.noiseSpeedX;
            fly.noiseTimeY += fly.noiseSpeedY;
            const noiseX = Math.sin(fly.noiseTimeX) * noiseAmp;
            const noiseY = Math.cos(fly.noiseTimeY) * noiseAmp;

            // 最終的な目標座標の計算
            const targetX = centerX + Math.cos(fly.angle) * fly.currentRadius + noiseX;
            const targetY = centerY + Math.sin(fly.angle) * fly.currentRadius + noiseY;

            // 目標座標への距離と方向を計算
            const dx = targetX - fly.currentX;
            const dy = targetY - fly.currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 距離に関わらず一定の速度で移動させる処理
            const currentMoveSpeed = isPanicked ? MOVE_SPEED * 2.5 : MOVE_SPEED; // パニック時は逃げ足も速くする
            const speedThisFrame = currentMoveSpeed * FLY_SPEED_MULTIPLIER;
            if (distance > speedThisFrame) {
                fly.currentX += (dx / distance) * speedThisFrame;
                fly.currentY += (dy / distance) * speedThisFrame;
            } else {
                fly.currentX = targetX;
                fly.currentY = targetY;
            }

            // 座標をスタイルに反映
            fly.element.style.left = (fly.currentX - FLY_SIZE / 2) + 'px';
            fly.element.style.top = (fly.currentY - FLY_SIZE / 2) + 'px';
        });

        requestAnimationFrame(animate);
    }

    animate();

    // トグルスイッチとポップアップの連携処理
    const toggleBtn = document.getElementById('fly-swatter-mode-toggle');
    const overlay = document.getElementById('fly-swatter-overlay');
    const closeBtn = document.getElementById('close-fly-swatter-popup');

    if (toggleBtn) {
        // ページリロード時に確実にハエ叩きモードをオフ（初期状態）にする
        toggleBtn.checked = false;
        document.body.classList.remove('fly-swatter-active');

        toggleBtn.addEventListener('change', (e) => {
            if (toggleBtn.disabled || isGameCleared) {
                e.target.checked = false; // 無効時はオンにできないように強制オフ
                document.body.classList.remove('fly-swatter-active'); // クラスも削除
                return;
            }
            if (e.target.checked) {
                document.body.classList.add('fly-swatter-active');
            } else {
                document.body.classList.remove('fly-swatter-active');
            }
        });
    }
    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none'; // ポップアップを消す
            document.body.classList.remove('fly-swatter-active'); // モード解除
            if (toggleBtn) toggleBtn.checked = false; // トグルの見た目をOFFに戻す
        });
    }
})();