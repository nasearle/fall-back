class Game {
    constructor() {
      this.id = generateId();
      this.room = `room-${this.id}`;
      this.initPack =   { players: [], enemies: [], bullets: [],
                          obstacles: [], items: [] };
      this.removePack = { players: [], enemies: [], bullets: [],
                          obstacles: [], items: [] };
      this.updatePack = {};

      this.players = {};
      this.bullets = {};
      this.obstacles = {};
      this.enemies = {};
      this.items = {};

      this.totalEnemies = 0;
      this.waveNum = 0;
      this.waveKills = 0;
      this.nextWave();

      console.log(`[Game constructor] New game created: ${this.id}`);
      GAMES[this.id] = this;

      // Must be called after game is added to GAMES
      this.createInitialObstacles();
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
    getState() {
      return {
        totalEnemies: this.totalEnemies,
        waveKills: this.waveKills,
        waveNum: this.waveNum,
      }
    }
    createInitialObstacles() {
      // Create some initial obstacles to prevent "empty" beginning screen
      for (let i = 0; i < INITIAL_OBSTACLES; i++) {
        new Obstacle({
          gameId: this.id,
          y: getRandomInt(0, MAP_HEIGHT),// overwrite default y, which is below viewport
        });
      }
    }
    decrementRemainingEnemies() {
      this.remainingEnemies--;
    }
    incrementWaveKills() {
      this.waveKills++;
      if (this.waveKills >= this.totalEnemies) {
        this.nextWave();
      }
    }
    nextWave() {
      // revive dead players
      for (const id in this.players) {
        const player = this.players[id];
        if (player.dead) {
          player.lives = 0;
          player.dead = false;
        }
      }
      this.waveKills = 0;
      this.waveNum++;
      const wave = Game.waves[this.waveNum];
      if (wave) {
        this.totalEnemies = wave.numEnemies
        this.remainingEnemies = this.totalEnemies;
        this.chanceForEnemiesToGenerate = wave.chanceForEnemiesToGenerate;
        this.chancesForWeapons = wave.chancesForWeapons;
      } else {
        this.totalEnemies = Math.floor(this.totalEnemies * 1.25);
        this.remainingEnemies = this.totalEnemies;
        this.chanceForEnemiesToGenerate *= 1.05;
        this.chancesForWeapons = [
          // Could do anything here
          { name: 'shotgun', chance: 1.00 }
        ];
      }
    }
    static findOrCreateGame() {
      console.log('[findOrCreateGame] Current games:', numIds(GAMES));
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
    'items': Item,
  };
  // Chance starts at once per 3 seconds
  Game.defaultChanceForEnemiesToGenerate = 1 / (3 * FPS);
  Game.waves = {
    1: {
      numEnemies: 10,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.00 },
        { name: 'chaingun', chance: 0.00 },
        { name: 'rifle', chance: 0.00 },
        { name: 'burstshot', chance: 0.20 }, // high chance -> demo mechanic to user
        { name: 'flamethrower', chance: 0.00 },
        { name: 'pistol', chance: 0.80 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate,
    },
    2: {
      numEnemies: 15,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.00 },
        { name: 'chaingun', chance: 0.15 },
        { name: 'rifle', chance: 0.00 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'flamethrower', chance: 0.00 },
        { name: 'pistol', chance: 0.80 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.05,
    },
    3: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.15 },
        { name: 'chaingun', chance: 0.05 },
        { name: 'rifle', chance: 0.00 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'flamethrower', chance: 0.00 },
        { name: 'pistol', chance: 0.75 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.10,
    },
    4: {
      numEnemies: 25,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.05 },
        { name: 'chaingun', chance: 0.05 },
        { name: 'rifle', chance: 0.15 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'flamethrower', chance: 0.00 },
        { name: 'pistol', chance: 0.70 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.20,
    },
    5: {
      numEnemies: 35,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.05 },
        { name: 'chaingun', chance: 0.05 },
        { name: 'rifle', chance: 0.05 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'flamethrower', chance: 0.15 },
        { name: 'pistol', chance: 0.65 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.30,
    },
    6: {
      numEnemies: 50,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.07 },
        { name: 'chaingun', chance: 0.07 },
        { name: 'rifle', chance: 0.07 },
        { name: 'burstshot', chance: 0.07 },
        { name: 'flamethrower', chance: 0.07 },
        { name: 'pistol', chance: 0.65 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.50,
    },
  }

  /* Not using module.exports because require() is unavailable in the sandbox environment */
