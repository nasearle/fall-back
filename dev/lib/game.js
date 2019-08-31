class Game {
    constructor() {
      this.id = generateId();
      this.room = `room-${this.id}`;
      this.initPack = { players: [], enemies: [], bullets: [], obstacles: [] };
      this.removePack = { players: [], enemies: [], bullets: [], obstacles: [] };
      this.updatePack = {};

      this.players = {};
      this.bullets = {};
      this.obstacles = {};
      this.enemies = {};

      // Moved from Enemy class, since this will vary by game
      // Chance starts at once per 5 seconds
      this.chanceForEnemiesToGenerate = 1 / (5 * FPS);

      console.log(`[Game constructor] New game created: ${this.id}`);
      GAMES[this.id] = this;
    }
    getFrameUpdateData() {
      const packs = {
        initPack: {},
        removePack: {},
        updatePack: {},
      };
      for (let entityType in Game.entities) {
        // build data packs to send
        const entityClass = Game.entities[entityType];
        packs.initPack[entityType] = this.initPack[entityType];
        packs.removePack[entityType] = this.removePack[entityType];
        packs.updatePack[entityType] = entityClass.updateAll(this.id);

        // clear inits & removes from cache
        this.initPack[entityType] = [];
        this.removePack[entityType] = [];
      }
      return packs;
    }
    static findOrCreateGame() {
        console.log('[findOrCreateGame] Current games:', GAMES);
        console.log('[findOrCreateGame] Searching for available games...');
        const maxPlayersPerGame = 4;
        const gameIds = ids(GAMES);
        for (let i = 0; i < gameIds.length; i++) {
          const gameId = gameIds[i];
          const existingGame = GAMES[gameId];
          const numCurrentPlayers = numIds(existingGame.players);
          console.log('[findOrCreateGame] Existing game', gameId, 'found with', numCurrentPlayers, 'players');
          if (numCurrentPlayers < maxPlayersPerGame) {
            console.log('[findOrCreateGame] Available game found:', existingGame.id);
            return existingGame;
          }
        }
        console.log('[findOrCreateGame] No available game found, creating new game');
        return new Game();
    }
    static deleteIfEmpty(gameId) {
        const game = GAMES[gameId];
        if (game) {
            const numCurrentPlayers = numIds(game.players);
            if (numCurrentPlayers == 0) {
                delete GAMES[gameId];
            }
        }
    }
  }
  Game.entities = {
    'players': Player,
    'enemies': Enemy,
    'bullets': Bullet,
    'obstacles': Obstacle,
  };

  /* Not using module.exports because require() is unavailable in the sandbox environment */
