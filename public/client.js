"use strict";

(function () {

    let socket;

    kontra.init();
    kontra.initKeys();
    let players = {};

    const addPlayer = playerInfo => {
      const player = kontra.Sprite({
        type: 'player',
        id: playerInfo.id,
        x: playerInfo.x,
        y: playerInfo.y,
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

    /**
     * Client module init
     */
    function init() {
      socket = io({ upgrade: false, transports: ["websocket"] });

      const ctx = document
        .querySelector('canvas#ctx')
        .getContext('2d');
      ctx.font = '30px Roboto';

      socket.on('currentPlayers', currentPlayers => {
        Object.keys(currentPlayers).forEach(id => {
          // console.log(currentPlayers[id]);

          addPlayer(currentPlayers[id]);
        });
        // console.log(currentPlayers);

        // console.log(players);

      });

      // socket.on('newPlayer', playerInfo => {
      //   addPlayer(playerInfo);
      // });

      // socket.on('disconnect', playerId => {
      //   otherPlayers.forEach(otherPlayer => {
      //     if (playerId === otherPlayer.playerId) {
      //       console.log('player disconnected');
      //       otherPlayer.ttl = 0;
      //       // otherPlayer.destroy();
      //     }
      //   });
      // });

      // socket.on('playerMoved', playerInfo => {
      //   otherPlayers.forEach(otherPlayer => {
      //     if (playerInfo.playerId === otherPlayer.playerId) {
      //       otherPlayer.x = playerInfo.x
      //       otherPlayer.y = playerInfo.y;
      //     }
      //   });
      // });

      socket.on('newPosition', data => {
        ctx.clearRect(0, 0, 500, 500);
        for (let i = 0; i < data.length; i++) {
          let player = data[i];
          console.log(player);

          // addPlayer(player.x, player.y, 30);
          // players[player.id].render();
          // console.log(players);

          ctx.strokeStyle = 'black';
          ctx.beginPath(); // start drawing a shape
          ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
          ctx.stroke(); // outline the circle

          // ctx.fillText(player.number, player.x, player.y);
        }
        // sprites.map(sprite => sprite.render());
      });

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
    }

    window.addEventListener("load", init, false);

})();
