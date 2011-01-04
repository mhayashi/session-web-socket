SessionWebSocket(function(socket){
	socket.on('message',function(msg){
		console.log("SWS:",msg);
  });

  setTimeout(function() {
    socket.send('Succeed!');
  }, 1000);
});

var socket = new io.Socket()
socket.connect();
socket.send("OH NOES");
