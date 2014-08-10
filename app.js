var http = require('http');
var crypto = require('crypto');

// save all clients to an array
var clients = [];

// create server
var server = http.createServer();

server.on('request', function (req, res) {
  // if the server receives a regular request, you can respond here...
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello request');
});

// when connection to server is made
server.on('connection', function (socket) {
 // add socket to array so you can send to all clients connected
 // also allows for you do send to all except sender, etc
 clients.push(socket)

 // from here, listen on socket events.
 // on data (received from client)
 socket.on('data', function (data) {
  // decode the message with mask
  var decodedMessage = decodeWebSocket(data);

  // console.log(decodedMessage) will show you the plaintext of the msg sent from the client

  // then send it back to client (for whatever you want)
  send.call(socket, decodedMessage);
 });
});

// when server gets `upgrade` request
server.on('upgrade', function (req, socket, head) {
 var key = req.headers['sec-websocket-key'];
 // send handshake info to client
 handshake.call(socket, key);
});

// TODO: find out more about he ping pong stuff that they do

server.listen(5000);
console.log('Listening on *:5000');

function deriveWebSocketAccept(key) {
  // for info about deriving an `accept` string, see https://developer.mozilla.org/en-US/docs/WebSockets/Writing_WebSocket_servers#Server_Handshake_Response
  var magicString = key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  var hash = crypto.createHash('sha1').update(magicString).digest('base64');
  return hash;
}

function handshake(key) {
  // this is set from .call() method - method.call(this, arg1, arg2, etc...)
  var socket = this;

  // set accept to base64 encoding of sha1 hash of key sent from client
  var accept = deriveWebSocketAccept(key);

  // set headers to send to client
  var headers = 'HTTP/1.1 101 Switching Protocols\r\n' +
         'Upgrade: Websocket\r\n' +
         'Connection: Upgrade\r\n' +
         'Sec-WebSocket-Accept: '+ accept +'\r\n' +
         '\r\n';

  // send headers to client to upgrade to ws protocol
  socket.write(headers);
}

function send(msg) {
  // http://stackoverflow.com/questions/8214910/node-js-websocket-send-custom-data
  var socket = this;
  var newFrame = new Buffer(msg.length > 125 ? 4 : 2);
  newFrame[0] = 0x81;
  if (msg.length > 125) {
    newFrame[1] = 126;
    var length = msg.length;
    newFrame[2] = length >> 8;
    newFrame[3] = length & 0xFF;
  }
  else {
    newFrame[1] = msg.length;
  }
  socket.write(newFrame, 'binary');
  socket.write(msg, 'utf8');
}


function decodeWebSocket (data){
  var datalength = data[1] & 127;
  var indexFirstMask = 2;
  if (datalength == 126) {
  indexFirstMask = 4;
  } else if (datalength == 127) {
  indexFirstMask = 10;
  }
  var masks = data.slice(indexFirstMask,indexFirstMask + 4);
  var i = indexFirstMask + 4;
  var index = 0;
  var output = "";
  while (i < data.length) {
  output += String.fromCharCode(data[i++] ^ masks[index++ % 4]);
  }
  return output;
}