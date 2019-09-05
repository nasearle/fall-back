"use strict";

(function () {

    let socket;

    kontra.init();

    /* The comment below will be replaced with file contents on build */
    //=require lib/sprites.js

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
        new PlayerSprite(playerInfo);
      });

      // will use selfId to access props of this player in the future
      let selfId = null;
      socket.on('init', data => {
        if (data.selfId) {
          selfId = data.selfId;
        }
        for (let i = 0; i < data.players.length; i++) {
          new PlayerSprite(data.players[i]);
        }
        for (let i = 0; i < data.enemies.length; i++) {
          new EnemySprite(data.enemies[i]);
        }
        for (let i = 0; i < data.bullets.length; i++) {
          new BulletSprite(data.bullets[i]);
        }
        for (let i = 0; i < data.obstacles.length; i++) {
          new ObstacleSprite(data.obstacles[i]);
        }
        for (let i = 0; i < data.items.length; i++) {
          new ItemSprite(data.items[i]);
        }
      });

      socket.on('update', data => {
        const playersData = data.players;
        for (let i = 0; i < playersData.length; i++) {
          let player = playersData[i];
          PlayerSprite.sprites[player.id].x = player.x;
          PlayerSprite.sprites[player.id].y = player.y;
          PlayerSprite.sprites[player.id].hp = player.hp;
          PlayerSprite.sprites[player.id].score = player.score;
        }
        const enemiesData = data.enemies;
        for (let i = 0; i < enemiesData.length; i++) {
          let enemy = enemiesData[i];
          EnemySprite.sprites[enemy.id].x = enemy.x;
          EnemySprite.sprites[enemy.id].y = enemy.y;
          EnemySprite.sprites[enemy.id].hp = enemy.hp;
        }
        const bulletsData = data.bullets;
        for (let i = 0; i < bulletsData.length; i++) {
          let bullet = bulletsData[i];
          BulletSprite.sprites[bullet.id].x = bullet.x;
          BulletSprite.sprites[bullet.id].y = bullet.y;
        }
        const obstaclesData = data.obstacles;
        for (let i = 0; i < obstaclesData.length; i++) {
          let obstacle = obstaclesData[i];
          ObstacleSprite.sprites[obstacle.id].x = obstacle.x;
          ObstacleSprite.sprites[obstacle.id].y = obstacle.y;
        }
        const itemsData = data.items;
        for (let i = 0; i < itemsData.length; i++) {
          let item = itemsData[i];
          ItemSprite.sprites[item.id].x = item.x;
          ItemSprite.sprites[item.id].y = item.y;
        }
      });

      socket.on('remove', data => {
        for (let i = 0; i < data.players.length; i++) {
          delete PlayerSprite.sprites[data.players[i]];
        }
        for (let i = 0; i < data.enemies.length; i++) {
          delete EnemySprite.sprites[data.enemies[i]];
        }
        for (let i = 0; i < data.bullets.length; i++) {
          delete BulletSprite.sprites[data.bullets[i]];
        }
        for (let i = 0; i < data.obstacles.length; i++) {
          delete ObstacleSprite.sprites[data.obstacles[i]];
        }
        for (let i = 0; i < data.items.length; i++) {
          delete ItemSprite.sprites[data.items[i]];
        }
      });

      // Use requestAnimationFrame to ensure paints happen performantly
      const renderLoop = () => {
        // For debug
        const numEnemies = Object.keys(EnemySprite.sprites).length;
        document.querySelector('span#num-enemies').textContent = numEnemies;

        if (PlayerSprite.sprites[selfId]) {
          document.querySelector('span#player-score').textContent =
            PlayerSprite.sprites[selfId].score;
        }

        ctx.clearRect(0, 0, 500, 500);
        for (let i in PlayerSprite.sprites) {
          const player = PlayerSprite.sprites[i];
          player.render();
        }
        for (let i in EnemySprite.sprites) {
          const enemy = EnemySprite.sprites[i];
          enemy.render();
        }
        for (let i in BulletSprite.sprites) {
          const bullet = BulletSprite.sprites[i];
          bullet.render();
        }
        for (let i in ObstacleSprite.sprites) {
          const obstacle = ObstacleSprite.sprites[i];
          obstacle.render();
        }
        for (let i in ItemSprite.sprites) {
          const item = ItemSprite.sprites[i];
          item.render();
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
