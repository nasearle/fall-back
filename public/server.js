"use strict";

// /**
//  * User sessions
//  * @param {Array} users
//  */
// const users = [];

// /**
//  * Find opponent for a user
//  * @param {User} user
//  */
// function findOpponent(user) {
// 	for (let i = 0; i < users.length; i++) {
// 		if (user !== users[i] && users[i].opponent === null) {
// 			new Game(user, users[i]).start();
// 		}
// 	}
// }

// /**
//  * Remove user session
//  * @param {User} user
//  */
// function removeUser(user) {
// 	users.splice(users.indexOf(user), 1);
// }

// /**
//  * Game class
//  */
// class Game {

// 	/**
// 	 * @param {User} user1
// 	 * @param {User} user2
// 	 */
// 	constructor(user1, user2) {
// 		this.user1 = user1;
// 		this.user2 = user2;
// 	}

// 	/**
// 	 * Start new game
// 	 */
// 	start() {
// 		this.user1.start(this, this.user2);
// 		this.user2.start(this, this.user1);
// 	}

// 	/**
// 	 * Is game ended
// 	 * @return {boolean}
// 	 */
// 	ended() {
// 		return this.user1.guess !== GUESS_NO && this.user2.guess !== GUESS_NO;
// 	}

// 	/**
// 	 * Final score
// 	 */
// 	score() {
// 		if (
// 			this.user1.guess === GUESS_ROCK && this.user2.guess === GUESS_SCISSORS ||
// 			this.user1.guess === GUESS_PAPER && this.user2.guess === GUESS_ROCK ||
// 			this.user1.guess === GUESS_SCISSORS && this.user2.guess === GUESS_PAPER
// 		) {
// 			this.user1.win();
// 			this.user2.lose();
// 		} else if (
// 			this.user2.guess === GUESS_ROCK && this.user1.guess === GUESS_SCISSORS ||
// 			this.user2.guess === GUESS_PAPER && this.user1.guess === GUESS_ROCK ||
// 			this.user2.guess === GUESS_SCISSORS && this.user1.guess === GUESS_PAPER
// 		) {
// 			this.user2.win();
// 			this.user1.lose();
// 		} else {
// 			this.user1.draw();
// 			this.user2.draw();
// 		}
// 	}

// }

// /**
//  * User session class
//  */
// class User {

// 	/**
// 	 * @param {Socket} socket
// 	 */
// 	constructor(socket) {
// 		this.socket = socket;
// 		this.game = null;
// 		this.opponent = null;
// 		this.guess = GUESS_NO;
// 	}

// 	/**
// 	 * Set guess value
// 	 * @param {number} guess
// 	 */
// 	setGuess(guess) {
// 		if (
// 			!this.opponent ||
// 			guess <= GUESS_NO ||
// 			guess > GUESS_SCISSORS
// 		) {
// 			return false;
// 		}
// 		this.guess = guess;
// 		return true;
// 	}

// 	/**
// 	 * Start new game
// 	 * @param {Game} game
// 	 * @param {User} opponent
// 	 */
// 	start(game, opponent) {
// 		this.game = game;
// 		this.opponent = opponent;
// 		this.guess = GUESS_NO;
// 		this.socket.emit("start");
// 	}

// 	/**
// 	 * Terminate game
// 	 */
// 	end() {
// 		this.game = null;
// 		this.opponent = null;
// 		this.guess = GUESS_NO;
// 		this.socket.emit("end");
// 	}

// 	/**
// 	 * Trigger win event
// 	 */
// 	win() {
// 		this.socket.emit("win", this.opponent.guess);
// 	}

// 	/**
// 	 * Trigger lose event
// 	 */
// 	lose() {
// 		this.socket.emit("lose", this.opponent.guess);
// 	}

// 	/**
// 	 * Trigger draw event
// 	 */
// 	draw() {
// 		this.socket.emit("draw", this.opponent.guess);
// 	}

// }

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
    // TODO: clean up
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

// class Bullet extends Entity {
//     constructor(id) {
//         super(id);
//     }
// }

setInterval(() => {
  // TODO: rename
  const pack = Player.updatePlayers();
  io.emit('newPosition', pack);
}, 1000 / 25);

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
    SOCKETS[socket.id] = socket;
    console.log(`A user connected (${socket.id})`);

    Player.onConnect(socket);

    socket.emit('currentPlayers', Player.players)

    socket.on('disconnect', () => {
      // Note: disconnect event doesn't accept "socket" argument
      console.log(`User disconnected (${socket.id})`);
      delete SOCKETS[socket.id];
      Player.onDisconnect(socket);
    });

		// const user = new User(socket);
		// users.push(user);
		// findOpponent(user);

		// socket.on("disconnect", () => {
		// 	console.log("Disconnected: " + socket.id);
		// 	removeUser(user);
		// 	if (user.opponent) {
		// 		user.opponent.end();
		// 		findOpponent(user.opponent);
		// 	}
		// });

		// socket.on("guess", (guess) => {
		// 	console.log("Guess: " + socket.id);
		// 	if (user.setGuess(guess) && user.game.ended()) {
		// 		user.game.score();
		// 		user.game.start();
		// 		storage.get('games', 0).then(games => {
		// 			storage.set('games', games + 1);
		// 		});
		// 	}
		// });

		// console.log("Connected: " + socket.id);
	},

	// stat: (req, res) => {
	// 	storage.get('games', 0).then(games => {
	// 		res.send(`<h1>Games played: ${games}</h1>`);
	// 	});
	// }

};