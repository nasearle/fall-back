class Sprite {
  constructor(config) {
    for (const prop in config) {
      this[prop] = config[prop];
    }
  }
}
const canvas = document.querySelector('canvas#ctx');
Sprite.context = canvas.getContext('2d');

class PlayerSprite extends Sprite {
  constructor(config) {
    super(config);
    this.type = 'player';
    this.deathAnimationFrame = 0;
    this.deathAnimationTotalFrames = 30;
    this.rgbColorsArr = hexToRGB(this.color);
    this.render = function() {
      if (!this.diedAt) {
        Sprite.context.fillStyle = this.color;
        Sprite.context.fillRect(this.x, this.y, this.width, this.height);

        // Health bar
        const fullHealthBarWidth = this.width * 1.1; // 10% wider than sprite
        const offsetX = (this.width - fullHealthBarWidth) / 2;
        const offsetY = -10;
        const healthBarX = this.x + offsetX;
        const healthBarY = this.y + offsetY;
        const healthBarHeight = 5;
        const healthPercentage = this.hp / this.hpMax;
        const partialHealthBar = fullHealthBarWidth * healthPercentage;
        Sprite.context.fillRect(
          healthBarX,
          healthBarY,
          partialHealthBar,
          healthBarHeight
        );
        Sprite.context.fillStyle = 'grey';
        Sprite.context.fillRect(
          healthBarX + partialHealthBar,
          healthBarY,
          fullHealthBarWidth - partialHealthBar,
          healthBarHeight
        );
      } else {
        Sprite.context.fillStyle = `rgba(${this.rgbColorsArr[0]}, ${
          this.rgbColorsArr[1]
        }, ${this.rgbColorsArr[2]}, ${1 -
          (1 / this.deathAnimationTotalFrames) * this.deathAnimationFrame})`;
        Sprite.context.fillRect(
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

class EnemySprite extends Sprite {
  constructor(config) {
    super(config);
    this.type = 'enemy';
    this.dead = false;
    this.deathAnimationFrame = 0;
    this.deathAnimationTotalFrames = 30;
    this.rgbColorsArr = hexToRGB(this.color);
    this.render = function() {
      Sprite.context.beginPath();
      if (!this.dead) {
        Sprite.context.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          2 * Math.PI
        );
        Sprite.context.strokeStyle = this.color;
      } else {
        Sprite.context.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2 + this.deathAnimationFrame,
          0,
          2 * Math.PI
        );
        Sprite.context.strokeStyle = `rgba(${this.rgbColorsArr[0]}, ${
          this.rgbColorsArr[1]
        }, ${this.rgbColorsArr[2]}, ${1 -
          (1 / this.deathAnimationTotalFrames) * this.deathAnimationFrame})`;
      }
      Sprite.context.stroke();
    };
    EnemySprite.sprites[this.id] = this;
  }
}
EnemySprite.sprites = {};

class BulletSprite extends Sprite {
  constructor(config) {
    super(config);
    this.type = 'bullet';
    this.render = function() {
      if (this.parentType === 'enemy') {
        Sprite.context.beginPath();
        Sprite.context.arc(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.width / 2,
          0,
          2 * Math.PI
        );
        Sprite.context.strokeStyle = this.color;
        Sprite.context.stroke();
      } else {
        Sprite.context.fillStyle = this.color;
        Sprite.context.fillRect(this.x, this.y, this.width, this.height);
      }
    };
    BulletSprite.sprites[this.id] = this;
  }
}
BulletSprite.sprites = {};

class ObstacleSprite extends Sprite {
  constructor(config) {
    super(config);
    this.type = 'obstacle';
    this.render = function() {
      Sprite.context.fillStyle = this.color;
      Sprite.context.fillRect(this.x, this.y, this.width, this.height);
    };
    ObstacleSprite.sprites[this.id] = this;
  }
}
ObstacleSprite.sprites = {};

class ItemSprite extends Sprite {
  constructor(config) {
    super(config);
    this.type = 'item';
    this.render = function() {
      Sprite.context.fillStyle = this.color;
      Sprite.context.fillRect(this.x, this.y, this.width, this.height);

      // Label
      Sprite.context.fillStyle = 'white';
      const offsetX = this.width / 2; // Text is center aligned @ item center
      const offsetY = -5;
      const labelX = this.x + offsetX;
      const labelY = this.y + offsetY;
      Sprite.context.fillText(this.name, labelX, labelY);
    };
    ItemSprite.sprites[this.id] = this;
  }
}
ItemSprite.sprites = {};

/* Not using module.exports because require() is unavailable in the sandbox environment */
