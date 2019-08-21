"use strict";

(function () {

    let socket;

    kontra.init();
    const players = {};
    const enemies = {};
    const bullets = {};

    const addPlayer = playerInfo => {
      const player = kontra.Sprite({
        type: 'player',
        id: playerInfo.id,
        x: playerInfo.x,
        y: playerInfo.y,
        hp: playerInfo.hp,
        hpMax: playerInfo.hpMax,
        score: playerInfo.score,
        radius: 30,
        render() {
          this.context.strokeStyle = 'black';
          this.context.beginPath(); // start drawing a shape
          this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          this.context.stroke(); // outline the circle
        },
      });
      players[player.id] = player;
    };

    const addEnemy = enemyInfo => {
      const enemy = kontra.Sprite({
        type: 'enemy',
        id: enemyInfo.id,
        x: enemyInfo.x,
        y: enemyInfo.y,
        hp: enemyInfo.hp,
        radius: 30,
        render() {
          this.context.strokeStyle = 'red';
          this.context.beginPath(); // start drawing a shape
          this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          this.context.stroke(); // outline the circle
        },
      });
      enemies[enemy.id] = enemy;
    };

    const addBullet = bulletInfo => {
      const bullet = kontra.Sprite({
        type: 'bullet',
        id: bulletInfo.id,
        x: bulletInfo.x,
        y: bulletInfo.y,
        render() {
          this.context.strokeStyle = 'black';
          this.context.fillRect(this.x, this.y, 10, 10);
        },
      });
      bullets[bullet.id] = bullet;
    };

    /**
     * Client module init
     */
    function init() {
      socket = io({ upgrade: false, transports: ["websocket"] });

      const ctx = document
        .querySelector('canvas#ctx')
        .getContext('2d');
      ctx.font = '30px Roboto';

      socket.on('newPlayer', playerInfo => {
        addPlayer(playerInfo);
      });

      // will use selfId to access props of this player in the future
      let selfId = null;
      socket.on('init', data => {
        if (data.selfId) {
          selfId = data.selfId;
        }
        for (let i = 0; i < data.players.length; i++) {
          addPlayer(data.players[i]);
        }
        for (let i = 0; i < data.enemies.length; i++) {
          addEnemy(data.enemies[i]);
        }
        for (let i = 0; i < data.bullets.length; i++) {
          addBullet(data.bullets[i]);
        }
      });

      socket.on('update', data => {
        const playersData = data.players;
        for (let i = 0; i < playersData.length; i++) {
          let player = playersData[i];
          players[player.id].x = player.x;
          players[player.id].y = player.y;
          players[player.id].hp = player.hp;
          players[player.id].score = player.score;
        }
        const enemiesData = data.enemies;
        for (let i = 0; i < enemiesData.length; i++) {
          let enemy = enemiesData[i];
          enemies[enemy.id].x = enemy.x;
          enemies[enemy.id].y = enemy.y;
          enemies[enemy.id].hp = enemy.hp;
        }
        const bulletsData = data.bullets;
        for (let i = 0; i < bulletsData.length; i++) {
          let bullet = bulletsData[i];
          bullets[bullet.id].x = bullet.x;
          bullets[bullet.id].y = bullet.y;
        }
      });

      socket.on('remove', data => {
        for (let i = 0; i < data.players.length; i++) {
          delete players[data.players[i]];
        }
        for (let i = 0; i < data.enemies.length; i++) {
          delete enemies[data.enemies[i]];
        }
        for (let i = 0; i < data.bullets.length; i++) {
          delete bullets[data.bullets[i]];
        }
      });

      socket.on('disconnect', playerId => {
        delete players[playerId];
      });

      // Use requestAnimationFrame to ensure paints happen performantly
      const renderLoop = () => {
        // For debug
        const numEnemies = Object.keys(enemies).length;
        document.querySelector('span#num-enemies').textContent = numEnemies;

        ctx.clearRect(0, 0, 500, 500);
        for (let i in players) {
          const player = players[i];
          player.render();
        }
        for (let i in enemies) {
          const enemy = enemies[i];
          enemy.render();
        }
        for (let i in bullets) {
          const bullet = bullets[i];
          bullet.render();
        }
        window.requestAnimationFrame(renderLoop);
      };
      window.requestAnimationFrame(renderLoop);

      const keyMap = {
        68: 'right', // d
        65: 'left', // a
        87: 'up', // w
        83: 'down', // s
      };

      document.onkeydown = event => {
        socket.emit('keyPress', {
          inputId: keyMap[event.keyCode],
          state: true,
        });
      };
      document.onkeyup = event => {
        socket.emit('keyPress', {
          inputId: keyMap[event.keyCode],
          state: false,
        });
      };
      document.onmousedown = event => {
        socket.emit('keyPress', { inputId: 'shoot', state: true });
      };
      document.onmouseup = event => {
        socket.emit('keyPress', { inputId: 'shoot', state: false });
      };
      document.onmousemove = event => {
        // Calculate angle on server using player position
        /* Note that the camera can't be centered on player locally because camera will be shifting downwards */
        const mousePosition = {
          x: event.clientX,
          y: event.clientY
        };
        socket.emit('keyPress', {
          inputId: 'mouseAngle',
          state: mousePosition,
        });
      };

    }

    window.addEventListener("load", init, false);

})();
