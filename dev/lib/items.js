class Item extends Entity {
    constructor(config) {
        super();
        this.id = generateId(); // TODO: will need to do something more unique
        this.gameId = config.gameId;
        this.x = config.x;
        this.y = config.y;
        this.name = config.name;
        this.color = Weapon.weapons[this.name].color;
        this.width = 15;
        this.height = 15;
        this.toRemove = false;
        this.speedY = -1; // TODO: camera speed should be global for all entities

        GAMES[this.gameId].items[this.id] = this;
        GAMES[this.gameId].initPack.items.push(this.getInitPack());
    }
    update() {
        if (this.y < -this.height - 5) {
            // Remove items that go offscreen
            this.toRemove = true;
        }
        super.update();
        const game = GAMES[this.gameId];

        // TODO: consider quadtree type structure for collisions
        /* Collisions with players */
        for (let id in game.players) {
            let player = game.players[id];
            if (Entity.overlaps(this, player)) {
                this.toRemove = true;
                // transform into weapon on pickup
                const convertedToWeapon = new Weapon(this.name, player);
                // if the player already has this weapon, just add ammo
                if (player.weapon.name === this.name) {
                    player.weapon.ammo += convertedToWeapon.ammo;
                } else {
                    player.weapon = convertedToWeapon;
                }
            }
        }
      }
      getInitPack() {
        return {
          id: this.id,
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          color: this.color,
          name: this.name,
        };
      }
      getUpdatePack() {
        return {
          id: this.id,
          x: this.x,
          y: this.y,
        };
      }
      static updateAll(gameId) {
        const pack = [];
        const game = GAMES[gameId];
        for (let id in game.items) {
          let item = game.items[id];
          item.update();
          if (item.toRemove) {
            delete game.items[id];
            game.removePack.items.push(item.id);
          } else {
            pack.push(item.getUpdatePack());
          }
        }
        return pack;
      }
}

/* Not using module.exports because require() is unavailable
in the sandbox environment */