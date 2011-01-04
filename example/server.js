var connect = require("connect");
var io = require("socket.io");

//Import SessionWebSockets
//note: it is a function to allow multiple sessions able to be used
var sws = require("../sws.js")();

var server = connect.createServer(
  //sessions in connect use both cookieDecoder and session middleware
  connect.cookieDecoder(),
  connect.session(),
  //Attach our xhr handler for token requests
  sws.http,
  connect.staticProvider(__dirname+"/static")
);
//start listening
server.listen(8000);

var socket = io.listen(server);
socket.on('connection', sws.ws(function(client) {
  //the verification message for this will be blocked from being
  //sent to the client
  client.on("secure", function() {
    console.log("SECURE");
		//hail to the king!
    console.log(client.session.req.sessionID);
  });

  //This will not stop the message, but at least you know
  client.on("insecure", function() {
    console.log("INSECURE ACCESS");
  });

  client.on("message", function(msg) {
    client.send(msg);
    console.log("MSG:"+msg);
  });
}));
