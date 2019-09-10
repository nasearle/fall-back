class Enemy extends Entity {
  constructor(gameId) {
    super();
    this.type = 'enemy';
    this.id = generateId();
    this.gameId = gameId;
    // TODO: this line can cause a a crash if enemy spawns when players are dead
    // since it doesn't check if(player). We could just remove it, and let the
    // target player get assigned in the first update frame
    this.targetId = Player.getRandomPlayer(this.gameId).id;
    this.width = 32;
    this.height = 32;

    // Keep speed low and march chance high for smoother movement?
    this.maxSpeed = 2;
    this.hp = 30;
    this.hpMax = 30;
    this.toRemove = false;
    this.bulletSpeedModifier = 0.4; // Want enemy bullets to be much slower
    this.color = '#FFF';

    // TODO: Could have enemy subclasses in the future
    const weaponType = getWeightedRandomItem(Enemy.chancesForWeapons);
    this.weapon = new Weapon(weaponType, this);

    const enemySpawnPoint = Entity.getEntitySpawnPoint(this);
    // TODO: x depends on viewport which varies between clients, see issue #34
    this.x = enemySpawnPoint.x;
    this.y = enemySpawnPoint.y;

    GAMES[gameId].enemies[this.id] = this;
    GAMES[gameId].initPack.enemies.push(this.getInitPack());
  }
  update() {
    if (this.hp <= 0) {
      this.toRemove = true;
      if (this.weapon.dropable) {
        new Item({
          gameId: this.gameId,
          x: this.x,
          y: this.y,
          name: this.weapon.name,
        });
      }
    }
    // Remove enemies that get stuck in obstacles and drift offscreen
    else if (this.y < -this.height - 20) {
      this.toRemove = true;
    }
    const game = GAMES[this.gameId];
    let targetPlayer = game.players[this.targetId];
    // if the target player died or left the game, get a new target
    if (!targetPlayer) {
      targetPlayer = Player.getRandomPlayer(this.gameId);
      if (targetPlayer) {
        this.targetId = targetPlayer.id;
      }
    }
    this.updateSpeed(targetPlayer);
    super.update();
    // For now, enemies simply shoot at their target player randomly
    if (Math.random() <= Enemy.chanceToShoot) {
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
        this.speedY = -1;
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
    const numEnemies = numIds(game.enemies);
    if (
      Math.random() <= game.chanceForEnemiesToGenerate &&
      numEnemies < Enemy.numCap
    ) {
      new Enemy(gameId);
    }

    // Increase enemy generation rate.
    game.chanceForEnemiesToGenerate *= 1 + Enemy.generationGradient;

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
// TODO: Could use enemy subclasses in the future
Enemy.chancesForWeapons = [
  // chances should sum to 1
  { name: 'shotgun',  chance: 0.05 },
  { name: 'chaingun', chance: 0.05 },
  { name: 'rifle', chance: 0.05 },
  { name: 'burstshot', chance: 0.05 },
  { name: 'flamethrower', chance: 0.05 },
  { name: 'pistol', chance: 0.75 },
];
