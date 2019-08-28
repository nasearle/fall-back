class Map {
  constructor(tiles) {
    this.id = generateId(); // TODO: will need to do something more unique
    this.cols = 9;
    this.rows = 18;
    this.tsize = 64;
    this.tiles = tiles;
    Map.maps[this.id] = this;
  }
  getRenderData() {
    const cameraData = Camera.getCameraData();
    const startCol = Math.floor(cameraData.x / this.tsize);
    const endCol = startCol + cameraData.width / this.tsize;
    const startRow = Math.floor(cameraData.y / this.tsize);
    const endRow = startRow + cameraData.height / this.tsize;
    const offsetX = -cameraData.x + startCol * this.tsize;
    const offsetY = -cameraData.y + startRow * this.tsize;
    return {
      startCol: startCol,
      endCol: endCol,
      startRow: startRow,
      endRow: endRow,
      offsetX: offsetX,
      offsetY: offsetY
    };
  }
  getTile(col, row) {
    return this.tiles[row * this.cols + col];
  }
};

Map.maps = {};
