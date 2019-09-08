class PlayerSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = "player";
    this.render = function() {
      this.context.fillStyle = this.color;
      this.context.fillRect(this.x, this.y, this.width, this.height);
    };
    PlayerSprite.sprites[this.id] = this;
  }
}
PlayerSprite.sprites = {};

class EnemySprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = "enemy";
    this.image = EnemySprite.image;
    EnemySprite.sprites[this.id] = this;
  }
}
EnemySprite.sprites = {};
EnemySprite.image = new Image();
EnemySprite.image.src = "assets/alien-32.png";

class BulletSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = "bullet";
    this.render = function() {
      this.context.fillStyle = this.color;
      this.context.fillRect(this.x, this.y, 10, 10);
    };
    BulletSprite.sprites[this.id] = this;
  }
}
BulletSprite.sprites = {};

class ObstacleSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = "obstacle";
    this.render = function() {
      this.context.fillStyle = this.color;
      this.context.fillRect(this.x, this.y, this.width, this.height);
    };
    ObstacleSprite.sprites[this.id] = this;
  }
}
ObstacleSprite.sprites = {};

class ItemSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = "item";
    this.render = function() {
      this.context.fillStyle = this.color;
      this.context.fillRect(this.x, this.y, this.width, this.height);
    };
    ItemSprite.sprites[this.id] = this;
  }
}
ItemSprite.sprites = {};

/* Not using module.exports because require() is unavailable in the sandbox environment */
