const socket = io();

const nicknameScreen = document.getElementById('nickname-screen');
const gameScreen = document.getElementById('game-screen');
const nicknameInput = document.getElementById('nickname-input');
const codeInput = document.getElementById('code-input');
const joinBtn = document.getElementById('join-btn');
const currentMultiplierSpan = document.getElementById('current-multiplier');
const playerTableBody = document.getElementById('player-table-body');
const timeBar = document.getElementById('time-bar');
const timeText = document.getElementById('time-text');
const myMoneySpan = document.getElementById('my-money');
const betInput = document.getElementById('bet-input');
const logDiv = document.getElementById('log');
const roundNumberSpan = document.getElementById('round-number');
const unitSelect = document.getElementById('unit-select');

let myId = null;
let myMoney = 0;
let localCountdown = 8;
let countdownInterval = null;

joinBtn.addEventListener('click', () => {
  const name = nicknameInput.value.trim();
  const code = codeInput.value.trim();
  if (!name || !code) {
    alert('닉네임과 재접속 코드를 모두 입력하세요.');
    return;
  }
  socket.emit('join', { name, code });
});

socket.on('connect', () => {
  myId = socket.id;
});

socket.on('round', round => {
  roundNumberSpan.textContent = round;
});

socket.on('multiplier', multiplier => {
  currentMultiplierSpan.textContent = multiplier.toFixed(1);
});

socket.on('countdown', time => {
  localCountdown = time;
  if (time === 8) {
    betInput.disabled = false;
    betInput.value = '';
    logDiv.textContent = '';
  } else if (time === 0) {
    betInput.disabled = true;
    const unit = parseInt(unitSelect.value);
    const value = parseFloat(betInput.value);
    const betAmount = value * unit;
    if (!isNaN(betAmount) && betAmount > 0 && betAmount <= myMoney) {
      socket.emit('bet', betAmount);
    }
    betInput.value = '';
  }
  updateTimer(localCountdown);
});

socket.on('players', players => {
  playerTableBody.innerHTML = '';
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.money - a.money);
  let rank = 1;

  for (const [id, p] of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${rank++}</td>
      <td>${p.name} (${p.id})</td>
      <td>${formatKoreanNumber(p.money)}</td>
      <td>${formatKoreanNumber(p.input)}</td>
      <td>${formatKoreanNumber(p.output)}</td>
    `;
    playerTableBody.appendChild(tr);

    if (id === myId) {
      myMoney = p.money;
      myMoneySpan.textContent = formatKoreanNumber(myMoney);
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
      updateTimer(localCountdown);
    }
  }, 100);
});

function updateTimer(time) {
  timeBar.value = time;
  timeText.textContent = `${time.toFixed(1)}초`;
}

nicknameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') joinBtn.click();
});
codeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') joinBtn.click();
});

function formatKoreanNumber(num) {
  if (num === 0) return '0원';
  let result = '';
  const units = ['원', '만', '억', '조', '경'];
  let unitIndex = 0;

  while (num > 0) {
    const chunk = num % 10000;
    if (chunk > 0) {
      result = `${chunk.toLocaleString()}${units[unitIndex]} ${result}`;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }

  return result.trim();
}
