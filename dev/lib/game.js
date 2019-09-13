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
        this.chancesForWeapons = Game.generateWeightedRandomItems(Game.allWeapons);
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
    static generateWeightedRandomItems(weaponsList) {
      let cumulativeChance = 0;
      const chancesForWeapons = [];

      // Bias so that pistol is always included
      const pistolChance = Math.min(Math.random(), 0.5);
      chancesForWeapons.push({ name: 'pistol', chance: pistolChance });
      weaponsList.splice(weaponsList.indexOf('pistol'), 1);
      cumulativeChance += pistolChance

      // Distribute remaining chance over other weapons
      for (let i = 0; i < weaponsList.length; i++) {
          const randomIndex = Math.floor(Math.random() * weaponsList.length);
          const randomWeapon = weaponsList[randomIndex];
          const randomChance = Math.random();
          const remainingChance = 1 - cumulativeChance;
          if (randomChance <= remainingChance) {
              chancesForWeapons.push({ name: randomWeapon, chance: randomChance });
              cumulativeChance += randomChance
          } else {
              chancesForWeapons.push({ name: randomWeapon, chance: remainingChance });
              cumulativeChance += remainingChance
              break;
          }
      }
      if (cumulativeChance < 1) {
          chancesForWeapons.push({ name: 'pistol', chance: 1 - cumulativeChance });
      }
      return chancesForWeapons;
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

    /* First 3 waves -> introduce a new gun with 2 enemies */
    1: {
      numEnemies: 10,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'burstshot', chance: 0.20 },
        { name: 'pistol',    chance: 0.80 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate,
      // CANNOT HAVE BOSS ON FIRST WAVE - crashes
    },
    2: {
      numEnemies: 15,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'chaingun', chance: 0.14 },
        { name: 'pistol',   chance: 0.86 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.05,
    },
    3: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',  chance: 0.10 },
        { name: 'pistol',   chance: 0.90 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.10,
    },

    /* Waves 4 & 5 -> introduce a new gun with 5 enemies */
    4: {
      numEnemies: 25,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'rifle',  chance: 0.20 },
        { name: 'pistol', chance: 0.80 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.20,
    },
    5: {
      numEnemies: 35,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'flamethrower', chance: 0.14 },
        { name: 'pistol',       chance: 0.86 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.30,
    },

    /* Wave 6 - lightning round! bullet hell! */
    6: {
      numEnemies: 20,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',    chance: 0.50 },
        { name: 'burstshot',  chance: 0.50 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.40,
    },

    /* Wave 7 & 8 - mixed guns */
    7: {
      numEnemies: 40,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',      chance: 0.05 },
        { name: 'chaingun',     chance: 0.05 },
        { name: 'rifle',        chance: 0.05 },
        { name: 'burstshot',    chance: 0.05 },
        { name: 'flamethrower', chance: 0.05 },
        { name: 'pistol',       chance: 0.75 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.50,
    },
    8: {
      numEnemies: 40,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'shotgun',      chance: 0.10 },
        { name: 'chaingun',     chance: 0.10 },
        { name: 'rifle',        chance: 0.10 },
        { name: 'burstshot',    chance: 0.10 },
        { name: 'flamethrower', chance: 0.10 },
        { name: 'pistol',       chance: 0.50 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.60,
    },

    /* Wave 9 - deception... */
    9: {
      numEnemies: 5,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'pistol', chance: 1.00 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.70,
    },

    /* Wave 10 - Boss fight?! */
    10: {
      numEnemies: 3,
      chancesForWeapons: [
        // chances should sum to 1
        { name: 'pistol', chance: 1.00 },
      ],
      chanceForEnemiesToGenerate: Game.defaultChanceForEnemiesToGenerate * 1.80,
      boss: {
        config: {
          weaponType: 'flamethrower',
          width: 50, // vs 32
          height: 50, // vs 32
          maxSpeed: 2, // vs 2
          hp: 150, // vs 30
          hpMax: 150, // vs 30
          bulletSpeedModifier: 0.5, // vs 0.4
          chanceToShoot: 10 / FPS, // vs 1 / FPS
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
  }
  Game.allWeapons = [ 'shotgun', 'chaingun', 'rifle',
                      'burstshot',  'flamethrower', 'pistol'];

  /* Not using module.exports because require() is unavailable in the sandbox environment */
