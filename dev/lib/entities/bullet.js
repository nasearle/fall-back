class Bullet extends Entity {
  constructor(config) {
    super();
    const { parent, angle, weaponName } = config;
    this.parent = parent;
    this.angle = angle;
    this.weaponName = weaponName;
    this.id = generateId();
    this.gameId = parent.gameId;
    this.width = 10;
    this.height = 10;
    this.x = parent.x + (parent.width  / 2) - (this.width  / 2);
    this.y = parent.y + (parent.height / 2) - (this.height / 2);
    const speed = parent.weapon.speed * parent.bulletSpeedModifier;
    this.speedX = Math.cos((this.angle / 180) * Math.PI) * speed;
    this.speedY = Math.sin((this.angle / 180) * Math.PI) * speed;
    this.timer = 0;
    this.damage = parent.weapon.damage;
    this.toRemove = false;
    this.color = this.parent.color;
    this.ttl = 100; // time to live

    GAMES[this.gameId].bullets[this.id] = this;
    GAMES[this.gameId].initPack.bullets.push(this.getInitPack());
  }
  update() {
    if (this.timer++ > this.ttl) {
      this.toRemove = true;
    }
    super.update();
    const game = GAMES[this.gameId];

    // TODO: consider quadtree type structure for collisions

    /* Collisions with enemies */
    if (this.parent.type != 'enemy') { // No friendly fire
      for (let id in game.enemies) {
        let enemy = game.enemies[id];
        if (Entity.overlaps(this, enemy)) {
          enemy.hp -= this.damage;
          if (enemy.hp <= 0) {
            // enemy removal handled in Enemy class
            const shooter = game.players[this.parent.id];
            if (shooter) {
              shooter.score += 100;
            }
          }
          this.toRemove = true;
        }
      }
    }

    /* Collisions with obstacles */
    for (let id in game.obstacles) {
      let obstacle = game.obstacles[id];
      if (Entity.overlaps(this, obstacle)) {
        this.toRemove = true;
      }
    }

    /* Collisions with players */
    if (this.parent.type != 'player') { // No friendly fire
      for (let id in game.players) {
        let player = game.players[id];
        if (!player.dead && Entity.overlaps(this, player)) {
          player.hp -= this.damage;
          this.toRemove = true;
        }
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
      width: this.width,
      height: this.height,
      color: this.color,
      parentType: this.parent.type,
      parentId: this.parent.id,
      weaponName: this.weaponName
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
