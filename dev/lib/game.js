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
      // Bonus lives every 10 waves
      if (this.waveNum % 5 === 0) {
        for (const id in this.players) {
          const player = this.players[id];
          player.lives++;
        }
      }
      const wave = Game.waves[this.waveNum];
      if (wave) {
        this.totalEnemies = wave.numEnemies
        this.remainingEnemies = this.totalEnemies;
        this.chanceForEnemiesToGenerate = wave.chanceForEnemiesToGenerate;
        this.chancesForWeapons = wave.chancesForWeapons;
        if (wave.boss) {
          const boss = new Enemy(this.id, wave.boss.config);
          console.log(boss);
        }
      } else {
        this.totalEnemies = Math.max(
          Math.floor(this.totalEnemies * 1.25),
          50
        );
        this.remainingEnemies = this.totalEnemies;
        this.chanceForEnemiesToGenerate *= 1.10;
        this.chancesForWeapons = [
          { name: 'flamethrower', chance: 0.166 },
          { name: 'chaingun', chance: 0.166 },
          { name: 'shotgun', chance: 0.166 },
          { name: 'burstshot', chance: 0.166 },
          { name: 'rifle', chance: 0.166 },
          { name: 'pistol', chance: 0.17 },
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
  // Chance starts at once per 2.6 seconds
  Game.defaultChanceForEnemiesToGenerate = 1 / (2.6 * FPS);
  Game.waves = {
    /* First 3 waves -> introduce a new gun with 2 enemies */
    1: {
      numEnemies: 5,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'pistol', chance: 1.0 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate,
      // CANNOT HAVE BOSS ON FIRST WAVE - crashes
    },
    2: {
      numEnemies: 10,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'pistol', chance: 1.0 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.05,
    },
    /* Wave 3 - introduce rifle */
    3: {
      numEnemies: 15,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'rifle', chance: 0.1 },
        { name: 'pistol', chance: 0.9 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.1,
    },
    4: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'rifle', chance: 0.1 },
        { name: 'pistol', chance: 0.9 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.2,
    },
    /* Wave 5 - Mini-Boss fight, introduce burstshot */
    5: {
      numEnemies: 15,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'rifle', chance: 0.1 },
        { name: 'pistol', chance: 0.9 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.3,
      boss: {
        config: {
          weaponType: 'burstshot',
          width: 75, // vs 32
          height: 75, // vs 32
          maxSpeed: 2, // vs 2
          hp: 350, // vs 30
          hpMax: 350, // vs 30
          bulletSpeedModifier: 0.5, // vs 0.4
          chanceToShoot: 10 / FPS, // vs 1 / FPS
        },
      },
    },
    6: {
      numEnemies: 25,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'burstshot', chance: 0.1 },
        { name: 'rifle', chance: 0.05 },
        { name: 'pistol', chance: 0.85 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.4,
    },
    7: {
      numEnemies: 30,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'rifle', chance: 0.1 },
        { name: 'burstshot', chance: 0.15 },
        { name: 'pistol', chance: 0.75 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.5,
    },
    /* Wave 8 - introduce shotgun */
    8: {
      numEnemies: 30,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun', chance: 0.1 },
        { name: 'rifle', chance: 0.05 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'pistol', chance: 0.8 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.6,
    },

    /* Wave 9 - lightning round! bullet hell! */
    9: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun', chance: 0.4 },
        { name: 'burstshot', chance: 0.4 },
        { name: 'pistol', chance: 0.2 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.7,
    },

    /* Wave 10 - Boss fight?! introduce chaingun */
    10: {
      numEnemies: 10,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun', chance: 1.0 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.8,
      boss: {
        config: {
          weaponType: 'chaingun',
          width: 100, // vs 32
          height: 100, // vs 32
          maxSpeed: 2, // vs 2
          hp: 500, // vs 30
          hpMax: 500, // vs 30
          bulletSpeedModifier: 0.5, // vs 0.4
          chanceToShoot: 10 / FPS, // vs 1 / FPS
        },
      },
    },
    11: {
      numEnemies: 35,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'chaingun', chance: 0.1 },
        { name: 'shotgun', chance: 0.05 },
        { name: 'burstshot', chance: 0.05 },
        { name: 'rifle', chance: 0.05 },
        { name: 'pistol', chance: 0.75 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.4,
    },
    12: {
      numEnemies: 40,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'chaingun', chance: 0.08 },
        { name: 'shotgun', chance: 0.08 },
        { name: 'burstshot', chance: 0.08 },
        { name: 'rifle', chance: 0.08 },
        { name: 'pistol', chance: 0.68 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.4,
    },
    13: {
      numEnemies: 45,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'chaingun', chance: 0.1 },
        { name: 'shotgun', chance: 0.1 },
        { name: 'burstshot', chance: 0.1 },
        { name: 'rifle', chance: 0.1 },
        { name: 'pistol', chance: 0.6 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.4,
    },
    14: {
      numEnemies: 50,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'chaingun', chance: 0.12 },
        { name: 'shotgun', chance: 0.12 },
        { name: 'burstshot', chance: 0.12 },
        { name: 'rifle', chance: 0.12 },
        { name: 'pistol', chance: 0.52 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.4,
    },
    /* Wave 15 - Boss fight, introduce flamethrower */
    15: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun', chance: 1.0 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.8,
      boss: {
        config: {
          weaponType: 'flamethrower',
          width: 150, // vs 32
          height: 150, // vs 32
          maxSpeed: 2, // vs 2
          hp: 700, // vs 30
          hpMax: 700, // vs 30
          bulletSpeedModifier: 0.5, // vs 0.4
          chanceToShoot: 10 / FPS, // vs 1 / FPS
        },
      },
    },
    /* Wave 15 - Boss fight, introduce flamethrower */
    20: {
      numEnemies: 50,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun', chance: 1.0 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.8,
      boss: {
        config: {
          weaponType: 'flamethrower',
          width: 200, // vs 32
          height: 200, // vs 32
          maxSpeed: 2, // vs 2
          hp: 1000, // vs 30
          hpMax: 1000, // vs 30
          bulletSpeedModifier: 0.5, // vs 0.4
          chanceToShoot: 15 / FPS, // vs 1 / FPS
        },
      },
    },

    // 'example': {
    //   numEnemies: 20,
    //   chancesForWeapons: [
    //     // chances should sum to 1
    //     { name: 'shotgun',      chance: 1.00 },
    //     { name: 'chaingun',     chance: 0.00 },
    //     { name: 'rifle',        chance: 0.00 },
    //     { name: 'burstshot',    chance: 0.00 },
    //     { name: 'flamethrower', chance: 0.00 },
    //     { name: 'pistol',       chance: 0.00 },
    //   ],
    //   chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.50,
    // },
  };
  Game.allWeapons = [ 'shotgun', 'chaingun', 'rifle',
                      'burstshot',  'flamethrower', 'pistol'];

  /* Not using module.exports because require() is unavailable in the sandbox environment */
