class PlayerSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = 'player';
    this.deathAnimationFrame = 0;
    this.deathAnimationTotalFrames = 30;
    this.rgbColorsArr = hexToRGB(this.color);
    this.render = function() {
      if (!this.diedAt) {
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x, this.y, this.width, this.height);

        // Health bar
        const fullHealthBarWidth = this.width * 1.1; // 10% wider than sprite
        const offsetX = (this.width - fullHealthBarWidth) / 2;
        const offsetY = -10;
        const healthBarX = this.x + offsetX;
        const healthBarY = this.y + offsetY;
        const healthBarHeight = 5;
        const healthPercentage = this.hp / this.hpMax;
        const partialHealthBar = fullHealthBarWidth * healthPercentage;
        this.context.fillRect(healthBarX, healthBarY, partialHealthBar, healthBarHeight);
      } else {
        this.context.fillStyle = `rgba(${this.rgbColorsArr[0]}, ${
          this.rgbColorsArr[1]
        }, ${this.rgbColorsArr[2]}, ${1 -
          (1 / this.deathAnimationTotalFrames) * this.deathAnimationFrame})`;
        this.context.fillRect(
          this.x,
          this.y,
          this.width + this.deathAnimationFrame,
          this.height + this.deathAnimationFrame
        );
      }
    };
    PlayerSprite.sprites[this.id] = this;
  }
}
PlayerSprite.sprites = {};

class EnemySprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = 'enemy';
    this.dead = false;
    this.deathAnimationFrame = 0;
    this.deathAnimationTotalFrames = 30;
    this.rgbColorsArr = hexToRGB(this.color);
    this.render = function() {
      this.context.beginPath();
        if (!this.dead) {
          this.context.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2,
            0,
            2 * Math.PI
          );
          this.context.strokeStyle = this.color;
        } else {
          this.context.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2 + this.deathAnimationFrame,
            0,
            2 * Math.PI
          );
          this.context.strokeStyle = `rgba(${this.rgbColorsArr[0]}, ${
            this.rgbColorsArr[1]
          }, ${this.rgbColorsArr[2]}, ${1 -
            (1 / this.deathAnimationTotalFrames) * this.deathAnimationFrame})`;
        }
      this.context.stroke();
    };
    EnemySprite.sprites[this.id] = this;
  }
}
EnemySprite.sprites = {};

class BulletSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = 'bullet';
    this.render = function() {
      if (this.parentType === 'enemy') {
        this.context.beginPath();
        this.context.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          2 * Math.PI
        );
        this.context.strokeStyle = this.color;
        this.context.stroke();
      } else {
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x, this.y, this.width, this.height);
      }
    };
    BulletSprite.sprites[this.id] = this;
  }
}
BulletSprite.sprites = {};

class ObstacleSprite extends kontra.Sprite {
  constructor(config) {
    super(config);
    this.type = 'obstacle';
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
    this.type = 'item';
    this.render = function() {
      this.context.fillStyle = this.color;
      this.context.fillRect(this.x, this.y, this.width, this.height);

      // Label
      this.context.fillStyle = 'white';
      const offsetX = this.width / 2; // Text is center aligned @ item center
      const offsetY = -5;
      const labelX = this.x + offsetX;
      const labelY = this.y + offsetY;
      this.context.fillText(this.name, labelX, labelY);
    };
    ItemSprite.sprites[this.id] = this;
  }
}
ItemSprite.sprites = {};

/* Not using module.exports because require() is unavailable in the sandbox environment */
