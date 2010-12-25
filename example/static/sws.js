// 次に クライアントサイドのモジュールのコードです。トークンを取得して、返ってきたらコネクションを張り直します。

function SessionWebSocket(cb) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET","/?no-cache="+(new Date()+0));

  // トークンを取得するためのヘッダを設定します。
  xhr.setRequestHeader("x-access-request-token","simple");
  // レスポンスに対するコールバックを設定します。
  xhr.onreadystatechange = function xhrverify() {
    // 受信完了
    if (xhr.readyState === 4) {
      var tmp;
      try {
        // トークンが返ってきていたら、新規に WebSocket の接続を開始します。
        if (tmp = JSON.parse(xhr.responseText)["x-access-token"]) {
          var socket = new io.Socket();
          cb(socket);
          socket.connect();
          // 取得したトークンを送っています
          socket.send(tmp.split(";")[0]);
        }
      }
      catch(e) {
        throw new Error("XMLHttpResponse had non-json response, possible cache issue?")
      }
    }
  };

  // リクエストを送信します。
  xhr.send();
}