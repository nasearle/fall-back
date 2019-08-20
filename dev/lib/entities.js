const initPack = { players: [], enemies: [], bullets: [] };
const removePack = { players: [], enemies: [], bullets: []};

class Entity {
  constructor() {
    this.id = '';
    this.x = 250;
    this.y = 250;
    this.speedX = 0;
    this.speedY = 0;
    // this.lastUpdateTime = new Date().getTime();
  }
  update() {
    this.updatePosition();
  }
  updatePosition() {
    // TODO: https://hackernoon.com/how-to-build-a-multiplayer-browser-game-4a793818c29b
    // const currentTime = new Date().getTime();
    // const timeDifference = currentTime - this.lastUpdateTime;
    // this.x += this.speedX * timeDifference;
    // this.y += this.speedY * timeDifference;
    this.x += this.speedX;
    this.y += this.speedY;
    // this.lastUpdateTime = currentTime;
  }
  getDistance(point) {
    return Math.sqrt(
      Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2)
    );
  };
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
    this.damage = config.damage; // comes from the Player, based on weapon
    this.toRemove = false;
    Bullet.bullets[this.id] = this;
  }
  update() {
    if (this.timer++ > 100) {
      this.toRemove = true;
    }
    super.update();
    for (let id in Enemy.enemies) {
      let enemy = Enemy.enemies[id];
      if (this.getDistance(enemy) < 32 && this.parent !== enemy.id) {
        enemy.hp -= this.damage;
        if (enemy.hp <= 0) { // enemy removal handled in Enemy class
          const shooter = Player.players[this.parent];
          if (shooter) {
            shooter.score += 100;
          }
        }
        this.toRemove = true;
      }
    }
    for (let id in Player.players) {
      let player = Player.players[id];
      const playerIds = Object.keys(Player.players);
      // no friendly fire ;)
      if (this.getDistance(player) < 32 && !playerIds.includes(this.parent)) {
        // TODO: update hard-coded distance
        player.hp -= this.damage;
        // TODO: move to Player class
        if (player.hp <= 0) {
          player.hp = player.hpMax;
          player.x = Math.random() * 500;
          player.y = Math.random() * 500;
        }
        this.toRemove = true;
      }
    }
  }
  setDamage(damage) {
    this.damage = damage;
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
    this.hp = 30;
    this.hpMax = 30;
    this.damage = 10;
    this.toRemove = false;
    // Add player to "global" enemies object
    Enemy.enemies[id] = this;
    console.log('New enemy:', this);
  }
  update() {
    if (this.hp <= 0) {
      this.toRemove = true;
    }
    this.updateSpeed();
    super.update();
    // For now, enemies simply shoot at a player randomly
    if (Math.random() <= Enemy.chanceToShoot) {
      const numPlayers = Object.keys(Player.players).length;
      // get a random player
      const player =
        Player.players[
          Object.keys(Player.players)[
            Math.floor(Math.random() * numPlayers)
          ]
        ];
      let x;
      let y;
      if (player) {
        x = -this.x + player.x - 8; // TODO: replace hard-coded canvas margin
        y = -this.y + player.y - 8; // TODO: replace hard-coded canvas margin
      } else {
        // TODO: make this more better
        x = -8; // TODO: replace hard-coded canvas margin
        y = -8 + 1; // TODO: replace hard-coded canvas margin
      }
      const angle = (Math.atan2(y, x) / Math.PI) * 180;
      this.shootBullet(angle);
    }
  }
  updateSpeed() {
    // For now, enemies simply march down randomly
    if (Math.random() <= Enemy.chanceToMarch) {
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
      damage: this.damage
    });
  };
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
  static updateEnemies() {
    // Periodically generate new enemies
    const numEnemies = Object.keys(Enemy.enemies).length; // could cache this
    if (Math.random() <= Enemy.chanceToGenerate && numEnemies < Enemy.numCap) {
      const id = generateId();
      // TODO: enemy x depends on viewport width which will vary between clients...
      // probably just want a "map" width
      const x = getRandomInt(0, 500);
      new Enemy(id, x);
    }

    // Increase enemy generation rate
    Enemy.chanceToGenerate += Enemy.generationGradient;

    /* TODO: remove enemies so they dont accumulate?
    will they *always* be defeated by player? 
    What if they walk past the players on the sides?*/

    const pack = [];
    for (let id in Enemy.enemies) {
      let enemy = Enemy.enemies[id];
      enemy.update();
      if (enemy.toRemove) {
        delete Enemy.enemies[id];
        removePack.enemies.push(enemy.id);
      } else {
        pack.push(enemy.getUpdatePack());
      }
    }
    return pack;
  }
}
Enemy.enemies = {};
// Chance is twice per second
Enemy.chanceToMarch = 2 / FPS;
// Chance is once per second
Enemy.chanceToShoot = 1 / FPS;
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
    this.hp = 100;
    this.hpMax = 100;
    this.damage = 10;  // can base this on the current weapon / power up
    this.coolDown = 400;  // can base this on the current weapon / power up
    this.timeLastShot = 0;
    this.score = 0;
    // Add player to "global" players object
    Player.players[id] = this;
  }
  update() {
    this.updateSpeed();
    super.update();

    const currentTime = new Date().getTime();
    const timeDifference = currentTime - this.timeLastShot;
    // Note: this.pressingShoot only triggered if the click is down during an update loop
    if (this.pressingShoot && timeDifference > this.coolDown) {
      this.shootBullet(this.mouseAngle);
      this.timeLastShot = currentTime;
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
      damage: this.damage
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
