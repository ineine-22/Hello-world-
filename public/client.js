const socket = io();

const nicknameScreen = document.getElementById('nickname-screen');
const gameScreen = document.getElementById('game-screen');
const nicknameInput = document.getElementById('nickname-input');
const joinBtn = document.getElementById('join-btn');
const currentMultiplierSpan = document.getElementById('current-multiplier');
const playerTableBody = document.getElementById('player-table-body');
const timeBar = document.getElementById('time-bar');
const timeText = document.getElementById('time-text');
const myMoneySpan = document.getElementById('my-money');
const betInput = document.getElementById('bet-input');
const logDiv = document.getElementById('log');
const roundSpan = document.getElementById('round-number');

let myId = null;
let myMoney = 0;
let currentBet = 0;

joinBtn.addEventListener('click', () => {
  const name = nicknameInput.value.trim();
  if (!name) {
    alert('닉네임을 입력하세요.');
    return;
  }
  socket.emit('join', name);
});

socket.on('connect', () => {
  myId = socket.id;
});

socket.on('multiplier', multiplier => {
  currentMultiplierSpan.textContent = multiplier.toFixed(2);
});

socket.on('countdown', time => {
  timeBar.value = time;
  timeText.textContent = time + '초';

  if (time === 10) {
    betInput.readOnly = false;
    betInput.value = '';
    betInput.focus();
    logDiv.textContent = '';
  }

  if (time === 0) {
    betInput.readOnly = true;
    betInput.value = '';
    if (currentBet > 0) {
      socket.emit('bet', currentBet);
      currentBet = 0;
    }
  }
});


socket.on('round', round => {
  roundSpan.textContent = round;
});


socket.on('players', players => {
  playerTableBody.innerHTML = '';
  for (const id in players) {
    const p = players[id];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.money.toFixed(0)}</td>
      <td>${p.lastBet.toFixed(0)}</td>
      <td style="color:${p.change >= 0 ? 'green' : 'red'}">${p.change >= 0 ? '+' : ''}${p.change.toFixed(0)}</td>
    `;
    playerTableBody.appendChild(tr);

    if (id === myId) {
      myMoney = p.money;
      myMoneySpan.textContent = myMoney.toFixed(0);
    }
  }
});

betInput.addEventListener('input', () => {
  const amount = Number(betInput.value);
  if (isNaN(amount) || amount <= 0 || amount > myMoney) {
    logDiv.textContent = '베팅 금액이 올바르지 않습니다.';
    currentBet = 0;
  } else {
    logDiv.textContent = '';
    currentBet = amount;
  }
});

socket.on('joinSuccess', () => {
  nicknameScreen.style.display = 'none';
  gameScreen.style.display = 'block';
});
