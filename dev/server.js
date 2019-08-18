"use strict";

const SOCKETS = {};

/* Using a slightly hacky work around for including dependencies because we
   can't use require() inside the sandbox environment. The comment below will
   be replaced with file contents on build */
//=require lib/**/*.js

// Game loop
setInterval(() => {
  const pack = Player.updatePlayers();
  io.emit('newPosition', pack);
}, 1000 / 25);


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

    // Update all clients with current players data
    socket.emit('currentPlayers', Player.players);
    // update all other players with the new player
    socket.broadcast.emit('newPlayer', Player.players[socket.id]);

    socket.on('disconnect', () => {
      // Note: disconnect event doesn't accept "socket" argument
      console.log(`User disconnected (${socket.id})`);
      delete SOCKETS[socket.id];
      Player.onDisconnect(socket);
      io.emit('disconnect', socket.id);
    });
	}
};