class Bullet extends Entity {
  constructor(config) {
    super();
    this.id = generateId(); // TODO: will need to do something more unique
    this.gameId = config.gameId;
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

    GAMES[this.gameId].bullets[this.id] = this;
    GAMES[this.gameId].initPack.bullets.push(this.getInitPack());
  }
  update() {
    if (this.timer++ > 100) {
      this.toRemove = true;
    }
    super.update();
    const game = GAMES[this.gameId];
    const enemyIds = ids(game.enemies);
    // TODO: quadtree
    for (let id in game.enemies) {
      let enemy = game.enemies[id];
      const parentIdString = `${this.parent}`;
      if (!enemyIds.includes(parentIdString) && Entity.overlaps(this, enemy)) {
        enemy.hp -= this.damage;
        if (enemy.hp <= 0) {
          // enemy removal handled in Enemy class
          const shooter = game.players[this.parent];
          if (shooter) {
            shooter.score += 100;
          }
        }
        this.toRemove = true;
      }
    }
    // TODO: quadtree
    for (let id in game.obstacles) {
      let obstacle = game.obstacles[id];
      if (Entity.overlaps(this, obstacle)) {
        this.toRemove = true;
      }
    }
    const playerIds = ids(game.players);
    // TODO: quadtree
    for (let id in game.players) {
      let player = game.players[id];
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
  static updateAll(gameId) {
    const pack = [];
    const game = GAMES[gameId];
    for (let id in game.bullets) {
      let bullet = game.bullets[id];
      bullet.update();
      if (bullet.toRemove) {
        delete game.bullets[id];
        game.removePack.bullets.push(bullet.id);
      } else {
        pack.push(bullet.getUpdatePack());
      }
    }
    return pack;
  }
}

/* Not using module.exports because require() is unavailable in the sandbox environment */