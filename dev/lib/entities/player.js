class Player extends Entity {
    constructor(id, gameId) {
      super();
      this.id = id;
      this.gameId = gameId;
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
      this.damage = 10; // can base this on the current weapon / power up
      this.coolDown = 400; // can base this on the current weapon / power up // TODO: should be in terms of FPS
      this.timeLastShot = 0;
      this.score = 0;
      this.toRemove = false;

      console.log(`[Player constructor] New player created: ${id}, adding to game: ${gameId}`);
      GAMES[gameId].players[id] = this;
    }
    update() {
      if (this.hp <= 0) {
        this.lives--;
        if (this.lives < 0) {
          // TODO: should mark as "dead" instead. Deleting players
          // * prevents access to their state that could still be rendered (score, etc.)
          // * prevents access to their state in onDisconnect (saving to DB, deleting game, etc.)
          this.toRemove = true;
        } else {
          this.hp = this.hpMax;
          this.x = Math.random() * 500; //TODO: don't spawn on obstacle
          this.y = Math.random() * 150 + 350; // spawn in bottom part of map
        }
      }
      this.updateSpeed();
      super.update();

      const currentTime = new Date().getTime();
      const timeDifference = currentTime - this.timeLastShot;
      // Note: this.pressingShoot only triggered if the click is down during an update loop
      if (this.pressingShoot && timeDifference > this.coolDown) {
        const mouseAngle = this.getAngle({x: this.mouseX, y: this.mouseY});
        this.shootBullet(mouseAngle);
        this.timeLastShot = currentTime;
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
        this.speedY = -1;
      }
    }
    shootBullet(angle) {
      new Bullet({
        gameId: this.gameId,
        parent: this.id,
        angle: angle,
        x: this.x,
        y: this.y,
        speedX: 30, // move player bullet speed to config?
        speedY: 30, // move player bullet speed to config?
        damage: this.damage,
      });
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
      };
    }
    getUpdatePack() {
      return {
        id: this.id,
        x: this.x,
        y: this.y,
        hp: this.hp,
        score: this.score,
      };
    }
    static countPlayers(gameId) {
      return Object.keys(GAMES[gameId].players).length;
    }
    static getRandomPlayer(gameId) {
      const countPlayers = Player.countPlayers(gameId);
      const game = GAMES[gameId];
      return game.players[
        Object.keys(game.players)[Math.floor(Math.random() * countPlayers)]
      ];
    }
    static onConnect(socket) {
      console.log(`[onConnect] Searching for available games...`);
      const game = Game.findOrCreateGame();

      console.log(`[onConnect] Adding player to: ${game.id}`, game);
      const player = new Player(socket.id, game.id);

      socket.on('keyPress', data => {
        player.setPressingKey(data.inputId, data.state); // e.g. 'right', true
      });

      // Update new client with existing players, enemies, and bullets data
      socket.emit('init', {
        selfId: socket.id,
        players: Player.getAllInitPack(game.id, 'players'),
        enemies: Enemy.getAllInitPack(game.id, 'enemies'),
        bullets: Bullet.getAllInitPack(game.id, 'bullets'),
        obstacles: Obstacle.getAllInitPack(game.id, 'obstacles'),
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
      // 'if' to avoid the server crashing if the player died (already removed)
      if (playerToRemove) {
        playerToRemove.toRemove = true;
      }

      // TODO: do i need to remove disconnected players from rooms?
      // seems like it would happen automatically
    }
  }

/* Not using module.exports because require() is unavailable in the sandbox environment */
