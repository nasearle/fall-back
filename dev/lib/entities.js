const initPack = { players: [], enemies: [], bullets: [], obstacles: [] };
const removePack = { players: [], enemies: [], bullets: [], obstacles: [] };

class Entity {
  constructor() {
    this.id = '';
    this.x = 250; //TODO: don't spawn player on obstacle
    this.y = 250; //TODO: don't spawn player on obstacle
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
  // TODO: make static
  getAngle(point) {
    const x = -this.x + point.x - 8; // TODO: replace hard-coded canvas margin
    const y = -this.y + point.y - 8; // TODO: replace hard-coded canvas margin
    return (Math.atan2(y, x) / Math.PI) * 180;
  }
  static overlaps(self, target) {
    return self.x < target.x + target.width &&
           self.x + self.width > target.x &&
           self.y < target.y + target.height &&
           self.y + self.height > target.y
  }
  static getFrameUpdateData() {
    const packs = {
      initPack: {
        players: initPack.players,
        enemies: initPack.enemies,
        bullets: initPack.bullets,
        obstacles: initPack.obstacles,
      },
      removePack: {
        players: removePack.players,
        enemies: removePack.enemies,
        bullets: removePack.bullets,
        obstacles: removePack.obstacles,
      },
      updatePack: {
        players: Player.updatePlayers(),
        enemies: Enemy.updateEnemies(),
        bullets: Bullet.updateBullets(),
        obstacles: Obstacle.updateObstacles(),
      },
    };
    initPack.players = [];
    initPack.enemies = [];
    initPack.bullets = [];
    initPack.obstacles = [];
    removePack.players = [];
    removePack.enemies = [];
    removePack.bullets = [];
    removePack.obstacles = [];
    return packs;
  }
}

class Obstacle extends Entity {
  constructor(config) {
    super();
      this.id = generateId();
      this.x = config.x;
      this.y = config.y;
      this.width = config.width;
      this.height = config.height;
      this.toRemove = false;
      this.speedY = -1;
      initPack.obstacles.push(this.getInitPack());
      Obstacle.obstacles[this.id] = this;
      console.log('New obstacle:', this);
  }
  update() {
    if (this.y < -this.height - 5) {
      this.toRemove = true;
    }
    super.update();
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
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
    const existingObstacles = [];
    for (let id in Obstacle.obstacles) {
      existingObstacles.push(Obstacle.obstacles[id].getInitPack());
    }
    return existingObstacles;
  }
  static updateObstacles() {
    // Periodically generate new obstacles

    if (Math.random() <= Obstacle.chanceToGenerate) {
      // TODO: obstacle x and y depend on viewport which will vary between clients...
      // probably just want a "map" width
      const x = getRandomInt(0, 500);
      const y = 505; // TODO: this will need to be below the viewport
      const height = getRandomInt(25, 100);
      const width = getRandomInt(25, 100);
      new Obstacle({
        x: x,
        y: y,
        height: height,
        width: width
      });
    }

    const pack = [];
    for (let id in Obstacle.obstacles) {
      let obstacle = Obstacle.obstacles[id];
      obstacle.update();
      if (obstacle.toRemove) {
        delete Obstacle.obstacles[id];
        removePack.obstacles.push(obstacle.id);
      } else {
        pack.push(obstacle.getUpdatePack());
      }
    }
    return pack;
  }
}
Obstacle.obstacles = {};
// Chance is once per 2 seconds
Obstacle.chanceToGenerate = 1 / (2 * FPS);

class Bullet extends Entity {
  constructor(config) {
    super();
    this.id = generateId(); // TODO: will need to do something more unique
    this.parent = config.parent;
    this.angle = config.angle;
    this.x = config.x;
    this.y = config.y;
    this.width = 10;
    this.height = 10;
    this.speedX = Math.cos((config.angle / 180) * Math.PI) * config.speedX;
    this.speedY = Math.sin((config.angle / 180) * Math.PI) * config.speedY;
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
    // TODO: quadtree
    for (let id in Enemy.enemies) {
      let enemy = Enemy.enemies[id];
      if (this.parent !== enemy.id && Entity.overlaps(this, enemy)) {
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
    // TODO: quadtree
    for (let id in Obstacle.obstacles) {
      let obstacle = Obstacle.obstacles[id];
      if (Entity.overlaps(this, obstacle)) {
        this.toRemove = true;
      }
    }
    // TODO: quadtree
    for (let id in Player.players) {
      let player = Player.players[id];
      const playerIds = Object.keys(Player.players);
      // no friendly fire ;)
      if (!playerIds.includes(this.parent) && Entity.overlaps(this, player)) {
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
    this.x = x;  //TODO: don't spawn on obstacle
    this.y = -5; // Just beyond top of screen, TODO: should be related to sprite height
    this.width = 32;
    this.height = 32;
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
      speedX: 10, // move enemy bullet speed to config?
      speedY: 10, // move enemy bullet speed to config?
      damage: this.damage,
    });
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
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
    this.width = 32;
    this.height = 32;
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingShoot = false;
    this.mouseX = 0;
    this.mouseY = 0;
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
        this.x = Math.random() * 500; //TODO: don't spawn on obstacle
        this.y = Math.random() * 150 + 350; // spawn in bottom part of map
      }
    }
    this.updateSpeed();
    super.update();

    const currentTime = new Date().getTime();
    const timeDifference = currentTime - this.timeLastShot;
    // Note: this.pressingShoot only triggered if the click is down during an update loop
    if (this.pressingShoot && timeDifference > this.coolDown) {
      const mouseAngle = this.getAngle({x: this.mouseX, y: this.mouseY});
      this.shootBullet(mouseAngle);
      this.timeLastShot = currentTime;
    }
  }
  updateSpeed() {
    // TODO: fix bug that causes player to teleport to a side if two objects are
    // touching and both are in a collision path
    // check collisions in each direction individually to preserve the speed of
    // collision-free directions
    if (this.pressingRight) {
      this.speedX = this.maxSpeed;
      // check collisions with future +x position and current y position
      const collisionObject = this.checkCollisionsWithObjects(
        this.x + this.speedX,
        this.y
      );
      // if there will be a collision in this x-direction...
      if (collisionObject) {
        // set the player flush with the obstacle's left side...
        this.x = collisionObject.x - this.width;
        // and set just the x-speed to 0 (allowing y-speed to continue unless
        // it's a direct corner collision, in which case the collision check
        // with the future y position will also trigger and set y-speed to 0)
        this.speedX = 0;
      }
    } else if (this.pressingLeft) {
      this.speedX = -this.maxSpeed;
      // check collisions with future -x position and current y position
      const collisionObject = this.checkCollisionsWithObjects(
        this.x + this.speedX,
        this.y
      );
      if (collisionObject) {
        // only difference with above is that player position is flush with the
        // obstacle's right side
        this.x = collisionObject.x + collisionObject.width;
        this.speedX = 0;
      }
    } else {
      this.speedX = 0;
    }

    if (this.pressingUp) {
      this.speedY = -this.maxSpeed;
      // check collisions with future -y position and current x position
      const collisionObject = this.checkCollisionsWithObjects(
        this.x,
        this.y + this.speedY
      );
      if (collisionObject) {
        // set player flush with bottom of obstacle (if it's a direct corner
        // collision, the player will be moved out to the corner because of the
        // checks above)
        this.y = collisionObject.y + collisionObject.height;
        // set y-speed to obstacle's speed
        this.speedY = collisionObject.speedY;
      }
    } else if (this.pressingDown) {
      this.speedY = this.maxSpeed;
      const collisionObject = this.checkCollisionsWithObjects(
        this.x,
        this.y + this.speedY
      );
      if (collisionObject) {
        // -1 pixel to avoid a bug in top collisions that detects an overlap
        // directly at collisionObject.y - this.height
        this.y = collisionObject.y - this.height - 1;
        this.speedY = collisionObject.speedY;
      }
    } else {
      this.speedY = -1;
    }
  }
  checkCollisionsWithObjects(futureX, futureY) {
    const playerFutureCoords = {
      x: futureX,
      y: futureY,
      width: this.width,
      height: this.height
    };

    // TODO: only check obstacles in the same quadtree or grid area as player
    for (let i in Obstacle.obstacles) {
      const obstacle = Obstacle.obstacles[i];
      const obstacleFutureCoords = {
        x: obstacle.x,
        y: obstacle.y + obstacle.speedY,
        width: obstacle.width,
        height: obstacle.height
      }
      if (Entity.overlaps(playerFutureCoords, obstacleFutureCoords)) {
        return obstacle;
      }
    }
    return false;
  }
  shootBullet(angle) {
    new Bullet({
      parent: this.id,
      angle: angle,
      x: this.x,
      y: this.y,
      speedX: 30, // move player bullet speed to config?
      speedY: 30, // move player bullet speed to config?
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
      this.mouseX = state.x;
      this.mouseY = state.y;
    }
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      hp: this.hp,
      hpMax: this.hpMax,
      score: this.score,
    };
  }
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
    const player = new Player(socket.id); //TODO: don't spawn on obstacle
    socket.on('keyPress', data => {
      player.setPressingKey(data.inputId, data.state); // e.g. 'right', true
    });
    // Update new client with existing players, enemies, and bullets data
    socket.emit('init', {
      selfId: socket.id,
      players: Player.getAllInitPack(),
      enemies: Enemy.getAllInitPack(),
      bullets: Bullet.getAllInitPack(),
      obstacles: Obstacle.getAllInitPack(),
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
