const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = {};
let countdown = 10;
let currentMultiplier = 1;
let round = 1;

function getRandomMultiplier() {
  const r = Math.floor(Math.random() * 101);
  if (98 <= r && r <= 100) return 10.0;
  else if (90 <= r && r <= 97) return 5.0;
  else if (70 <= r && r <= 89) return 2.0;
  else if (50 <= r && r <= 69) return 1.5;
  else if (30 <= r && r <= 49) return 0.5;
  else if (10 <= r && r <= 29) return 0.25;
  else if (2 <= r && r <= 9) return 0.1;
  else return 0.0;
}

function startGameLoop() {
  countdown = 10;
  io.emit('countdown', countdown);
  io.emit('round', round);

  const interval = setInterval(() => {
    countdown--;
    io.emit('countdown', countdown);

    if (countdown <= 0) {
  clearInterval(interval);

  currentMultiplier = getRandomMultiplier();
  io.emit('multiplier', currentMultiplier);

  for (const id in players) {
    const player = players[id];
    const bet = player.pendingBet;

    if (bet > 0 && bet <= player.money) {
      const profit = bet * currentMultiplier;
      player.money = player.money - bet + profit;
      player.change = profit - bet;
      player.lastBet = bet;
    } else {
      player.change = 0;
      player.lastBet = 0;
    }

    player.pendingBet = 0; // 초기화
  }

  io.emit('players', players);

  round++;
  startGameLoop();
}


  }, 1000);
}

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', name => {
    players[socket.id] = { name, money: 10000, lastBet: 0, pendingBet: 0, change: 0 };
    socket.emit('multiplier', currentMultiplier);
    socket.emit('countdown', countdown);
    socket.emit('round', round);
    io.emit('players', players);
    socket.emit('joinSuccess');
  });

  socket.on('bet', amount => {
  const player = players[socket.id];
  if (!player) return;

  if (amount <= 0 || amount > player.money) {
    socket.emit('betError', '베팅 금액이 올바르지 않습니다.');
    return;
  }

  // 자산에서 차감하지 않고, pendingBet만 설정
  player.pendingBet = amount;

  io.emit('players', players); // 클라이언트는 여전히 미리보기로 보여줌
    });


  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
  });
});

startGameLoop();

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`서버 실행 중 http://localhost:${PORT}`);
});
