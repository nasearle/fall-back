class Player extends Entity {
  constructor(config) {
    super();
    this.type = 'player';
    this.id = config.id;
    this.gameId = config.gameId;
    this.width = 32;
    this.height = 32;
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingShoot = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.maxSpeed = 10;
    this.hp = 100;
    this.hpMax = 100;
    this.lives = 3;
    this.score = 0;
    this.diedAt = null;
    this.dead = false;
    this.toRemove = false;
    this.weapon = new Weapon('pistol', this);
    this.bulletSpeedModifier = 1;
    this.viewportDimensions = config.viewportDimensions;

    this.color = Player.getFreeColor(GAMES[this.gameId]);

    const playerSpawnPoint = Entity.getEntitySpawnPoint(this);
    this.x = playerSpawnPoint.x;
    this.y = playerSpawnPoint.y;

    console.log(
      `[Player constructor] New player created: ${config.id}, adding to game: ${config.gameId}`
    );
    GAMES[config.gameId].players[config.id] = this;
  }
  update() {
    if (!this.dead) {
      if (this.hp <= 0) {
        if (!this.diedAt) {
          this.diedAt = new Date().getTime();
          this.lives--;
          this.resetWeapon();
        }
        if (this.lives < 0) {
          this.dead = true;
        } else {
          const currentTime = new Date().getTime();
          if (currentTime - this.diedAt > 1000) {
            this.diedAt = null;
            this.hp = this.hpMax;
            const playerSpawnPoint = Entity.getEntitySpawnPoint(this);
            // Also see issue #34 - different client sizes complicate spawning ranges
            this.x = playerSpawnPoint.x;
            this.y = playerSpawnPoint.y;
          }
        }
      }
      if (this.weapon.ammo <= 0) {
        // return to pistol when out of ammo
        this.resetWeapon();
      }
      this.updateSpeed();
      super.update();

      // Note: this.pressingShoot only triggered if the click is down during an update loop
      if (this.pressingShoot) {
        const mouseAngle = this.getAngle({x: this.mouseX, y: this.mouseY});
        this.weapon.attemptShoot(mouseAngle);
      }
    }
  }
  updateSpeed() {
    // TODO: fix bug that causes player to teleport to a side if two objects are
    // touching and both are in a collision path
    // check collisions in each direction individually to preserve the speed of
    // collision-free directions
    if (this.pressingRight) {
      this.speedX = this.maxSpeed;

      // check collisions with future +x position and current y position
      const collisionObject = Entity.checkCollisionsWithObstacles(
        this,
        this.x + this.speedX,
        this.y
      );
      // if there will be a collision in this x-direction...
      if (collisionObject) {
        // set the player flush with the obstacle's left side...
        this.x = collisionObject.x - this.width;
        // and set just the x-speed to 0 (allowing y-speed to continue unless
        // it's a direct corner collision, in which case the collision check
        // with the future y position will also trigger and set y-speed to 0)
        this.speedX = 0;
      }

    } else if (this.pressingLeft) {
      this.speedX = -this.maxSpeed;

      // check collisions with future -x position and current y position
      const collisionObject = Entity.checkCollisionsWithObstacles(
        this,
        this.x + this.speedX,
        this.y
      );
      if (collisionObject) {
        // only difference with above is that player position is flush with the
        // obstacle's right side
        this.x = collisionObject.x + collisionObject.width;
        this.speedX = 0;
      }

    } else {
      this.speedX = 0;
    }

    if (this.pressingUp) {
      this.speedY = -this.maxSpeed;

      // check collisions with future -y position and current x position
      const collisionObject = Entity.checkCollisionsWithObstacles(
        this,
        this.x,
        this.y + this.speedY
      );
      if (collisionObject) {
        // set player flush with bottom of obstacle (if it's a direct corner
        // collision, the player will be moved out to the corner because of the
        // checks above)
        this.y = collisionObject.y + collisionObject.height;
        // set y-speed to obstacle's speed
        this.speedY = collisionObject.speedY;
      }

    } else if (this.pressingDown) {
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
  setPressingKey(inputId, state) {
    if (inputId == 'right') {
      this.pressingRight = state;
    } else if (inputId == 'left') {
      this.pressingLeft = state;
    } else if (inputId == 'up') {
      this.pressingUp = state;
    } else if (inputId == 'down') {
      this.pressingDown = state;
    } else if (inputId === 'shoot') {
      this.pressingShoot = state;
    } else if (inputId === 'mouseAngle') {
      this.mouseX = state.x;
      this.mouseY = state.y;
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
      hpMax: this.hpMax,
      score: this.score,
      color: this.color,
      lives: this.lives,
    };
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
      hpMax: this.hpMax,
      score: this.score,
      lives: this.lives,
      weaponName: this.weapon.name,
      weaponAmmo: this.weapon.ammo,
      diedAt: this.diedAt,
    };
  }
  resetWeapon() {
    this.weapon = new Weapon('pistol', this);
  }
  static getRandomLivingPlayerId(gameId) {
    const game = GAMES[gameId];
    const livingPlayerIds = [];
    for (let id in game.players) {
      const player = game.players[id];
      if (!player.dead) {
        livingPlayerIds.push(player.id);
      }
    }
    // returns undefined if no living players
    return livingPlayerIds[Math.floor(Math.random() * livingPlayerIds.length)];
  }
  static getFreeColor(game) {
    const numExistingPlayers = numIds(game.players);
    if (numExistingPlayers == 0) {
      return Player.colors[0];
    }
    // if there are already as many players as there are colors, get a random color
    if (numExistingPlayers >= Player.colors.length) {
      return Player.colors[Math.floor(Math.random() * Player.colors.length)];
    }

    let colorIsFree;
    // loop through available colors
    for (const color of Player.colors) {
      colorIsFree = true;
      for (const id in game.players) {
        const player = game.players[id];
        // if an existing player is that color already, break the inner loop and
        // check the next color
        if (player.color == color) {
          colorIsFree = false;
          break;
        }
      }
      if (colorIsFree) {
        return color;
      }
    }
  }
  static onConnect(socket, viewportDimensions, gameId, privateGame) {
    console.log(`[onConnect] Searching for available games...`);
    const game = Game.joinOrCreateGame(gameId, privateGame);
    const playerConfig = {
      id: socket.id,
      gameId: game.id,
      viewportDimensions: viewportDimensions,
    };
    console.log(`[onConnect] Adding player to game ${game.id}`);
    const player = new Player(playerConfig);

    socket.on('keyPress', data => {
      player.setPressingKey(data.inputId, data.state); // e.g. 'right', true
    });

    socket.on('viewportResize', viewportDimensions => {
      player.viewportDimensions = viewportDimensions;
    });

    // Update new client with existing players, enemies, and bullets data
    socket.emit('init', {
      selfId: socket.id,
      players: Player.getAllInitPack(game.id, 'players'),
      enemies: Enemy.getAllInitPack(game.id, 'enemies'),
      bullets: Bullet.getAllInitPack(game.id, 'bullets'),
      obstacles: Obstacle.getAllInitPack(game.id, 'obstacles'),
      items: Item.getAllInitPack(game.id, 'items'),
    });

    /** broadcast the new player to all other players once on creation instead
     * of adding the new player to the initPack in the constructor, to avoid
     * sending the new player its own info twice (once in the above 'init'
     * socket and once when the initPack containing the new player is sent to
     * the new player in the next loop)
     *
     * Emitting player to room before joining to prevent redundant event*/
    socket.to(game.room).emit('newPlayer', player.getInitPack());

    console.log(`[onConnect] Subscribing player to room: ${game.room}`);
    socket.join(game.room);
  }
  // Find a player based on their socket.id
  static findPlayerById(id) {
    const gameIds = ids(GAMES);
    for (let i = 0; i < gameIds.length; i++) {
      const gameId = gameIds[i]
      const game = GAMES[gameId]
      const playerIds = ids(game.players);
      for (let j = 0; j < playerIds.length; j++) {
        const playerId = playerIds[j];
        if (playerId == id) {
          return game.players[playerId];
        }
      }
    }
  }
  static updateAll(gameId) {
    const pack = [];
    const game = GAMES[gameId];
    for (let id in game.players) {
      let player = game.players[id];
      player.update();
      if (player.toRemove) {
        delete game.players[id];
        game.removePack.players.push(player.id);
      } else {
        pack.push(player.getUpdatePack());
      }
    }
    return pack;
  }
  static onDisconnect(socket) {
    console.log(`[onDisconnect] Player ${socket.id} disconnected, marking for removal`);
    const playerToRemove = Player.findPlayerById(socket.id);
    // TODO: can possibly remove if check because player no longer removed on death
    // 'if' to avoid the server crashing if the player died (already removed)
    if (playerToRemove) {
      playerToRemove.toRemove = true;
    }
  }
}
Player.colors = ['#FF5733', '#4086fd', '#56f572', '#FFBD33', '#EA14DA', '#1EE1F5', '#EA7919', '#C454FF'];

/* Not using module.exports because require() is unavailable in the sandbox environment */
