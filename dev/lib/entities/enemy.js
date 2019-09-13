class Enemy extends Entity {
  constructor(gameId, config) {
    super();
    this.type = 'enemy';
    this.toRemove = false;
    this.id = generateId();
    this.gameId = gameId;
    this.targetId = Player.getRandomLivingPlayerId(this.gameId);
    this.width = 32;
    this.height = 32;
    this.chanceToShoot = 1 / FPS;

    // Keep speed low and march chance high for smoother movement?
    this.maxSpeed = 2;
    this.hp = 30;
    this.hpMax = 30;
    this.bulletSpeedModifier = 0.4;
    this.color = '#FFF';

    const enemySpawnPoint = Entity.getEntitySpawnPoint(this);
    // TODO: x depends on viewport which varies between clients, see issue #34
    this.x = enemySpawnPoint.x;
    this.y = enemySpawnPoint.y;

    const game = GAMES[this.gameId];
    this.weaponType = getWeightedRandomItem(game.chancesForWeapons);

    // Overwrite values if config
    if (config) {
      for (let key in config) {
        this[key] = config[key];
      }
    }

    this.weapon = new Weapon(this.weaponType, this);

    game.decrementRemainingEnemies();

    game.enemies[this.id] = this;
    game.initPack.enemies.push(this.getInitPack());
  }
  update() {
    if (this.hp <= 0) {
      this.toRemove = true;
      const game = GAMES[this.gameId];
      game.incrementWaveKills();
      if (this.weapon.dropable) {
        new Item({
          gameId: this.gameId,
          x: this.x,
          y: this.y,
          name: this.weapon.name,
        });
      }
    }

    const game = GAMES[this.gameId];
    let targetPlayer = game.players[this.targetId];
    // if the target player died or left the game, get a new target
    if (!targetPlayer || targetPlayer.dead) {
      const newTargetId = Player.getRandomLivingPlayerId(this.gameId);
      targetPlayer = game.players[newTargetId];
      if (targetPlayer) {
        this.targetId = newTargetId;
      }
    }
    this.updateSpeed(targetPlayer);
    super.update();
    // For now, enemies simply shoot at their target player randomly
    if (Math.random() <= this.chanceToShoot) {
      if (targetPlayer) {
        const angle = this.getAngle(targetPlayer);
        this.weapon.attemptShoot(angle);
      }
    }
  }
  updateSpeed(targetPlayer) {
    // TODO: fix teleportation bugs (same in Player)
    // TODO: make enemies collide with each other so they don't stack
    // switch to moving toward a target player instead of toward a random player
    // to avoid the shakes
    if (targetPlayer) {
      const diffX = targetPlayer.x - this.x;
      const diffY = targetPlayer.y - this.y;
      // enemy moving right
      // check if diff between player and enemy position is at least half the
      // maxSpeed of the enemy to prevent the enemy shaking back and forth
      if (diffX > this.maxSpeed / 2) {
        this.speedX = this.maxSpeed;
        // see Player.updateSpeed() for explanation of collision logic
        const collisionObject = Entity.checkCollisionsWithObstacles(
          this,
          this.x + this.speedX,
          this.y
        );
        // set just the speed and not the position to avoid teleportation bug (#30)
        if (collisionObject) {
          this.speedX = 0;
        }
        // enemy moving left
      } else if (diffX < -this.maxSpeed / 2) {
        this.speedX = -this.maxSpeed;
        const collisionObject = Entity.checkCollisionsWithObstacles(
          this,
          this.x + this.speedX,
          this.y
        );
        if (collisionObject) {
          this.speedX = 0;
        }
      } else {
        this.speedX = 0;
      }
      // enemy moving up
      if (diffY < -this.maxSpeed / 2) {
        this.speedY = -this.maxSpeed;
        const collisionObject = Entity.checkCollisionsWithObstacles(
          this,
          this.x,
          this.y + this.speedY
        );
        if (collisionObject) {
          this.y = collisionObject.y + collisionObject.height;
          this.speedY = collisionObject.speedY;
        }
        // enemy moving down
      } else if (diffY > this.maxSpeed / 2) {
        this.speedY = this.maxSpeed;
        const collisionObject = Entity.checkCollisionsWithObstacles(
          this,
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
        this.speedY = CAMERA_SPEED;
      }
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
      color: this.color,
    };
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
    };
  }
  static updateAll(gameId) {
    // Periodically generate new enemies
    const game = GAMES[gameId];

    if (game.remainingEnemies > 0) {
      if (Math.random() <= game.chanceForEnemiesToGenerate) {
        new Enemy(gameId);
      }
    }

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
