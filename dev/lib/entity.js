class Entity {
  constructor() {
    this.id = '';
    this.gameId = '';
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
    return (
      self.x < target.x + target.width &&
      self.x + self.width > target.x &&
      self.y < target.y + target.height &&
      self.y + self.height > target.y
    );
  }
  static checkCollisionsWithObstacles(self, x, y) {
    const entityFutureCoords = {
      x: x,
      y: y,
      width: self.width,
      height: self.height,
    };

    // TODO: only check obstacles in the same quadtree or grid area as player
    const game = GAMES[self.gameId];
    for (let i in game.obstacles) {
      const obstacle = game.obstacles[i];
      const obstacleFutureCoords = {
        x: obstacle.x,
        y: obstacle.y + obstacle.speedY,
        width: obstacle.width,
        height: obstacle.height,
      };
      if (Entity.overlaps(entityFutureCoords, obstacleFutureCoords)) {
        return obstacle;
      }
    }
    return false;
  }
  static getAllInitPack(gameId, entityType) {
    const existingEntities = [];
    const game = GAMES[gameId];
    for (let id in game[entityType]) {
      const entity = game[entityType][id];
      existingEntities.push(entity.getInitPack());
    }
    return existingEntities;
  }
}

/* Not using module.exports because require() is unavailable in the sandbox environment */