function layerCollidesWith(name, object) {
  let row = getRow(object.y);
  let col = getCol(object.x);
  let endRow = getRow(object.y + object.height);
  let endCol = getCol(object.x + object.width);

  let layer = layerMap[name];

  // check all tiles
  for (let r = row; r <= endRow; r++) {
    for (let c = col; c <= endCol; c++) {
      if (layer.data[c + r * this.width]) {
        return true;
      }
    }
  }

  return false;
}

function getRow(y) {
  return ((tileEngine.sy + y) / tileEngine.tileheight) | 0;
}

function getCol(x) {
  return ((tileEngine.sx + x) / tileEngine.tilewidth) | 0;
}