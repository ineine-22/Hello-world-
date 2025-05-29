const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = {};
let rm = 1;
let ct = 10;
let round = 1;

function makeRM() {
  const r = Math.floor(Math.random() * 101);
  if (r >= 98) return 10.0;
  if (r >= 90) return 5.0;
  if (r >= 70) return 2.0;
  if (r >= 50) return 1.5;
  if (r >= 30) return 0.5;
  if (r >= 10) return 0.25;
  if (r >= 2) return 0.1;
  return 0.0;
}

function startGameLoop() {
  ct = 10;
  io.emit('countdown', ct);
  io.emit('round', round);

  const interval = setInterval(() => {
    ct--;
    io.emit('countdown', ct);

    if (ct === 0) {
      clearInterval(interval);

      // ✅ 0.5초 정도 기다렸다가 반영
      setTimeout(() => {
        rm = makeRM();

        for (const id in players) {
          const p = players[id];
          p.input = p.pending || 0;
          p.output = p.input * rm;
          p.money = p.money - p.input + p.output;
          p.pending = 0;
        }

        io.emit('multiplier', rm);
        io.emit('players', players);

        // ✅ 결과를 1.5초 보여준 후 다음 라운드
        setTimeout(() => {
          round++;
          startGameLoop();
        }, 1500);
      }, 500); // 베팅 입력 유예 시간
    }
  }, 1000);
}


io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', name => {
    players[socket.id] = {
      name,
      money: 100000,
      input: 0,
      output: 0,
      pending: 0
    };

    socket.emit('multiplier', rm);
    socket.emit('countdown', ct);
    socket.emit('round', round);
    io.emit('players', players);
    socket.emit('joinSuccess');
  });

  socket.on('bet', amount => {
    const p = players[socket.id];
    if (!p) return;

    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0 || amount > p.money) return;

    p.pending = amount;
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
  });
});

startGameLoop();

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
