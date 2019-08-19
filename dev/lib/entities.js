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

class Enemy extends Entity {
  constructor(id, x) {
    super();
    this.id = id;
    this.x = x;
    this.y = -5; // Just beyond top of screen, TODO: should be related to sprite height
    // Keep speed low and march chance high for smoother movement?
    this.maxSpeed = 5;
    // Add player to "global" enemies object
    Enemy.enemies[id] = this;
    console.log('New enemy:', this);
  }
  update() {
    this.updateSpeed();
    super.update();
  }
  updateSpeed() {
    // For now, enemies simply march down randomly
    if (Math.random() <= Enemy.chanceToMarch) {
      this.speedY = this.maxSpeed;
    } else {
      this.speedY = 0;
    }
  }
  static updateEnemies() {

    // Periodically generate new enemies
    const numEnemies = Object.keys(Enemy.enemies).length; // could cache this
    if (Math.random() <= Enemy.chanceToGenerate && numEnemies < Enemy.numCap) {
      const id = generateId();
      // TODO: enemy x depends on viewport width which will vary between clients...
      const x = getRandomInt(0, 500);
      new Enemy(id, x);
    }

    // Increase enemy generation rate
    Enemy.chanceToGenerate += Enemy.generationGradient;

    /* TODO: remove enemies so they dont accumulate?
    will they *always* be defeated by player? */

    const pack = [];
    for (let id in Enemy.enemies) {
      let enemy = Enemy.enemies[id];
      enemy.update();
      pack.push({
        id: enemy.id,
        x: enemy.x,
        y: enemy.y,
      });
    }
    return pack;
  }
}
Enemy.enemies = {};
// Chance is twice per second
Enemy.chanceToMarch = 2 / FPS;
// Chance is once per 5 seconds
Enemy.chanceToGenerate = 1 / (5 * FPS);
// How fast the *rate* of enemy generation increase: 5% increase every 15 seconds
Enemy.generationGradient = (Enemy.chanceToGenerate * 0.05) * (1 / (15 * FPS));
// Don't want too many enemies on screen or in memory
Enemy.numCap = 50;

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

/* Not using module.exports because require() is unavailable in the sandbox environment */
// module.exports = {
//   Player: Player,
// };
