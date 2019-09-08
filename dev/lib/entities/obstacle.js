class Obstacle extends Entity {
  constructor(config) {
    super();
    this.id = generateId();
    this.gameId = config.gameId;
    // TODO: x and y depend on viewport which will vary between clients, see issue #34
    this.x = config.x || getRandomInt(0, 1800);
    this.y = config.y || 1000; // TODO: this will need to be below the viewport
    this.width = config.width || getRandomInt(25, 100);
    this.height = config.height || getRandomInt(25, 100);
    this.toRemove = false;
    this.speedY = -1;

    GAMES[this.gameId].obstacles[this.id] = this;
    GAMES[this.gameId].initPack.obstacles.push(this.getInitPack());
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
  static updateAll(gameId) {
    // Periodically generate new obstacles

    if (Math.random() <= Obstacle.chanceToGenerate) {
      new Obstacle({ gameId: gameId });
    }

    const pack = [];
    const game = GAMES[gameId];
    for (let id in game.obstacles) {
      let obstacle = game.obstacles[id];
      obstacle.update();
      if (obstacle.toRemove) {
        delete game.obstacles[id];
        game.removePack.obstacles.push(obstacle.id);
      } else {
        pack.push(obstacle.getUpdatePack());
      }
    }
    return pack;
  }
}
// Chance is once per 2 seconds
Obstacle.chanceToGenerate = 1 / (2 * FPS);

/* Not using module.exports because require() is unavailable in the sandbox environment */