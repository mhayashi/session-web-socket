var util = require('util');
// では、いよいよセッション管理のミドルウェアについて見ていきます。

// 関数を exports にセットしています。先ほどアプリケーション側で require したときに呼んでいました。引数からオプションを受け取るために関数にしていたわけですね。
module.exports = function verifier(options)
{
  // デフォルトの設定です。セッションの生存期間 (ttl = time to live) を設定しています。
  var defaults = {
    ttl: 30*1000 // 30 秒
  };
  // 引数でもらったオプションを反映させています。
  for (var k in options) {
    defaults[k] = options[k];
  }
  // 複数のセッションを扱うためのオブジェクトです。
  var session_jar = {};

  // この関数は、セッションのトークンを発行するミドルウェアと、 WebSocket 用のセッション管理の関数をプロパティにもつオブジェクトを返します。
  return {
    // 先ほど createServer に渡していたミドルウェアです。
    // リクエストオブジェクト、レスポンスオブジェクト、next という関数を引数にとる、というのが決められたインターフェースです。
    http:function give_token(req, res, next) {

      // リクエストのヘッダを参照し、 'x-access-request-token' フィールドが 'simple' だったらトークンを生成します。
      if (req.headers["x-access-request-token"]) {
        if (req.headers["x-access-request-token"].toLowerCase()==="simple") {
          var token = Math.random();
          // ユニークな値をとれるまで繰り返します。
          while (session_jar[token]) {
            token = Math.random();
          }

          // トークンをキーとしてセッションデータと発行した日時を保存しています。 req.session は connect.session が生成したものです。
          var tmp = Date.now();
          session_jar[token] = {
            session: req.session,
            date: tmp,
            id: req.sessionID
          };
          // レスポンスを生成します。トークンと発行日時を JSON で返しています。
          res.writeHead(200);
          res.end('{"x-access-token": "'+token+';'+tmp+'"}');
          return;
        }
      }
      // 'x-access-request-token' フィールドがリクエストのヘッダにない場合は、このミドルウェアはやることがないので、 next を呼んで次のミドルウェアに処理をまかせます。
      if (next) {
        next();
      }
    }

    // こちらは WebSocket のセッションを管理する関数です。
    , ws: function attach_client(cb) {

      return function route_client(client) {

        // トークンの有効性をチェックする関数を定義します。
        function verify(token) {
          var tmp = session_jar[token];
          // セッションの期限切れをチェックしています。認証されたら削除しているので、トークンは１回だけしか使わない仕様になっています。
          if (tmp && tmp.date > Date.now() - defaults.ttl) {
            var session = tmp;
            delete session_jar[token];
            return session;
          }
          return false;
        }

        // 'message' に対するイベントハンドラを設定します。トークンをチェックしています。この関数を実行するのは最初にメッセージを受信したときだけです。
        client.once('message', function first_verify(msg) {
          // メッセージで渡されたトークンが有効な場合は、クライアントにセッションデータを設定して、'secure' イベントをクライアントに対して発行します。
          var session = verify(msg) || false;
          if (session) {
            client._session = session;
            client.session = session.session;
            client.emit("secure");

            // セッションが有効だったので、 client.on を元に戻して、退避しておいた 'message' に対するイベントハンドラをバインドします。退避する処理は下の方にでてきます。
            client.on = oldon;
            for (var i = 0, l = onmsgs.length; i < l; i++) {
              client.on('message', onmsgs[i]);
            }
          }
          // セッションデータがないので 'insecure' イベントをクライアントに対して発行します。
          else {
            client.emit("insecure");
          }
        });

        // 'message' イベントに対するイベントハンドラは、セッションが有効かどうかのチェックが済んだあとから実行されるようにしたいので、 client.on を 'message' イベントのハンドラだけ退避するように書き換えます。
        var onmsgs = [];
        var oldon = client.on;
        client.on = function(name, fn) {
          if (name === "message") onmsgs[onmsgs.length] = fn;
          else oldon.apply(this, arguments);
        };
        
        // 呼び出し元にクライアントを渡します。
        cb(client);
      };
    }
  };
};