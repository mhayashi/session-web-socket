// では、サーバ側のコードから見ていきます。

// 依存しているモジュールをインポートしています。インポートしているのは、 Connect, Socket.IO, SessionWebSocket です。
var connect = require("connect");
var io = require("socket.io");
var sws = require("../sws.js")();

// まずは Connect で Web サーバをつくります。 Connect は Web アプリケーション用のミドルウェアフレームワークです。決められたインターフェースに従ってつくられたアプリケーションを pluggable なミドルウェアとして扱うことができます。

// createServer の引数に渡しているのがミドルウェアです。
var server = connect.createServer(
  // HTTP のセッションを管理しています。
  connect.cookieDecoder(),
  connect.session(),
  // 今回の主役のひとり。セッションのトークンを発行します。
  sws.http,
  // これは静的ファイルを扱います。
  connect.staticProvider(__dirname+"/static")
);
// サーバをポート 8000 番で起動します。
server.listen(8000);

// 次に、 WebSocket のサーバを準備します。

// さきほどの Web サーバが WebSocket を扱えるようにしてやります。
var socket = io.listen(server);

// イベントハンドラを設定します。引数に渡している sws.ws がもうひとりの主役です。 WebSocket 側のセッションを管理しています。こんなふうにコールバックにコールバックを渡すあたりがたまらないですね。
socket.on('connection', sws.ws(function(client) {

  // 認証済みの場合のイベントハンドラです。セッション ID を出力してみます。
  client.on("secure", function() {
    console.log("SECURE");
    console.log(client.session.req.sessionID);
  });

  // 認証が済んでいない場合のイベントハンドラです。
  client.on("insecure", function() {
    console.log("INSECURE ACCESS");
  });

  // メッセージ受信時のイベントハンドラです。
  client.on("message", function(msg) {
    client.send(msg);
    console.log("MSG:"+msg);
  });
}));
