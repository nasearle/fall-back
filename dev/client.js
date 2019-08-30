"use strict";

(function () {

    let socket;

    kontra.init();
    const players = {};
    const enemies = {};
    const bullets = {};
    const obstacles = {};

    const addPlayer = playerInfo => {
      const player = kontra.Sprite({
        type: 'player',
        id: playerInfo.id,
        x: playerInfo.x,
        y: playerInfo.y,
        width: playerInfo.width,
        height: playerInfo.height,
        hp: playerInfo.hp,
        hpMax: playerInfo.hpMax,
        score: playerInfo.score,
        render() {
          this.context.strokeStyle = 'green';
          this.context.strokeRect(this.x, this.y, this.width, this.height);
          // just to see where x & y are in the rect (top left)
          this.context.fillStyle = 'black';
          this.context.fillRect(this.x, this.y, 5, 5);
        },
      });
      players[player.id] = player;
    };

    let image = new Image();
    image.src = 'assets/alien-32.png';
    const addEnemy = enemyInfo => {
      const enemy = kontra.Sprite({
        type: 'enemy',
        id: enemyInfo.id,
        x: enemyInfo.x,
        y: enemyInfo.y,
        width: enemyInfo.width,
        height: enemyInfo.height,
        hp: enemyInfo.hp,
        image: image
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
          this.context.fillRect(this.x, this.y, 10, 10);
        },
      });
      bullets[bullet.id] = bullet;
    };

    const addObstacle = obstacleInfo => {
      const obstacle = kontra.Sprite({
        type: 'obstacle',
        id: obstacleInfo.id,
        x: obstacleInfo.x,
        y: obstacleInfo.y,
        width: obstacleInfo.width,
        height: obstacleInfo.height,
        render() {
          this.context.fillStyle = 'grey';
          this.context.fillRect(this.x, this.y, this.width, this.height);
        },
      });
      obstacles[obstacle.id] = obstacle;
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
        for (let i = 0; i < data.obstacles.length; i++) {
          addObstacle(data.obstacles[i]);
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
        const obstaclesData = data.obstacles;
        for (let i = 0; i < obstaclesData.length; i++) {
          let obstacle = obstaclesData[i];
          obstacles[obstacle.id].x = obstacle.x;
          obstacles[obstacle.id].y = obstacle.y;
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
        for (let i = 0; i < data.obstacles.length; i++) {
          delete obstacles[data.obstacles[i]];
        }
      });

      // Use requestAnimationFrame to ensure paints happen performantly
      const renderLoop = () => {
        // For debug
        const numEnemies = Object.keys(enemies).length;
        document.querySelector('span#num-enemies').textContent = numEnemies;

        if (players[selfId]) {
          document.querySelector('span#player-score').textContent =
            players[selfId].score;
        }

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
        for (let i in obstacles) {
          const obstacle = obstacles[i];
          obstacle.render();
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
