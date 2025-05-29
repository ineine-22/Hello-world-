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

let localCountdown = 10;
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
  currentMultiplierSpan.textContent = multiplier.toFixed(1);
});



socket.on('countdown', time => {
  localCountdown = time;

  if (time === 10) {
    betInput.disabled = false;
    betInput.value = '';
    logDiv.textContent = '';

  } else if (time === 0) {
    betInput.disabled = true;
    const betAmount = Number(betInput.value);
    if (!isNaN(betAmount) && betAmount > 0 && betAmount <= myMoney) {
      socket.emit('bet', betAmount);
    }
    betInput.value = '';
  }

  timer0_1(localCountdown);
});



socket.on('players', players => {
  playerTableBody.innerHTML = '';
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.money - a.money);
  let rank = 1;

  for (const [id, p] of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${rank++}</td>
      <td>${p.name}</td>
      <td>${p.money.toFixed(0)}</td>
      <td>${p.input.toFixed(0)}</td>
      <td>${p.output.toFixed(0)}</td>
    `;
    playerTableBody.appendChild(tr);

    if (id === myId) {
      myMoney = p.money;
      myMoneySpan.textContent = myMoney.toFixed(0);
    }
  }
});


//서버로부터 참가 승인 받으면 닉네임 화면 숨기고 게임 화면 보여줌
socket.on('joinSuccess', () => {
  nicknameScreen.style.display = 'none';
  gameScreen.style.display = 'block';


  //0.1초 단위로 남은 시간을 부드럽게 표시하기 위한 클라이언트 내부 타이머 시작
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (localCountdown > 0) {
      localCountdown -= 0.1;
      if (localCountdown < 0) localCountdown = 0;
      timer0_1(localCountdown);
    }
  }, 100);
});

function timer0_1(time) {
  timeBar.value = time;
  timeText.textContent = `${time.toFixed(1)}초`;
}

nicknameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') joinBtn.click();
});

socket.on('betStatus', (canBet) => {
  inputField.disabled = !canBet;
});
