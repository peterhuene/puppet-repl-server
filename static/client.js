document.addEventListener('DOMContentLoaded', function() {
  const CYAN = '\x1b[0;36m';
  const RED = '\x1b[0;31m';
  const RESET = '\x1b[0m';

  var colorize = function (color, message) {
    return color + message + RESET;
  };

  hterm.defaultStorage = new lib.Storage.Local();
  var term = new hterm.Terminal();
  term.decorate(document.getElementById('terminal'));
  term.installKeyboard();
  term.prefs_.set('ctrl-c-copy', true);
  term.prefs_.set('ctrl-v-paste', true);
  term.prefs_.set('use-default-window-copy', true);

  var finish = function () {
    socket = null;
    term.setCursorVisible(false);
    term.uninstallKeyboard();
  };

  term.onTerminalReady = function () {
    term.setCursorPosition(0, 0);
    term.setCursorVisible(true);

    var host = location.origin.replace(/^http/, 'ws').replace(/^https/, 'wss');
    var io = term.io.push();
    var socket = null;

    io.onVTKeystroke = function (str) {
      if (!socket) {
        return;
      }
      socket.send(str);
    };

    io.sendString = function (str) {
      if (!socket) {
        return;
      }
      socket.send(str);
    };

    io.println(colorize(CYAN, 'Connecting Puppet REPL socket at ' + host + '...'));
    socket = new WebSocket(host);

    socket.onopen = function () {
      io.println(colorize(CYAN, 'Connected!'));
      io.println(colorize(CYAN, 'Use this terminal to evaluate some Puppet code.'));
      io.println(colorize(CYAN, 'To clear the screen, hit Ctrl-l.'));
      io.println(colorize(CYAN, 'To close the session, type "exit" followed by <ENTER>, or simply close your web browser.'));
      io.println(colorize(CYAN, 'To start a new session, refresh the page.'));
    };

    socket.onclose = function () {
      io.println('');
      io.println(colorize(CYAN, 'Disconnected from Puppet REPL socket.'));
      io.println(colorize(CYAN, 'Please refresh the page to start a new session.'));
      finish();
    };

    socket.onmessage = function (event) {
      io.writeUTF8(event.data);
    };

    socket.onerror = function () {
      io.println('');
      io.println(colorize(RED, 'Could not connect Puppet REPL socket.'));
      io.println(colorize(RED, 'Please refresh the page to try again.'));
      finish();
    };
  };
}, false);
