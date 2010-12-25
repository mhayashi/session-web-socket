// 次にクライアント側を見ていきます。

// SessionWebSocket で、トークンのやりとりをしてから、 'message' に対するイベントハンドラをバインドします。
SessionWebSocket(function(socket){
	socket.on('message',function(msg){
		console.log("SWS:",msg);
  });

  // セッションが確立した場合、このメッセージは受信されます。
  setInterval(function() {
    socket.send('Succeed!');
  }, 1000);
});

// セキュアでないコネクションを示すための例です。こちらで送信したメッセージは弾かれます。
var socket = new io.Socket()
socket.connect();
socket.send("OH NOES");
