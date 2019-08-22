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
  getAngle(point) {
    const x = -this.x + point.x - 8; // TODO: replace hard-coded canvas margin
    const y = -this.y + point.y - 8; // TODO: replace hard-coded canvas margin
    return (Math.atan2(y, x) / Math.PI) * 180;
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
    initPack.bullets.push(this.getInitPack());
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
        if (enemy.hp <= 0) {
          // enemy removal handled in Enemy class
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
        this.toRemove = true;
      }
    }
  }
  setDamage(damage) {
    this.damage = damage;
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
  static getAllInitPack() {
    const existingBullets = [];
    for (let id in Bullet.bullets) {
      existingBullets.push(Bullet.bullets[id].getInitPack());
    }
    return existingBullets;
  }
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
    initPack.enemies.push(this.getInitPack());
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
      const player = Player.getRandomPlayer();
      if (player) {
        const angle = this.getAngle(player);
        this.shootBullet(angle);
      }
    }
  }
  updateSpeed() {
    // For now, enemies simply march toward a player randomly
    if (Math.random() <= Enemy.chanceToMarch) {
      const player = Player.getRandomPlayer();
      if (player) {
        const angle = this.getAngle(player);
        this.speedX = Math.cos((angle / 180) * Math.PI) * this.maxSpeed;
        this.speedY = Math.sin((angle / 180) * Math.PI) * this.maxSpeed;
      }
    } else {
      this.speedX = 0;
      this.speedY = 0;
    }
  }
  shootBullet(angle) {
    new Bullet({
      parent: this.id,
      angle: angle,
      x: this.x,
      y: this.y,
      damage: this.damage,
    });
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp
    };
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp
    };
  }
  static getAllInitPack() {
    const existingEnemies = [];
    for (let id in Enemy.enemies) {
      existingEnemies.push(Enemy.enemies[id].getInitPack());
    }
    return existingEnemies;
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
    /* Potential solution: make enemies move towards player. can have them not
    come any closer than a certain radius or something */

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
    this.lives = 3;
    this.damage = 10; // can base this on the current weapon / power up
    this.coolDown = 400; // can base this on the current weapon / power up
    this.timeLastShot = 0;
    this.score = 0;
    this.toRemove = false;
    // Add player to "global" players object
    Player.players[id] = this;
  }
  update() {
    if (this.hp <= 0) {
      this.lives--;
      if (this.lives < 0) {
        this.toRemove = true;
      } else {
        this.hp = this.hpMax;
        this.x = Math.random() * 500;
        this.y = Math.random() * 150 + 350; // spawn in bottom part of map
      }
    }
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
      damage: this.damage,
    });
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
    } else if (inputId === 'shoot') {
      this.pressingShoot = state;
    } else if (inputId === 'mouseAngle') {
      this.mouseAngle = this.getAngle(state);
    }
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
      hpMax: this.hpMax,
      score: this.score
    };
  };
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
      score: this.score,
    };
  }
  static countPlayers() {
    return Object.keys(Player.players).length;
  }
  static getRandomPlayer() {
    const countPlayers = Player.countPlayers();
    return Player.players[
      Object.keys(Player.players)[Math.floor(Math.random() * countPlayers)]
    ];
  }
  static onConnect(socket) {
    const player = new Player(socket.id);
    socket.on('keyPress', data => {
      player.setPressingKey(data.inputId, data.state); // e.g. 'right', true
    });
    // Update new client with existing players, enemies, and bullets data
    socket.emit('init', {
      selfId: socket.id,
      players: Player.getAllInitPack(),
      enemies: Enemy.getAllInitPack(),
      bullets: Bullet.getAllInitPack(),
    });
    /** broadcast the new player to all other players once on creation instead
     * of adding the new player to the initPack in the constructor, to avoid
     * sending the new player its own info twice (once in the above 'init'
     * socket and once when the initPack containing the new player is sent to
     * the new player in the next loop) */
    socket.broadcast.emit('newPlayer', player.getInitPack());
  }
  static getAllInitPack() {
    const existingPlayers = [];
    for (let id in Player.players) {
      existingPlayers.push(Player.players[id].getInitPack());
    }
    return existingPlayers;
  }
  static onDisconnect(socket) {
    // 'if' to avoid the server crashing if the player died (already removed)
    const playerToRemove = Player.players[socket.id];
    if (playerToRemove) {
      playerToRemove.toRemove = true;
    }
  }
  static updatePlayers() {
    const pack = [];
    for (let id in Player.players) {
      let player = Player.players[id];
      player.update();
      if (player.toRemove) {
        delete Player.players[id];
        removePack.players.push(player.id);
      } else {
        pack.push(player.getUpdatePack());
      }
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
