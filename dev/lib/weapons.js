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
}
Weapon.weapons = {
    /*
    - "coolDown" property is milliseconds, indepedent of FPS
    - Number.MAX_SAFE_INTEGER is effectively infinite ammo
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
        ammo: 100,
        shootFunction: Weapon.basicShoot,
        dropable: true,
        color: 'red',
    },
    'shotgun': {
        damage: 20,
        speed: 30,
        timeLastShot: 0,
        coolDown: 800,
        ammo: 20,
        shootFunction: Weapon.spreadShot,
        dropable: true,
        color: 'blue',
    }
};

/* Not using module.exports because require() is unavailable in the sandbox environment */