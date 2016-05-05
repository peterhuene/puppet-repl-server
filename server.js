var ws = require('ws');
var http = require('http');
var express = require('express');
var pty = require('pty');
var morgan = require('morgan');

var app = express();
app.use(morgan('short'));
app.use(express.static(__dirname + '/static'));
var server = http.createServer(app);

var port = process.env.PORT || 8080;
console.log('listening at http://0.0.0.0:%d', port);
server.listen(port);

var socketServer = new ws.Server({host: '0.0.0.0', server: server});

socketServer.on('connection', function (socket) {
  var client = socket._socket.remoteAddress + ':' + socket._socket.remotePort;

  console.log(client + ' connected a web socket.');

  var process = pty.spawn(
    'puppetcpp',
    [
      'repl',
      '-nrepl',
      '--trace',
      '--no-history',
      '--verbose'
    ],
    {
      name: 'xterm-256color',
      cols: 80,
      rows: 30
    }
  );
  console.log(client + ' spawned REPL process ' + process.pid + '.');

  socket.on('close', function () {
    console.log(client + ' disconnected from the web socket.');
    process.kill();
  });

  socket.on('message', function (data) {
    process.stdin.write(data);
  });

  process.stdout.on('data', function (data) {
    socket.send(data);
  });

  process.on('exit', function (code) {
    console.log(client + ' REPL process ' + process.pid + ' exited with ' + code + '.');
    socket.close();
  });
});
