"use strict";

(function () {

    let socket;

    kontra.init();
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
          addPlayer(currentPlayers[id]);
        });
      });

      socket.on('newPlayer', playerInfo => {
        addPlayer(playerInfo);
      });

      socket.on('disconnect', playerId => {
        delete players[playerId];
      });

      // Update local positions only, drawing should be in renderLoop
      socket.on('newPosition', data => {
        for (let i = 0; i < data.length; i++) {
          let player = data[i];
          players[player.id].x = player.x;
          players[player.id].y = player.y;
        }
      });

      // Use requestAnimationFrame to ensure paints happen perfomantly
      const renderLoop = () => {
        ctx.clearRect(0, 0, 500, 500);
        for (let i in players) {
          let player = players[i];
          player.render();
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
    }

    window.addEventListener("load", init, false);

})();
