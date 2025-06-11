
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = 'menu'; // menu, 1v1, zombies, win, lose, gameover
let player = { x: 100, y: 100, size: 20, color: 'green', hp: 100 };
let enemy = { x: 600, y: 100, size: 20, color: 'red', hp: 100 };
let zombies = [];
let bullets = [];
let keys = {};
let zombieKillCount = 0;
let touchStart = null;
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousedown', e => shootBullet(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; shootBullet(e.touches[0].clientX, e.touches[0].clientY); });
canvas.addEventListener('touchmove', e => {
    if (touchStart) {
        let dx = e.touches[0].clientX - touchStart.clientX;
        let dy = e.touches[0].clientY - touchStart.clientY;
        player.x += dx * 0.1;
        player.y += dy * 0.1;
        touchStart = e.touches[0];
    }
});

function shootBullet(tx, ty) {
    if (['1v1', 'zombies'].includes(gameState)) {
        const angle = Math.atan2(ty - player.y, tx - player.x);
        bullets.push({ x: player.x, y: player.y, dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5 });
    }
}

function drawTextCentered(text, size = 48, yOffset = 0, subText = '') {
    ctx.fillStyle = 'white';
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + yOffset);
    if (subText) {
        ctx.font = '24px Arial';
        ctx.fillText(subText, canvas.width / 2, canvas.height / 2 + yOffset + 40);
    }
}

function drawRect(obj) {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x - obj.size / 2, obj.y - obj.size / 2, obj.size, obj.size);
}

function update() {
    if (gameState === 'menu') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTextCentered('DEADZONE', 72, -100);
        drawTextCentered('[1] 1v1 Mode', 36, -20);
        drawTextCentered('[2] Zombies Mode', 36, 40);
        return;
    }

    if (['win', 'lose', 'gameover'].includes(gameState)) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (gameState === 'win') drawTextCentered('YOU WIN');
        if (gameState === 'lose') drawTextCentered('YOU LOSE');
        if (gameState === 'gameover') drawTextCentered('YOU DIED', 48, 0, `Zombies defeated: ${zombieKillCount}`);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    if (keys['w']) player.y -= 2;
    if (keys['s']) player.y += 2;
    if (keys['a']) player.x -= 2;
    if (keys['d']) player.x += 2;

    drawRect(player);

    bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        ctx.fillStyle = 'white';
        ctx.fillRect(b.x, b.y, 4, 4);

        if (gameState === '1v1') {
            if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < 15) {
                bullets.splice(i, 1);
                enemy.hp -= 10;
                if (enemy.hp <= 0) endGame('win');
            }
        } else if (gameState === 'zombies') {
            zombies.forEach((z, zi) => {
                if (Math.hypot(b.x - z.x, b.y - z.y) < 15) {
                    bullets.splice(i, 1);
                    zombies.splice(zi, 1);
                    zombieKillCount++;
                }
            });
        }
    });

    if (gameState === '1v1') {
        drawRect(enemy);
        ctx.fillStyle = 'white';
        ctx.fillText(`HP: ${player.hp}`, 10, 20);
        ctx.fillText(`Enemy HP: ${enemy.hp}`, 10, 40);

        if (Math.random() < 0.02) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            bullets.push({ x: enemy.x, y: enemy.y, dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5 });
        }

        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) > 30) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.x += Math.cos(angle);
            enemy.y += Math.sin(angle);
        }
    } else if (gameState === 'zombies') {
        if (Math.random() < 0.01) {
            const side = Math.random() < 0.5 ? 0 : canvas.width;
            zombies.push({ x: side, y: Math.random() * canvas.height, size: 20, color: 'red' });
        }
        zombies.forEach(z => {
            const angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle) * 0.5;
            z.y += Math.sin(angle) * 0.5;
            drawRect(z);
            if (Math.hypot(player.x - z.x, player.y - z.y) < 15) {
                endGame('gameover');
            }
        });

        ctx.fillStyle = 'white';
        ctx.fillText(`Zombies killed: ${zombieKillCount}`, 10, 20);
    }
}

function drawMap() {
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width / 3, canvas.height / 3, 100, 20);
    ctx.fillRect(canvas.width / 2, canvas.height / 2, 20, 100);
    ctx.fillRect(canvas.width / 1.5, canvas.height / 2.5, 80, 20);
}

function endGame(result) {
    gameState = result;
    setTimeout(() => {
        gameState = 'menu';
        player.hp = 100;
        enemy.hp = 100;
        zombies = [];
        bullets = [];
        zombieKillCount = 0;
        player.x = 100;
        player.y = 100;
        enemy.x = 600;
        enemy.y = 100;
    }, 3000);
}

document.addEventListener('keydown', e => {
    if (gameState === 'menu') {
        if (e.key === '1') gameState = '1v1';
        if (e.key === '2') gameState = 'zombies';
    }
});

function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}
gameLoop();
