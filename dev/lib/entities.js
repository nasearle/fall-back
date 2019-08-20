const initPack = { players: [], enemies: [], bullets: [] };
const removePack = { players: [], enemies: [], bullets: []};

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
  static getFrameUpdateData() {
    const packs = {
      initPack: {
        players: initPack.players,
        enemies: initPack.enemies,
        bullets: initPack.bullets,
      },
      removePack: {
        players: removePack.players,
        enemies: removePack.enemies,
        bullets: removePack.bullets,
      },
      updatePack: {
        players: Player.updatePlayers(),
        enemies: Enemy.updateEnemies(),
        bullets: Bullet.updateBullets(),
      },
    };
    initPack.players = [];
    initPack.enemies = [];
    initPack.bullets = [];
    removePack.players = [];
    removePack.enemies = [];
    removePack.bullets = [];
    return packs;
  }
}

class Bullet extends Entity {
  constructor(config) {
    super();
    this.id = generateId(); // TODO: will need to do something more unique
    this.parent = config.parent;
    this.angle = config.angle;
    this.x = config.x;
    this.y = config.y;
    this.speedX = Math.cos((config.angle / 180) * Math.PI) * 10;
    this.speedY = Math.sin((config.angle / 180) * Math.PI) * 10;
    this.timer = 0;
    this.toRemove = false;
    Bullet.bullets[this.id] = this;
  }
  update() {
    if (this.timer++ > 100) {
      this.toRemove = true;
    }
    super.update();
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  };
  static updateBullets() {
    const pack = [];
    for (let id in Bullet.bullets) {
      let bullet = Bullet.bullets[id];
      bullet.update();
      if (bullet.toRemove) {
        delete Bullet.bullets[id];
        removePack.bullets.push(bullet.id);
      } else {
        pack.push(bullet.getUpdatePack());
      }
    }
    return pack;
  }
}
Bullet.bullets = {};

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
    this.pressingShoot = false;
    this.mouseAngle = 0;
    this.maxSpeed = 10;
    this.hp = 10;
    this.hpMax = 10;
    this.score = 0;
    // Add player to "global" players object
    Player.players[id] = this;
  }
  update() {
    this.updateSpeed();
    super.update();

    if (this.pressingShoot) { // only happens if the click is down during an update loop
      this.shootBullet(this.mouseAngle);
    }
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
  shootBullet(angle) {
    new Bullet({
      parent: this.id,
      angle: angle,
      x: this.x,
      y: this.y,
    });
  };
  setPressingKey(inputId, state) {
    if (inputId == 'right') {
      this.pressingRight = state;
    } else if (inputId == 'left') {
      this.pressingLeft = state;
    } else if (inputId == 'up') {
      this.pressingUp = state;
    } else if (inputId == 'down') {
      this.pressingDown = state;
    } else if (inputId === 'shoot') {
      this.pressingShoot = state;
    } else if (inputId === 'mouseAngle') {
      const mouseX = state.x;
      const mouseY = state.y;
      const x = -this.x + mouseX - 8; // TODO: replace hard-coded canvas margin
      const y = -this.y + mouseY - 8; // TODO: replace hard-coded canvas margin
      const angle = (Math.atan2(y, x) / Math.PI) * 180;
      this.mouseAngle = angle;
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
