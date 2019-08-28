class Camera {
  constructor(mapData) {
    this.x = 0;
    this.y = 0;
    this.speedX = 0;
    this.speedY = 1;
    this.width = 500;
    this.height = 500;
    this.maxX = mapData.width - this.width;
    this.maxY = mapData.height - this.height;
  }
  update() {
    this.y += this.speedY;
    // -this.height / 2;
    // max values
    // this.x = Math.max(0, Math.min(this.x, this.maxX));
    this.y = Math.max(0, Math.min(this.y, this.maxY));
  }
  static getCameraData() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }
  static getScreenPosition(point) {
    return { x: point.x - this.x, y: point.y - this.y };
  }
  static getWorldPosition(point) {
    return { x: point.x + this.x, y: point.y + this.y };
  }
}