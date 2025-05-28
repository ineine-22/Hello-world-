//express 웹 서버 생성.
//http 서버를 express 앱과 함께 생성.
//socket.io를 이 http 서버에 붙여서 웹소켓 통신 준비.
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//public 폴더 안에 있는 정적 파일들(html, js, css)을 클라이언트에 서비스함.
app.use(express.static('public'));

const players = {};
let rm = 1; //랜덤 배당률 변수 random multiplier

let ct = 10; // 게임의 카운트다운 변수 countdow
let t = 1; // 게임의 회차 변수 time


// 랜덤 배당률을 생성하는 함수
function makeRM() {
  const r = Math.floor(Math.random() * 101);
  if (r >= 98) return 10.0;
  else if (r >= 90) return 5.0;
  else if (r >= 70) return 2.0;
  else if (r >= 50) return 1.5;
  else if (r >= 30) return 0.5;
  else if (r >= 10) return 0.25;
  else if (r >= 2) return 0.1;
  else return 0.0;
}



function startGameLoop() {
  ct = 10; //초기값 10초 세팅 후 클라이언트에 전송(emit)
  io.emit('countdown', ct);
  io.emit('round', t);



  //타임 루프의 핵심. 
  const interval = setInterval(() => {

    //1초마다 countdown 감소 및 클라이언트에 전송.
    ct--;
    io.emit('countdown', ct);

    if (ct <= 0) {

      clearInterval(interval); //타이머 정지.

      // 배당률을 생성.
      rm = makeRM(); //

      io.emit('multiplier', rm);

      //모든 플레이어를 순회하면서
      for (const id in players) {
        const player = players[id];

        // 만약 플레이어가 이번 라운드에 베팅한 금액이 있으면
        if (player.pendingBet > 0) {
          // 베팅금액에 배당률을 곱해 수익을 계산합니다.
          const profit = player.pendingBet * rm;
          // 플레이어의 자산에 수익을 더합니다.
          player.money += profit;
          // 이번 라운드 순이익 (수익 - 베팅금액)을 저장합니다.
          player.change = profit - player.pendingBet;
          // 이번 라운드 베팅금액을 저장합니다 (기록용).
          player.lastBet = player.pendingBet;
          // 베팅 대기금액을 0으로 초기화해서 다음 라운드를 준비합니다.
          player.pendingBet = 0;
        } else {
          // 베팅하지 않은 플레이어는 변화량과 베팅기록을 0으로 초기화합니다.
          player.change = 0;
          player.lastBet = 0;
        }
      }

      // 업데이트된 플레이어 정보(자산, 베팅기록, 변화량 등)를 클라이언트들에게 전송합니다.
      io.emit('players', players);

      t++; // 회차 증가
      startGameLoop(); // 다음 게임 루프 시작
    }
  }, 1000); // 1초(1000밀리초) 간격으로 위 작업 반복
}


//이 코드는 클라이언트가 소켓을 통해 서버에 접속했을 때 실행
io.on('connection', socket => {

  
  console.log('User connected:', socket.id);

  socket.on('join', name => {
    //이름, 자산, 베팅금, 베팅 예정금액, 최근 수익/손실실
    players[socket.id] = { name, money: 100000, lastBet: 0, bm: 0, change: 0 };
    
    socket.emit('multiplier', rm);
    socket.emit('countdown', ct);
    socket.emit('round', t);

    //전체 접속자에게 플레이어 목록(닉네임, 자산 등)을 전송하여 갱신합니다.
    io.emit('players', players);
    
    //클라이언트에게 입장 완료 신호를 보냅니다. 클라이언트는 이를 받아 nickname-screen을 숨기고 게임 화면을 보이게 할 수 있습니다.
    socket.emit('joinSuccess');
  });


  //클라이언트가 bet 이벤트로 금액을 전송했을 때 실행됩니다
  socket.on('bet', amount => {

    //해당 소켓 ID로 등록된 플레이어가 있는지 확인합니다.
    const player = players[socket.id];
    if (!player) return;


    if (amount <= 0 || amount > player.money) {
      socket.emit('betError', '베팅 금액이 올바르지 않습니다.');
      return;
    }

    
    player.pendingBet = amount;
    player.money -= amount;
    io.emit('players', players);
  });

  //사용자가 웹페이지를 닫거나 연결이 끊어졌을 때 실행됩니다.
  //해당 소켓 ID로 등록된 플레이어 정보를 players에서 제거.
  //전체 클라이언트에게 변경된 플레이어 목록을 다시 전송.
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
