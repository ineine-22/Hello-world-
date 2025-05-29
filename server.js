// 10to10 server 1.0 // 기반 설정 완료. 값 잘 나옴. id, 재접속, 단위 설정 등 편의 기능 추가.

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let nextId = 1;
let rm = 1;
let ct = 8;
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
  ct = 8;
  io.emit('countdown', ct);
  io.emit('round', round);

  const interval = setInterval(() => {
    ct--;
    io.emit('countdown', ct);

    if (ct === 0) {
      clearInterval(interval);

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

        setTimeout(() => {
          round++;
          startGameLoop();
        }, 1500);
      }, 500);
    }
  }, 1000);
}

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ name, code }) => {
    let existing = Object.values(players).find(p => p.code === code);

    if (existing) {
      players[socket.id] = existing;
      delete players[existing.socketId];
      existing.socketId = socket.id;
    } else {
      const id = String(nextId++).padStart(2, '0');
      players[socket.id] = {
        id,
        name,
        code,
        socketId: socket.id,
        money: 100000,
        input: 0,
        output: 0,
        pending: 0
      };
    }

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
    // 삭제하지 않음
    console.log('User disconnected (not deleted):', socket.id);
  });
});

startGameLoop();

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
