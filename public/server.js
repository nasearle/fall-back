"use strict";

const SOCKETS = {};

class Entity {
  constructor() {
    this.id = '';
    this.x = 250;
    this.y = 250;
    this.speedX = 0;
    this.speedY = 0;
  }
  update() {
    this.updatePosition();
  }
  updatePosition() {
    this.x += this.speedX;
    this.y += this.speedY;
  }
}

class Player extends Entity {
  constructor(id) {
    super();
    this.id = id;
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.maxSpeed = 10;
    // Add player to "global" players object
    Player.players[id] = this;
  }
  update() {
    this.updateSpeed();
    super.update();
  }
  updateSpeed() {
    if (this.pressingRight) {
      this.speedX = this.maxSpeed;
    } else if (this.pressingLeft) {
      this.speedX = -this.maxSpeed;
    } else {
      this.speedX = 0;
    }

    if (this.pressingUp) {
      this.speedY = -this.maxSpeed;
    } else if (this.pressingDown) {
      this.speedY = this.maxSpeed;
    } else {
      this.speedY = 0;
    }
  }
  setPressingKey(inputId, state) {
    if (inputId == 'right') {
      this.pressingRight = state;
    } else if (inputId == 'left') {
      this.pressingLeft = state;
    } else if (inputId == 'up') {
      this.pressingUp = state;
    } else if (inputId == 'down') {
      this.pressingDown = state;
    }
  }
  static onConnect(socket) {
    const player = new Player(socket.id);
    socket.on('keyPress', data => {
      player.setPressingKey(data.inputId, data.state); // e.g. 'right', true
    });
  }
  static onDisconnect(socket) {
    delete Player.players[socket.id];
  }
  static updatePlayers() {
    const pack = [];
    for (let id in Player.players) {
      let player = Player.players[id];
      player.update();
      pack.push({
        id: player.id,
        x: player.x,
        y: player.y,
      });
    }
    return pack;
  }
}
// Static properties (not available in JavaScript I believe)
Player.players = {};


// Game loop
setInterval(() => {
  const pack = Player.updatePlayers();
  io.emit('newPosition', pack);
}, 1000 / 25);


/* Exported objects here are configured as Express routes by index.js, which
runs the game server in a sandboxed environment (supplied by the competition) */
module.exports = {

  /* Example:

  statistics: (req, res) => {
    // define regular express route here for /statistics
    storage.get('games', 0).then(games => {
    	res.send(`<h1>Games played: ${games}</h1>`);
    });
  }

  */

  /* The "io" object is special - it's not configured as an Express route, but
  rather set as the handler for the web socket 'connect' event. This represents
  the first time a client connects via socket. We will define all other socket
  event listeners here (since it's the first time we will have access to the
  user's socket) */
	io: (socket) => {

    // Add client/player to a global "list" of sockets
    SOCKETS[socket.id] = socket;
    console.log(`A user connected (${socket.id})`);

    // Call the player's onConnect method to init a new player
    Player.onConnect(socket);

    // Update all clients with current players data
    socket.emit('currentPlayers', Player.players);

    socket.on('disconnect', () => {
      // Note: disconnect event doesn't accept "socket" argument
      console.log(`User disconnected (${socket.id})`);
      delete SOCKETS[socket.id];
      Player.onDisconnect(socket);
    });
	}
};