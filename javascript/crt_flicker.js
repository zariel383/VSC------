document.addEventListener('DOMContentLoaded', () => {

    const debugSlidersContainer = document.getElementById('crt-debug-sliders');
    const bandHeightSlider = document.getElementById('band-height-slider');
    const bandHeightVal = document.getElementById('band-height-val');
    const scanlineSpeedIntSlider = document.getElementById('scanline-speed-int-slider');
    const scanlineSpeedIntVal = document.getElementById('scanline-speed-int-val');
    const scanlineSpeedDec1Slider = document.getElementById('scanline-speed-dec1-slider');
    const scanlineSpeedDec1Val = document.getElementById('scanline-speed-dec1-val');
    const scanlineSpeedDec2Slider = document.getElementById('scanline-speed-dec2-slider');
    const scanlineSpeedDec2Val = document.getElementById('scanline-speed-dec2-val');
    const scanlineSpeedDec3Slider = document.getElementById('scanline-speed-dec3-slider');
    const scanlineSpeedDec3Val = document.getElementById('scanline-speed-dec3-val');
    const scanlineSpeedTotalVal = document.getElementById('scanline-speed-total-val');
    const crtFadeSlider = document.getElementById('crt-fade-slider');
    const crtFadeVal = document.getElementById('crt-fade-val');
    const crtDarknessSlider = document.getElementById('crt-darkness-slider');
    const crtDarknessVal = document.getElementById('crt-darkness-val');
    // Animation controls
    const animateBtn = document.getElementById('crt-animate-btn');
    let speedEditor = null;
    let fadeEditor = null;

    let crtAnimationId = null;
    let crtCanvas = null;
    let crtCtx = null;
    let scanlineOverlay = null; 
    let scanlineX = 0; 
    let scanlineY = 0; 
    
    // 発光の軌跡を管理する配列（完全な黒を再現するため）
    let trails = [];

    let bandHeightDivisor = 600; 
    let scanlineSpeedInt = 5;
    let scanlineSpeedDec1 = 0;
    let scanlineSpeedDec2 = 0;
    let scanlineSpeedDec3 = 0;
    let scanlineSpeedMultiplier = 5.000;
    let crtFadeRate = 0.35;
    let crtDarkness = 0.85;

    function updateScanlineSpeed() {
        scanlineSpeedMultiplier = scanlineSpeedInt + scanlineSpeedDec1 + scanlineSpeedDec2 + scanlineSpeedDec3;
        if (scanlineSpeedTotalVal) {
            scanlineSpeedTotalVal.textContent = scanlineSpeedMultiplier.toFixed(3);
        }
    }
    
    if (scanlineSpeedDec3Slider) {
        scanlineSpeedDec3Slider.addEventListener('input', (e) => {
            scanlineSpeedDec3 = parseFloat(e.target.value);
            if (scanlineSpeedDec3Val) scanlineSpeedDec3Val.textContent = scanlineSpeedDec3.toFixed(3);
            updateScanlineSpeed();
        });
    }
    
    if (bandHeightSlider) {
        bandHeightSlider.addEventListener('input', (e) => {
            bandHeightDivisor = parseFloat(e.target.value);
            if (bandHeightVal) bandHeightVal.textContent = bandHeightDivisor;
        });
    }
    
    if (crtFadeSlider) {
        crtFadeSlider.addEventListener('input', (e) => {
            crtFadeRate = parseFloat(e.target.value);
            if (crtFadeVal) crtFadeVal.textContent = crtFadeRate.toFixed(2);
        });
    }

    if (crtDarknessSlider) {
        crtDarknessSlider.addEventListener('input', (e) => {
            crtDarkness = parseFloat(e.target.value);
            if (crtDarknessVal) crtDarknessVal.textContent = crtDarkness.toFixed(2);
            if (crtCanvas) crtCanvas.style.opacity = crtDarkness; 
        });
    }

    if (scanlineSpeedIntSlider) {
        scanlineSpeedIntSlider.addEventListener('input', (e) => {
            scanlineSpeedInt = parseFloat(e.target.value);
            if (scanlineSpeedIntVal) scanlineSpeedIntVal.textContent = scanlineSpeedInt;
            updateScanlineSpeed();
        });
    }
    if (scanlineSpeedDec1Slider) {
        scanlineSpeedDec1Slider.addEventListener('input', (e) => {
            scanlineSpeedDec1 = parseFloat(e.target.value);
            if (scanlineSpeedDec1Val) scanlineSpeedDec1Val.textContent = scanlineSpeedDec1.toFixed(1);
            updateScanlineSpeed();
        });
    }
    if (scanlineSpeedDec2Slider) {
        scanlineSpeedDec2Slider.addEventListener('input', (e) => {
            scanlineSpeedDec2 = parseFloat(e.target.value);
            if (scanlineSpeedDec2Val) scanlineSpeedDec2Val.textContent = scanlineSpeedDec2.toFixed(2);
            updateScanlineSpeed();
        });
    }

    function startCRTFlicker() {
        if (crtCanvas) return;
        
        const previewContainer = document.getElementById('crt-preview-container');
        const container = previewContainer || document.body;
        const rect = container.getBoundingClientRect();
        
        crtCanvas = document.createElement('canvas');
        crtCanvas.width = rect.width;
        crtCanvas.height = rect.height;
        crtCanvas.style.position = previewContainer ? 'absolute' : 'fixed';
        crtCanvas.style.top = '0';
        crtCanvas.style.left = '0';
        crtCanvas.style.pointerEvents = 'none'; 
        crtCanvas.style.zIndex = '9998'; 
        crtCanvas.style.opacity = '1.0'; // ボタンが押されるまで画面を暗転させておく
        container.appendChild(crtCanvas);
        
        scanlineOverlay = document.createElement('div');
        scanlineOverlay.style.position = previewContainer ? 'absolute' : 'fixed';
        scanlineOverlay.style.top = '0';
        scanlineOverlay.style.left = '0';
        scanlineOverlay.style.width = '100%';
        scanlineOverlay.style.height = '100%';
        scanlineOverlay.style.pointerEvents = 'none';
        scanlineOverlay.style.zIndex = '9999'; 
        scanlineOverlay.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%)';
        scanlineOverlay.style.backgroundSize = `100% calc(${rect.height}px / 300)`; 
        container.appendChild(scanlineOverlay);

        crtCtx = crtCanvas.getContext('2d', { alpha: true });
        window.addEventListener('resize', resizeCRTCanvas);
        
        scanlineX = 0;
        scanlineY = 0;
        trails = [];

        // 初期状態として完全に真っ黒に塗りつぶす（ループはまだ開始しない）
        crtCtx.fillStyle = `rgba(0, 0, 0, 1.0)`;
        crtCtx.fillRect(0, 0, crtCanvas.width, crtCanvas.height);
    }

    function draw() {
        if (!crtCtx || !crtCanvas) return;

        // 背景を完全に不透明な黒で塗りつぶし、ビームが通っていない箇所は「完全に見えなく」する
        crtCtx.fillStyle = `rgba(0, 0, 0, 1.0)`;
        crtCtx.fillRect(0, 0, crtCanvas.width, crtCanvas.height);
        
        const bandHeight = crtCanvas.height / bandHeightDivisor; 
        let remainingPixels = scanlineSpeedMultiplier * crtCanvas.width;
        
        // フェード速度（減衰率）から寿命を計算。0.01なら100フレームで消える
        const lifeTime = Math.max(1, Math.floor(1 / crtFadeRate));

        // 電子ビームの軌跡を計算して配列に追加する
        while (remainingPixels > 0) {
            const pixelsToRightEdge = crtCanvas.width - scanlineX;
            
            if (remainingPixels < pixelsToRightEdge) {
                trails.push({ x: scanlineX, y: scanlineY, w: remainingPixels, h: bandHeight, age: 0 });
                scanlineX += remainingPixels;
                remainingPixels = 0;
            } else {
                trails.push({ x: scanlineX, y: scanlineY, w: pixelsToRightEdge, h: bandHeight, age: 0 });
                remainingPixels -= pixelsToRightEdge;
                scanlineX = 0;
                scanlineY += bandHeight;
                
                if (scanlineY >= crtCanvas.height) {
                    scanlineY = 0;
                }
            }
        }
        
        // 軌跡を描画する（古い軌跡から順に上書きすることで、新しい光が最前面になる）
        for (let i = 0; i < trails.length; i++) {
            const trail = trails[i];
            
            // アンチエイリアス（境界の半透明化）を防ぐため、描画座標を整数ピクセルに丸める
            const drawX = Math.floor(trail.x);
            const drawY = Math.floor(trail.y);
            const drawW = Math.ceil(trail.x + trail.w) - drawX;
            const drawH = Math.ceil(trail.y + trail.h) - drawY;

            // くり抜いて透明にし、下のページを見せる
            crtCtx.clearRect(drawX, drawY, drawW, drawH);
            
            // ageに応じて黒を重ねて暗くしていく
            const darkness = trail.age / lifeTime;
            if (darkness > 0) {
                crtCtx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
                crtCtx.fillRect(drawX, drawY, drawW, drawH);
            }
            
            trail.age++;
        }

        // 寿命を超えた軌跡を配列から削除する（インデックスがずれないよう末尾から逆順で処理）
        for (let i = trails.length - 1; i >= 0; i--) {
            if (trails[i].age > lifeTime) {
                trails.splice(i, 1);
            }
        }
        
        crtAnimationId = requestAnimationFrame(draw);
    }

    function resizeCRTCanvas() {
        if (crtCanvas) {
            const previewContainer = document.getElementById('crt-preview-container');
            const container = previewContainer || document.body;
            const rect = container.getBoundingClientRect();
            crtCanvas.width = rect.width;
            crtCanvas.height = rect.height;
            if (scanlineOverlay) {
                scanlineOverlay.style.backgroundSize = `100% calc(${rect.height}px / 300)`; 
            }
        }
    }

    function stopCRTFlicker() {
        if (crtAnimationId) {
            cancelAnimationFrame(crtAnimationId);
            crtAnimationId = null;
        }
        if (crtCanvas) {
            window.removeEventListener('resize', resizeCRTCanvas);
            crtCanvas.remove();
            crtCanvas = null;
            crtCtx = null;
        }
        if (scanlineOverlay) {
            scanlineOverlay.remove();
            scanlineOverlay = null;
        }
    }

    // === Bezier Curve Editor and Animation Logic ===
    // 加速をより遅く（前半はほぼ変化せず、終盤で一気に加速する極端なEase-In設定）
    const EASE_IN_OUT_DEFAULT = { p1: { x: 0.8, y: 0 }, p2: { x: 0.8, y: 0 } };

    // --- Bezier Math (Cubic Bezier solver) ---
    const NEWTON_ITERATIONS = 4;
    const NEWTON_MIN_SLOPE = 0.001;
    const SUBDIVISION_PRECISION = 0.0000001;
    const SUBDIVISION_MAX_ITERATIONS = 10;
    const kSplineTableSize = 11;
    const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    const A = (aA1, aA2) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
    const B = (aA1, aA2) => 3.0 * aA2 - 6.0 * aA1;
    const C = (aA1) => 3.0 * aA1;
    const calcBezier = (aT, aA1, aA2) => ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    const getSlope = (aT, aA1, aA2) => 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);

    function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
        for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
            const currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) return aGuessT;
            const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }

    function getCubicBezier(mX1, mY1, mX2, mY2) {
        if (mX1 === mY1 && mX2 === mY2) return (x) => x; // Linear

        const sampleValues = new Float32Array(kSplineTableSize);
        for (let i = 0; i < kSplineTableSize; ++i) {
            sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }

        const getTForX = (aX) => {
            let intervalStart = 0.0;
            let currentSample = 1;
            const lastSample = kSplineTableSize - 1;

            for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;

            const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
            const guessForT = intervalStart + dist * kSampleStepSize;
            const initialSlope = getSlope(guessForT, mX1, mX2);

            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            }
            return guessForT; // Fallback for low slope
        };

        return (x) => (x === 0 || x === 1) ? x : calcBezier(getTForX(x), mY1, mY2);
    }

    // --- Bezier Editor Class ---
    class BezierEditor {
        constructor(canvasId, p1_init, p2_init) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            
            this.p0 = { x: 0, y: this.height };
            this.p3 = { x: this.width, y: 0 };
            
            this.p1 = { x: p1_init.x * this.width, y: (1 - p1_init.y) * this.height };
            this.p2 = { x: p2_init.x * this.width, y: (1 - p2_init.y) * this.height };

            this.draggingPoint = null;
            this.pointRadius = 5;

            this.addEventListeners();
            this.draw();
        }

        draw(progress = null, easedValue = null) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // Draw handles
            this.ctx.strokeStyle = '#ccc';
            this.ctx.beginPath();
            this.ctx.moveTo(this.p0.x, this.p0.y);
            this.ctx.lineTo(this.p1.x, this.p1.y);
            this.ctx.moveTo(this.p3.x, this.p3.y);
            this.ctx.lineTo(this.p2.x, this.p2.y);
            this.ctx.stroke();

            // Draw curve
            this.ctx.strokeStyle = '#793e17';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.p0.x, this.p0.y);
            this.ctx.bezierCurveTo(this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.p3.x, this.p3.y);
            this.ctx.stroke();
            this.ctx.lineWidth = 1;

            // Draw control points
            [this.p1, this.p2].forEach(p => {
                this.ctx.fillStyle = '#ff3232';
                this.ctx.beginPath();
                // 描画位置をキャンバス内に制限して、領域外に出ても常に端に見えるようにする
                const drawX = Math.max(this.pointRadius, Math.min(this.width - this.pointRadius, p.x));
                const drawY = Math.max(this.pointRadius, Math.min(this.height - this.pointRadius, p.y));
                this.ctx.arc(drawX, drawY, this.pointRadius, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // アニメーション進行状況のプロット（点表示）
            if (progress !== null && easedValue !== null) {
                const plotX = progress * this.width;
                const plotY = (1 - easedValue) * this.height;

                // 現在の進行度（時間）を示す縦のガイド線
                this.ctx.strokeStyle = 'rgba(0, 123, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(plotX, 0);
                this.ctx.lineTo(plotX, this.height);
                this.ctx.stroke();

                // 現在値の点（青色で少し大きく、白フチ付き）
                this.ctx.fillStyle = '#007bff';
                this.ctx.beginPath();
                this.ctx.arc(plotX, plotY, this.pointRadius + 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }

        getPos(e) {
            const rect = this.canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }

        addEventListeners() {
            this.canvas.addEventListener('mousedown', (e) => {
                const pos = this.getPos(e);
                let pointToDrag = null;

                // 判定用の座標を描画位置（クランプ済み）に合わせて取得
                const getClamped = (p) => ({
                    x: Math.max(this.pointRadius, Math.min(this.width - this.pointRadius, p.x)),
                    y: Math.max(this.pointRadius, Math.min(this.height - this.pointRadius, p.y))
                });

                const v1 = getClamped(this.p1);
                const v2 = getClamped(this.p2);

                if (Math.hypot(pos.x - v1.x, pos.y - v1.y) < this.pointRadius * 3) {
                    pointToDrag = this.p1;
                } else if (Math.hypot(pos.x - v2.x, pos.y - v2.y) < this.pointRadius * 3) {
                    pointToDrag = this.p2;
                }

                if (pointToDrag) {
                    this.draggingPoint = pointToDrag;

                    const handleMouseMove = (moveEvent) => {
                        const movePos = this.getPos(moveEvent);
                        this.draggingPoint.x = movePos.x;
                        this.draggingPoint.y = movePos.y;
                        this.draw();
                    };

                    const handleMouseUp = () => {
                        this.draggingPoint = null;
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                }
            });
        }

        getCurve() {
            const p1x = this.p1.x / this.width;
            const p1y = 1 - (this.p1.y / this.height);
            const p2x = this.p2.x / this.width;
            const p2y = 1 - (this.p2.y / this.height);
            return getCubicBezier(p1x, p1y, p2x, p2y);
        }
    }

    // --- Init Editors and Animation ---
    speedEditor = new BezierEditor('bezier-editor-speed', EASE_IN_OUT_DEFAULT.p1, EASE_IN_OUT_DEFAULT.p2);
    fadeEditor = new BezierEditor('bezier-editor-fade', EASE_IN_OUT_DEFAULT.p1, EASE_IN_OUT_DEFAULT.p2);

    let animationRequestId = null;

    // パラメータアニメーションのメインロジックを関数化
    function startCrtParameterAnimation() {
        if (animationRequestId) cancelAnimationFrame(animationRequestId);

        // 2. アニメーションの始点と終点を設定
            const startSpeed = 0.001;
            const endSpeed = 599.000;
            const startFade = 0.01;
            const endFade = 0.50;
        const duration = 10000; // 30秒に延長して、電子ビームの動きの変化をじっくり観察できるようにする

            const speedCurve = speedEditor.getCurve();
            const fadeCurve = fadeEditor.getCurve();

            let startTime = null;

            function animationStep(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                let progress = Math.min(elapsed / duration, 1.0);

                // 3. ベジェ曲線に沿った現在の値を計算
                const easedSpeedProgress = speedCurve(progress);
                const easedFadeProgress = fadeCurve(progress);

                const currentSpeed = startSpeed + (endSpeed - startSpeed) * easedSpeedProgress;
                const currentFade = startFade + (endFade - startFade) * easedFadeProgress;

                // 4. グローバル変数とUIスライダーを更新
                scanlineSpeedMultiplier = currentSpeed;
                crtFadeRate = currentFade;

                // 速度スライダーの値を分解して更新（文字列処理を利用して浮動小数点の誤差を排除）
                const speedStr = currentSpeed.toFixed(3);
                const dotIdx = speedStr.indexOf('.');
                scanlineSpeedInt = parseInt(speedStr.substring(0, dotIdx), 10);
                scanlineSpeedDec1 = parseInt(speedStr[dotIdx + 1], 10) / 10;
                scanlineSpeedDec2 = parseInt(speedStr[dotIdx + 2], 10) / 100;
                scanlineSpeedDec3 = 0; // .000単位はアニメーション対象外
                updateScanlineSpeed(); 

                // スライダーの見た目を更新
                scanlineSpeedIntSlider.value = scanlineSpeedInt;
                scanlineSpeedIntVal.textContent = scanlineSpeedInt;
                scanlineSpeedDec1Slider.value = scanlineSpeedDec1;
                scanlineSpeedDec1Val.textContent = scanlineSpeedDec1.toFixed(1);
                scanlineSpeedDec2Slider.value = scanlineSpeedDec2;
                scanlineSpeedDec2Val.textContent = scanlineSpeedDec2.toFixed(2);
                scanlineSpeedDec3Slider.value = scanlineSpeedDec3;
                scanlineSpeedDec3Val.textContent = scanlineSpeedDec3.toFixed(3);

                crtFadeSlider.value = currentFade;
                crtFadeVal.textContent = currentFade.toFixed(2);

                // グラフ上に現在の値をプロット
                speedEditor.draw(progress, easedSpeedProgress);
                fadeEditor.draw(progress, easedFadeProgress);

            // 5. アニメーションを継続
                if (progress < 1.0) {
                    animationRequestId = requestAnimationFrame(animationStep);
                } else {
                    animationRequestId = null;
                    // 終了後にドットを消す場合は再描画
                    speedEditor.draw();
                    fadeEditor.draw();
                }
            }

            animationRequestId = requestAnimationFrame(animationStep);
    }

    if (animateBtn) {
        animateBtn.addEventListener('click', () => {
            if (!crtCanvas) return; // CRTモードがオフの場合は何もしない

            // 1. ボタンクリック時点でパラメータを初期値にリセット
            bandHeightDivisor = 600;
            bandHeightSlider.value = 600;
            bandHeightVal.textContent = 600;

            // 暗転解除時のベースの濃さを初期化
            crtDarkness = 1;
            crtDarknessSlider.value = 1;
            crtDarknessVal.textContent = '0.85';

            // 速度関連の初期化 (0.010)
            scanlineSpeedInt = 0;
            scanlineSpeedDec1 = 0;
            scanlineSpeedDec2 = 0.01;
            scanlineSpeedDec3 = 0;
            updateScanlineSpeed();
            scanlineSpeedIntSlider.value = 0;
            scanlineSpeedDec1Slider.value = 0;
            scanlineSpeedDec2Slider.value = 0.01;
            scanlineSpeedDec3Slider.value = 0;

            // 電子ビームアニメーションの起点を画面中心（左端・中央の高さ）に固定
            if (crtCanvas) {
                scanlineX = 0;
                scanlineY = crtCanvas.height / 2;
                trails = []; // 過去の光の軌跡をクリア
            }

            // 2. 暗転を解除してベジェ曲線アニメーションを実行
            if (crtCanvas) crtCanvas.style.opacity = crtDarkness;
            
            if (!crtAnimationId) {
                draw(); // 電源オン：描画ループを開始
            }

            startCrtParameterAnimation();
        });
    }

    // 初期状態として暗転した状態で描画ループを開始する
    startCRTFlicker();

});