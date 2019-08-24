const tileEngine = {
  // tile size
  tilewidth: 64,
  tileheight: 64,

  // map size in tiles
  width: 9,
  height: 9,

  // tileset object
  tilesets: [{
    firstgid: 1,
    // image: img
  }],

  // layer object
  layers: [{
    name: 'ground',
    data: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  1,  1,  1,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            1,  1,  1,  0,  0,  1,  1,  1,  1,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  1,  1,  1,
            0,  1,  1,  1,  1,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0 ]
  }]
};
