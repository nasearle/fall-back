class Weapon {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        const weapon = Weapon.weapons[name];
        for (let key in weapon) {
            this[key] = weapon[key];
        }
    }
    ableToShoot() {
        const currentTime = new Date().getTime();
        const timeSinceShot = currentTime - this.timeLastShot;
        const isCool = timeSinceShot > this.coolDown;
        const hasAmmo = this.ammo > 0;
        return isCool && hasAmmo;
    }
    attemptShoot(angle) {
        if (this.ableToShoot()) {
            this.shootFunction(angle, this);
        }
    }
    decrementAmmo() {
        /* Only decrement ammo for player. This serves two purposes
        1. Enemies have infinite ammo
        2. Dropped guns will always have the expected amount of ammo */
        if (this.parent.type === 'player') {
            this.ammo -= 1;
        }
    }

    /* Functions for shooting different guns */
    static basicShoot(angle, weapon) {
        if (weapon.ableToShoot()) {
            new Bullet({
                angle: angle,
                parent: weapon.parent,
            });
            weapon.decrementAmmo();
            weapon.timeLastShot = new Date().getTime();
        }
    }
    static spreadShot(angle, weapon) {
        if (weapon.ableToShoot()) {
            const offsets = [-10, -5, 0, 5, 10];
            offsets.forEach(offset => {
                new Bullet({
                    angle: angle + offset,
                    parent: weapon.parent,
                });
            });
            weapon.decrementAmmo();
            weapon.timeLastShot = new Date().getTime();
        }
    }
    static burstShot(angle, weapon) {
        if (weapon.ableToShoot()) {
            const offsets = [-2, 0, 2];
            offsets.forEach(offset => {
                new Bullet({
                    angle: angle + offset,
                    parent: weapon.parent,
                });
            });
            weapon.decrementAmmo();
            weapon.timeLastShot = new Date().getTime();
        }
    }
    static flameShot(angle, weapon) {
        if (weapon.ableToShoot()) {
            const offset = getRandomInt(-10, 10);
            new Bullet({
                angle: angle + offset,
                parent: weapon.parent,
            });
            weapon.decrementAmmo();
            weapon.timeLastShot = new Date().getTime();
        }
    }
}
Weapon.weapons = {
    /*
    - "coolDown" property is milliseconds, indepedent of FPS
    - Number.MAX_SAFE_INTEGER is effectively infinite ammo
    - Note thats speeds above enemy hitbox (32), risk "skipping" enemy collision
    */

    // default player gun, has inf ammo
    'pistol': {
        damage: 10,
        speed: 30,
        timeLastShot: 0,
        coolDown: 400,
        ammo: Number.MAX_SAFE_INTEGER,
        shootFunction: Weapon.basicShoot,
        dropable: false,
    },
    'chaingun': {
        damage: 10,
        speed: 30,
        timeLastShot: 0,
        coolDown: 40,
        ammo: getRandomInt(75, 125),
        shootFunction: Weapon.basicShoot,
        dropable: true,
        color: 'whitesmoke',
    },
    'shotgun': {
        damage: 20,
        speed: 30,
        timeLastShot: 0,
        coolDown: 800,
        ammo: getRandomInt(15, 25),
        shootFunction: Weapon.spreadShot,
        dropable: true,
        color: 'whitesmoke',
    },
    'rifle': {
        damage: 30,
        speed: 40, // some risk of missing enemy, see notes above
        timeLastShot: 0,
        coolDown: 200,
        ammo: getRandomInt(30, 50),
        shootFunction: Weapon.basicShoot,
        dropable: true,
        color: 'whitesmoke',
    },
    'burstshot': {
        damage: 15,
        speed: 30,
        timeLastShot: 0,
        coolDown: 500,
        ammo: getRandomInt(10, 20),
        shootFunction: Weapon.burstShot,
        dropable: true,
        color: 'whitesmoke',
    },
    'flamethrower': {
        damage: 10,
        speed: 30,
        timeLastShot: 0,
        coolDown: 20,
        ammo: getRandomInt(150, 300),
        shootFunction: Weapon.flameShot,
        dropable: true,
        color: 'whitesmoke',
    },
};

/* Not using module.exports because require() is unavailable in the sandbox environment */