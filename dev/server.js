"use strict";

const SOCKETS = {};
const GAMES = {};
const FPS = 25

/* Using a slightly hacky work around for including dependencies because we
   can't use require() inside the sandbox environment. The comment below will
   be replaced with file contents on build */
/* ORDER MATTERS HERE */
//=require lib/util.js
//=require lib/entity.js
//=require lib/entities/*.js
//=require lib/weapons.js
//=require lib/items.js
//=require lib/game.js

// Game loop
setInterval(() => {
  for (let id in GAMES) {
    const game = GAMES[id];
    const packs = game.getFrameUpdateData();
    io.to(game.room).emit('init', packs.initPack);
    io.to(game.room).emit('update', packs.updatePack);
    io.to(game.room).emit('remove', packs.removePack);

    // Delete empty games (otherwise they will remain with logic continuing
    // for all non-player entities). TODO: this should only be checked in
    // onDisconnect events, and not every frame. However, currently player
    // states are not always accessible in onDisconnect. See comment in Player.update
    Game.deleteIfEmpty(id);
  }
}, 1000 / FPS);


/* Exported objects here are configured as Express routes by index.js, which
runs the game server in a sandboxed environment (supplied by the competition) */
module.exports = {

  /* Example:

  statistics: (req, res) => {
    // define regular express route here for /statistics
    storage.get('games', 0).then(games => {
    	res.send(`<h1>Games played: ${games}</h1>`);
    });
  }

  */

  /* The "io" object is special - it's not configured as an Express route, but
  rather set as the handler for the web socket 'connect' event. This represents
  the first time a client connects via socket. We will define all other socket
  event listeners here (since it's the first time we will have access to the
  user's socket) */
	io: (socket) => {

    // Add client/player to a global "list" of sockets
    SOCKETS[socket.id] = socket;
    console.log(`A user connected (${socket.id})`);

    // Call the player's onConnect method to init a new player
    Player.onConnect(socket);

    socket.on('disconnect', () => {
      // Note: disconnect event doesn't accept "socket" argument
      console.log(`User disconnected (${socket.id})`);
      delete SOCKETS[socket.id];
      Player.onDisconnect(socket);
    });
	}
};
