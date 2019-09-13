"use strict";

(function () {

    let socket;
    let STATE = {
      waveNum: 1, // prevent wave 1 toast from showing immediately
      teamScore: 0,
    };

    function hexToRGB(hex) {
      let hexString = hex.charAt(0) == '#' ? hex.substring(1) : hex;
      if (hexString.length == 3) {
        hexString += hexString;
      }
      const r = parseInt(hexString.substring(0, 2), 16);
      const g = parseInt(hexString.substring(2, 4), 16);
      const b = parseInt(hexString.substring(4, 6), 16);
      return [r, g, b];
    }

    /* The comment below will be replaced with file contents on build */
    //=require lib/sound-effects.js
    //=require lib/background-music.js
    //=require lib/sonantx-reduced.js
    //=require lib/audio.js
    //=require lib/sprites.js
    audioInit();

    /**
     * Client module init
     */
    function init() {
      socket = io({ upgrade: false, transports: ["websocket"] });

      function getViewportDimensions() {
        // Different on different browsers?
        return {
          width: Math.min(window.innerWidth, document.body.clientWidth),
          height: Math.min(window.innerHeight, document.body.clientHeight)
        };
      }

      const startScreen = document.querySelector('#startScreen');
      const gameOverScreen = document.querySelector('#gameOverScreen');
      const gameUi = document.querySelector('#gameUi');
      const btnStartGame = document.querySelector('#btnStartGame');
      btnStartGame.onclick = () => {
        STATE = {
          waveNum: 1,
          teamScore: 0,
        };
        const viewportDimensions = getViewportDimensions();
        socket.emit('startGame', {
          viewportDimensions: viewportDimensions,
        });
        window.requestAnimationFrame(renderLoop);
        // Show initial first wave toast after some delay
        setTimeout(() => {
          showToast();
        }, 2000);
      }
      btnPlayAgain.onclick = () => {
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
      };

      const CANVAS = document.querySelector('canvas#ctx');
      const CTX = CANVAS.getContext('2d');
      function setCanvasDetails(viewportDimensions) {
        CANVAS.width = viewportDimensions.width;
        CANVAS.height = viewportDimensions.height;

        // Canvas settings get reset on resize
        CTX.font = '12px Courier New';
        CTX.textAlign = 'center';
      }
      window.onresize = () => {
        const viewportDimensions = getViewportDimensions();
        setCanvasDetails(viewportDimensions);
        socket.emit('viewportResize', viewportDimensions);
      }
      const viewportDimensions = getViewportDimensions();
      setCanvasDetails(viewportDimensions);

      /* Full screen capability */
      document.fullscreenElement = document.fullscreenElement    ||
                                   document.mozFullscreenElement ||
                                   document.msFullscreenElement  ||
                                   document.webkitFullscreenDocument;
      document.exitFullscreen    = document.exitFullscreen       ||
                                   document.mozExitFullscreen    ||
                                   document.msExitFullscreen     ||
                                   document.webkitExitFullscreen;
      function toggleFullscreen() {
        const elem = document.querySelector('body');
        elem.requestFullscreen = elem.requestFullscreen    ||
                                 elem.mozRequestFullscreen ||
                                 elem.msRequestFullscreen  ||
                                 elem.webkitRequestFullscreen;
        if (!document.fullscreenElement) {
          elem.requestFullscreen().then({}).catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      }

      socket.on('newPlayer', playerInfo => {
        new PlayerSprite(playerInfo);
      });

      // will use selfId to access props of this player in the future
      let selfId = null;
      socket.on('init', data => {
        startScreen.classList.add('hidden');
        gameUi.classList.remove('hidden');
        if (data.selfId) {
          selfId = data.selfId;
        }
        for (let i = 0; i < data.players.length; i++) {
          const player = data.players[i];
          if (player.id === selfId) {
            document.querySelector('.hud').style.color = player.color;
          }
          new PlayerSprite(data.players[i]);
        }
        for (let i = 0; i < data.enemies.length; i++) {
          new EnemySprite(data.enemies[i]);
        }
        for (let i = 0; i < data.bullets.length; i++) {
          const bullet = data.bullets[i];
          if (bullet.parentId == selfId) {
            audioPlay(audioSfxPistolShot);
          }
          new BulletSprite(bullet);
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
          if (
            player.id == selfId &&
            PlayerSprite.sprites[player.id].hp > player.hp
          ) {
            audioPlay(audioSfxPlayerDamaged);
          }
          PlayerSprite.sprites[player.id].hp = player.hp;
          PlayerSprite.sprites[player.id].score = player.score;
          PlayerSprite.sprites[player.id].lives = player.lives;
          PlayerSprite.sprites[player.id].weaponName = player.weaponName;
          PlayerSprite.sprites[player.id].weaponAmmo = player.weaponAmmo;
          PlayerSprite.sprites[player.id].diedAt = player.diedAt;
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
          const enemyToRemove = EnemySprite.sprites[data.enemies[i]];
          enemyToRemove.dead = true;
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

      const waveToast = document.querySelector('.toast#wave-toast');
      const waveNumToast = document.querySelector('span#wave-num-toast');
      function showToast() {
        waveNumToast.textContent = STATE.waveNum;
        waveToast.classList.add('show');
        setTimeout(() => {
          waveToast.classList.remove('show');
        }, 4000); // must be animation length (fade in + duration)
      };

      socket.on('state', data => {
        STATE.totalEnemies = data.totalEnemies;
        STATE.waveKills = data.waveKills;
        if (data.waveNum !== STATE.waveNum) {
          STATE.waveNum = data.waveNum;
          showToast();
        }
      });

      socket.on('gameOver', () => {
        STATE.gameOver = true;
        const teamScoreElem = document.querySelector('#stats-team-score');
        const playerScoreElem = document.querySelector('#stats-player-score');
        const waveReachedElem = document.querySelector('#stats-wave-reached');

        teamScoreElem.textContent = STATE.teamScore;
        playerScoreElem.textContent = PlayerSprite.sprites[selfId].score;
        waveReachedElem.textContent = STATE.waveNum;
        gameOverScreen.classList.remove('hidden');
        gameUi.classList.add('hidden');
        for (let id in PlayerSprite.sprites) {
          delete PlayerSprite.sprites[id];
        }
        for (let id in EnemySprite.sprites) {
          delete EnemySprite.sprites[id];
        }
        for (let id in BulletSprite.sprites) {
          delete BulletSprite.sprites[id];
        }
        for (let id in ObstacleSprite.sprites) {
          delete ObstacleSprite.sprites[id];
        }
        for (let id in ItemSprite.sprites) {
          delete ItemSprite.sprites[id];
        }
      });

      // Use requestAnimationFrame to ensure paints happen performantly
      const renderLoop = () => {
        if (STATE.gameOver) {
          return;
        }
        const enemiesRemainingInWave = STATE.totalEnemies - STATE.waveKills;
        const enemiesRemainingElem = document.querySelector('span#enemies-remaining');
        enemiesRemainingElem.textContent = enemiesRemainingInWave;

        const waveNumElem = document.querySelector('span#wave-num');
        waveNumElem.textContent = STATE.waveNum;

        let teamScore = 0;
        const teamScoreElem = document.querySelector('span#team-score'   );
        const playerScore   = document.querySelector('span#player-score' );
        const playerLives   = document.querySelector('span#player-lives' );
        const playerAmmo    = document.querySelector('span#player-ammo'  );
        const playerWeapon  = document.querySelector('span#player-weapon');
        for (let playerId in PlayerSprite.sprites) {
          const player = PlayerSprite.sprites[playerId];
          if (player.id === selfId) {
            playerScore.textContent  = player.score;
            playerLives.textContent  = (player.lives >= 0) ? player.lives : 0;
            playerAmmo.textContent   = player.weaponAmmo;
            playerWeapon.textContent = player.weaponName;
            playerAmmo.textContent   = Math.min(player.weaponAmmo, 99999);
          }
          teamScore += player.score;
          STATE.teamScore = teamScore;
        }
        teamScoreElem.textContent = teamScore;

        CTX.fillStyle = 'black';
        CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);

        for (let i in ObstacleSprite.sprites) {
          const obstacle = ObstacleSprite.sprites[i];
          obstacle.render();
        }
        for (let i in PlayerSprite.sprites) {
          const player = PlayerSprite.sprites[i];
          if (player.diedAt) {
            player.deathAnimationFrame += 1;
          } else {
            player.deathAnimationFrame = 0;
          }
          player.render();
        }
        for (let i in EnemySprite.sprites) {
          const enemy = EnemySprite.sprites[i];
          if (enemy.dead) {
            enemy.deathAnimationFrame += 1;
          }
          enemy.render();
          if (enemy.deathAnimationFrame >= enemy.deathAnimationTotalFrames) {
            delete EnemySprite.sprites[enemy.id];
          }
        }
        for (let i in ItemSprite.sprites) {
          const item = ItemSprite.sprites[i];
          item.render();
        }
        for (let i in BulletSprite.sprites) {
          const bullet = BulletSprite.sprites[i];
          bullet.render();
        }
        window.requestAnimationFrame(renderLoop);
      };

      const keyMap = {
        'KeyD': 'right', // d
        'KeyA': 'left', // a
        'KeyW': 'up', // w
        'KeyS': 'down', // s
        70: 'fullscreen', // f
        77: 'mute', // m
      };

      document.onkeydown = event => {
        event.preventDefault();
        if (keyMap[event.keyCode] === 'fullscreen') {
          toggleFullscreen();
          return;
        }
        if (keyMap[event.keyCode] === 'mute') {
          toggleSound();
          return;
        }
        socket.emit('keyPress', {
          inputId: keyMap[event.code],
          state: true,
        });
      };
      document.onkeyup = event => {
        socket.emit('keyPress', {
          inputId: keyMap[event.code],
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
