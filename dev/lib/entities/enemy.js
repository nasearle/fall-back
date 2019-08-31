class Enemy extends Entity {
  constructor(id, gameId, x) {
    super();
    this.id = id;
    this.gameId = gameId;
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

    console.log(`New enemy in game ${gameId}:`, this);
    GAMES[gameId].enemies[this.id] = this;
    GAMES[gameId].initPack.enemies.push(this.getInitPack());
  }
  update() {
    if (this.hp <= 0) {
      this.toRemove = true;
    }
    this.updateSpeed();
    super.update();
    // For now, enemies simply shoot at a player randomly
    if (Math.random() <= Enemy.chanceToShoot) {
      const player = Player.getRandomPlayer(this.gameId);
      if (player) {
        const angle = this.getAngle(player);
        this.shootBullet(angle);
      }
    }
  }
  updateSpeed() {
    // For now, enemies simply march toward a player randomly
    if (Math.random() <= Enemy.chanceToMarch) {
      const player = Player.getRandomPlayer(this.gameId);
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
      gameId: this.gameId,
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
  static updateAll(gameId) {
    // Periodically generate new enemies
    const game = GAMES[gameId];
    const numEnemies = Object.keys(game.enemies).length; // could cache this
    if (Math.random() <= game.chanceForEnemiesToGenerate && numEnemies < Enemy.numCap) {
      const id = generateId();
      // TODO: enemy x depends on viewport width which will vary between clients...
      // probably just want a "map" width
      const x = getRandomInt(0, 500);
      new Enemy(id, gameId, x);
    }

    // Increase enemy generation rate.
    game.chanceForEnemiesToGenerate *= (1 + Enemy.generationGradient);

    /* TODO: remove enemies so they dont accumulate?
    will they *always* be defeated by player?
    What if they walk past the players on the sides?*/
    /* Potential solution: make enemies move towards player. can have them not
    come any closer than a certain radius or something */

    const pack = [];
    for (let id in game.enemies) {
      let enemy = game.enemies[id];
      enemy.update();
      if (enemy.toRemove) {
        delete game.enemies[id];
        game.removePack.enemies.push(enemy.id);
      } else {
        pack.push(enemy.getUpdatePack());
      }
    }
    return pack;
  }
}
// Chance is twice per second
Enemy.chanceToMarch = 2 / FPS;
// Chance is once per second
Enemy.chanceToShoot = 1 / FPS;
// How fast the *rate* of enemy generation increase: 5% increase every 15 seconds.
Enemy.generationGradient = 0.05 * (1 / (15 * FPS));
// Don't want too many enemies on screen or in memory
Enemy.numCap = 50;