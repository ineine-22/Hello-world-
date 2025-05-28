const socket = io();

const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const playerName = document.getElementById('playerName');
const gameArea = document.getElementById('gameArea');
const betInput = document.getElementById('betInput');
const betBtn = document.getElementById('betBtn');
const compareBtn = document.getElementById('compareBtn');
const playerList = document.getElementById('playerList');

let myName = '';

joinBtn.addEventListener('click', () => {
  myName = nameInput.value.trim();
  if (myName) {
    socket.emit('join', myName);
    playerName.textContent = `${myName}님 환영합니다!`;
    gameArea.style.display = 'block';
    nameInput.disabled = true;
    joinBtn.disabled = true;
  }
});

betBtn.addEventListener('click', () => {
  const bet = parseInt(betInput.value);
  if (!isNaN(bet)) {
    socket.emit('bet', bet);
    betInput.value = '';
  }
});

compareBtn.addEventListener('click', () => {
  socket.emit('compare');
});

socket.on('playersUpdate', (players) => {
  playerList.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name} - 💰 ${p.money}원 / 베팅: ${p.bet}`;
    playerList.appendChild(li);
  });
});
