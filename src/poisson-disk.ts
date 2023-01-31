interface Point {
  x: number; y: number;
}

interface Grid {
  width: number;
  height: number;
  cellSize: number;
  data: (Point | null)[];
}

export class PoissonDisk {


  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  radius: number;
  k: number;
  random: () => number;
  pointQueue: Point[] = [];
  firstPoint: boolean = true;

  grid: Grid = {
    width: 0,
    height: 0,
    cellSize: 0,
    data: []
  };

  constructor(viewport: [number, number, number, number], minDistance: number = 1, maxTries: number = 30, rng?: () => number) {
    this.xMin = viewport[0];
    this.xMax = viewport[1];
    this.yMin = viewport[2];
    this.yMax = viewport[3];
    this.radius = Math.max(minDistance, 1);
    this.k = Math.max(maxTries, 2);
    this.random = rng ?? Math.random;
    this.grid.cellSize = this.radius * Math.SQRT1_2;
    this.grid.width = Math.ceil((this.xMax - this.xMin) / this.grid.cellSize);
    this.grid.height = Math.ceil((this.yMax - this.yMin) / this.grid.cellSize);
    this.grid.data = new Array(this.grid.width * this.grid.height);
    this.initializeState();
  }

  reset() {
    this.initializeState();
  }

  next() {
    return this.nextPoint();
  }

  all(): Point[] {
    this.initializeState();
    return this.allPoints();
  }

  done(): boolean {
    return !this.firstPoint && this.pointQueue.length == 0;
  }

  private initializeState() {
    this.pointQueue = new Array(0);
    this.firstPoint = true;
    for (let i = 0; i < this.grid.data.length; i++) {
      this.grid.data[i] = null;
    }
  }

  private dist2(x1: number, y1: number, x2: number, y2: number): number {
    return ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
  }

  private createNewPoint(x: number, y: number): Point {
    const point = { x: x, y: y };
    const index = Math.floor(x / this.grid.cellSize) + Math.floor(y / this.grid.cellSize) * this.grid.width;
    this.grid.data[index] = point;
    this.pointQueue.push(point);
    return point;
  }

  private isValidPoint(x: number, y: number) {
    if (x < this.xMin || x > this.xMax || y < this.yMin || y > this.yMax) {
      return false;
    }
    const col = Math.floor((x - this.xMin) / this.grid.cellSize);
    const row = Math.floor((y - this.yMin) / this.grid.cellSize);
    let idx = 0, i = 0, j = 0;
    for (i = col - 2; i <= col + 2; i++) {
      for (j = row - 2; j <= row + 2; j++) {
        if (i >= 0 && i < this.grid.width && j >= 0 && j < this.grid.height) {
          idx = i + (j * this.grid.width);
          if (this.grid.data[idx] !== null &&
            this.dist2(x, y, this.grid.data[idx]!.x, this.grid.data[idx]!.y) <= (this.radius * this.radius)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private nextPoint(): Point | null {
    let x = 0
    let y = 0;
    if (this.firstPoint) {
      this.firstPoint = false;
      x = this.xMin + (this.xMax - this.xMin) * this.random();
      y = this.yMin + (this.yMax - this.yMin) * this.random();
      return this.createNewPoint(x, y);
    }
    let idx = 0, distance = 0, angle = 0
    while (this.pointQueue.length > 0) {
      idx = (this.pointQueue.length * this.random()) | 0;
      for (let i = 0; i < this.k; i++) {
        distance = this.radius * (this.random() + 1);
        angle = 2 * Math.PI * this.random();
        x = this.pointQueue[idx].x + distance * Math.cos(angle);
        y = this.pointQueue[idx].y + distance * Math.sin(angle);
        if (this.isValidPoint(x, y)) {
          return this.createNewPoint(x, y);
        }
      }
      this.pointQueue.splice(idx, 1);
    }
    return null;
  }

  private allPoints(): Point[] {
    let point = null;
    const result = new Array<Point>(0);
    while (true) {
      point = this.nextPoint();
      if (point == null) {
        break;
      }
      else {
        result.push(point);
      }
    }
    return result;
  }
}
