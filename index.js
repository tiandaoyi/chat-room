const Websocket = require("ws");
const uuid = require("uuid"); //引入创建唯一id模块

const ws = new Websocket.Server({ port: 3000 }, () => {
  console.log("socket 服务器启动");
});

// 客户端列表
const clients = [];
let clientIndex = 1;

// 建立连接
ws.on("connection", (client) => {
  // 存储客户端对象
  const id = uuid.v4();
  console.log(`client ${id} connected`);
  let nickname = `用户${clientIndex++}`;
  clients.push({
    id,
    ws: client,
    nickname,
  });

  // 发送消息
  sendSocketMessage();

  /*监听消息*/
  client.on("message", (message) => {
    message = JSON.parse(message);
    // 昵称修改
    if (message.indexOf("/nick") === 0) {
      const nicknameArray = message.split(" ")
      if (nicknameArray.length >= 2) {
        const nicknameMessage = `${nickname} 修改昵称为 ${nicknameArray[1]}`;
        nickname = nicknameArray[1];
        broadcastSend("nickUpdate", nicknameMessage, nickname);
      }
    } else {
      // 消息发送
      broadcastSend("message", message, nickname);
    }
  });

  /*监听断开连接*/
  client.on("close", function () {
    closeSocket();
  });

  /**
   * 关闭服务，从客户端监听列表删除
   */
  function closeSocket() {
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id == id) {
        // 发送消息
        broadcastSend("notification", "退出了", nickname);
        clients.splice(i, 1);
      }
    }
  }

  /**
   * 开启服务，发送消息
   */
  function sendSocketMessage() {
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id == id) {
        // 发送消息
        broadcastSend("notification", "来了", nickname);
      }
    }
  }
});

/**
 * 广播所有客户端消息
 * @param  {String} type     广播方式(notification, message)
 * @param  {String} message  消息
 * @param  {String} nickname 用户昵称，广播方式为admin时可以不存在
 */
function broadcastSend(type, message, nickname) {
  // 遍历所有的客户端，如果连接中
  clients.forEach((v) => {
    if (v.ws.readyState === v.ws.OPEN) {
      v.ws.send(
        JSON.stringify({
          type: type,
          nickname: nickname,
          message: message,
        })
      );
    }
  });
}
