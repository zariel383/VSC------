const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ボール
let ballX = canvas.width / 5;
let ballY = canvas.height / 2;
let ballRadius = 10;
let ballSpeedX = 2;
let ballSpeedY = -2;

// パドル
let paddleWidth = 75;
let paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;

// ゲームループ
function draw() {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ボールを描画
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    // パドルを描画
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    // ボールの移動
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // 壁との衝突判定
    if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            ballSpeedY = -ballSpeedY;
        } else {
            alert('ゲームオーバー！');
            document.location.reload();
        }
    }

    // パドルの移動 (マウス操作)
    canvas.addEventListener('mousemove', (e) => {
        const relativeX = e.clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddleX = relativeX - paddleWidth / 2;
        }
    });

    requestAnimationFrame(draw);
}

draw();