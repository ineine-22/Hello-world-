const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = [];

io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  socket.on('join', (name) => {
    players.push({ id: socket.id, name, money: 1000, bet: 0 });
    io.emit('playersUpdate', players);
  });

  socket.on('bet', (amount) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.bet = parseInt(amount);
      io.emit('playersUpdate', players);
    }
  });

  socket.on('compare', () => {
    const maxBet = Math.max(...players.map(p => p.bet));
    players.forEach(p => {
      if (p.bet === maxBet) p.money += 100;
      else p.money -= 100;
    });
    players.forEach(p => (p.bet = 0));
    io.emit('playersUpdate', players);
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('playersUpdate', players);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
