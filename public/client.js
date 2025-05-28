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
const roundNumberSpan = document.getElementById('round-number');

let myId = null;
let myMoney = 0;

let serverCountdown = 10; // 서버가 알려주는 카운트다운 (초 단위)
let localCountdown = 10; // 클라이언트가 0.1초 단위로 감소시키는 카운트다운 (초 단위, 소수점 포함)
let countdownInterval = null;

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

socket.on('round', round => {
  roundNumberSpan.textContent = round;
});

socket.on('multiplier', multiplier => {
  currentMultiplierSpan.textContent = multiplier.toFixed(2);
});

socket.on('countdown', time => {
  serverCountdown = time;
  localCountdown = time; // 서버 카운트다운을 받으면 로컬 카운트다운을 맞춤

  // 입력 활성화/비활성화 처리
  if (time === 10) {
    betInput.disabled = false;
    betInput.value = '';
    logDiv.textContent = '';
  } else if (time === 0) {
    betInput.disabled = true;

    // 베팅 금액 서버에 일괄 전송
    const betAmount = Number(betInput.value);
    if (!isNaN(betAmount) && betAmount > 0 && betAmount <= myMoney) {
      socket.emit('bet', betAmount);
    }
    betInput.value = '';
  }

  updateTimeDisplay(localCountdown);
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

socket.on('joinSuccess', () => {
  nicknameScreen.style.display = 'none';
  gameScreen.style.display = 'block';

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (localCountdown > 0) {
      localCountdown -= 0.1;
      if (localCountdown < 0) localCountdown = 0;
      updateTimeDisplay(localCountdown);
    }
  }, 100);
});

function updateTimeDisplay(time) {
  timeBar.value = time;
  timeText.textContent = `${time.toFixed(1)}초`;
}

nicknameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    joinBtn.click();
  }
});
