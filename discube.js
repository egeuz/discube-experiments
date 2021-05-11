let discube;

function setup() {
  createCanvas(windowWidth, windowHeight).parent("canvas");
  rectMode(CENTER);
  colorMode(HSB, 1);
  discube = new Discube(
    createVector(width / 2, height / 2),
    200
  );
  discube.init();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background("#111111");
  noStroke();
  discube.update();
  discube.render();
}

class Discube {
  constructor(pos, radius) {
    this.position = pos;
    this.center = pos;
    this.radius = radius;
    //computed properties
    this.cubeFragments;
  }

  init() {
    this.cubeFragments = this.initCubeFragments();
  }

  initCubeFragments() {
    const { position, center, radius } = this;
    return new Array(3)
      .fill(0)
      .map((_n, i) => {
        const hexPoints = [
          (i * 2) % 6,
          (i * 2 + 1) % 6,
          (i * 2 + 2) % 6
        ]
        const hue = random();
        const clr = color(hue, 0.6, 1);
        return new CubeFragment({
          position,
          center,
          radius,
          hexPoints,
          color: clr
        }).init()
      })
  }

  update() {
    this.center = createVector(mouseX, mouseY)
    this.cubeFragments.forEach(frag => frag.update(this.center))
  }

  render() {
    this.cubeFragments.forEach(frag => frag.render())
  }
}

class CubeFragment {
  constructor({ center, position, radius, hexPoints, color }) {
    this.center = center;
    this.position = position;
    this.radius = radius;
    this.hexPoints = hexPoints;
    this.color = color;
    //computed properties
    this.basePoints;
    this.line1;
    this.line2;
  }

  init() {
    this.basePoints = this.calculateBasePoints()
    this.initFluidLines()
    return this
  }

  initFluidLines() {
    this.line1 = new FluidLine(this.center, this.basePoints[0])
    this.line2 = new FluidLine(this.center, this.basePoints[2], true)
  }

  update(center) {
    this.center = center;
    this.basePoints = this.calculateBasePoints()
    this.line1.update(this.center, this.basePoints[0])
    this.line2.update(this.center, this.basePoints[2])
  }

  calculateBasePoints() {
    const { x, y } = this.position;
    return this.hexPoints.map(pt => {
      const angle = TWO_PI / 6 * pt;
      const px = x + sin(angle) * this.radius;
      const py = y + cos(angle) * this.radius;
      return createVector(px, py)
    })
  }

  render() {
    let points = [...this.line1.locations, ...this.basePoints, ...this.line2.locations];
    push()
    fill(this.color)
    beginShape()
    points.map(({ x, y }) => vertex(x, y))
    endShape(CLOSE)
    pop()
  }
}

class FluidLine {
  constructor(center, anchor, reversed) {
    this.center = center;
    this.anchor = anchor;
    this.segmentLength = 8;
    this.segmentAmount = 50;
    //computed properties
    this.reversed = reversed;
    this.target = createVector();
    this.angles = new Array(this.segmentAmount).fill(0);
    this.locations = new Array(this.segmentAmount).fill(createVector(0, 0));

    if (reversed) {
      this.locations[this.locations.length - 1] = center;
    } else {
      this.locations[this.locations.length - 1] = anchor;
    }

  }

  update(center, anchor) {
    this.setCenter(center)
    this.setAnchor(anchor)
    this.stretchLine()
  }

  setCenter(center) {
    this.center = center;
    if (this.reversed) this.locations[this.locations.length - 1] = center;
  }

  setAnchor(anchor) {
    this.anchor = anchor;
    if (!this.reversed) this.locations[this.locations.length - 1] = anchor;
  }

  stretchLine() {
    this.stretch();
    this.reachSegments();
    this.positionSegments();
    // this.drawSegments();
  }

  //HELPER METHODS
  stretch() {
    let dx = (this.anchor.x >= this.center.x) ? this.anchor.x - this.center.x : this.center.x - this.anchor.x;
    let dy = (this.anchor.y >= this.center.y) ? this.anchor.y - this.center.y : this.center.y - this.anchor.y;
    let hypotenuse = Math.sqrt((dx * dx) + (dy * dy));
    this.segmentLength = hypotenuse / this.segmentAmount + 0.05;
  }

  reachSegments() {
    if (this.reversed) {
      for (let i = 0; i < this.locations.length; i++) {
        const x = (i === 0) ? this.anchor.x : this.target.x;
        const y = (i === 0) ? this.anchor.y : this.target.y;
        const dx = x - this.locations[i].x;
        const dy = y - this.locations[i].y;
        this.angles[i] = atan2(dy, dx);
        this.target = createVector(
          x - cos(this.angles[i]) * this.segmentLength,
          y - sin(this.angles[i]) * this.segmentLength
        );
      }
    } else {
      for (let i = 0; i < this.locations.length; i++) {
        const x = (i === 0) ? this.center.x : this.target.x;
        const y = (i === 0) ? this.center.y : this.target.y;
        const dx = x - this.locations[i].x;
        const dy = y - this.locations[i].y;
        this.angles[i] = atan2(dy, dx);
        this.target = createVector(
          x - cos(this.angles[i]) * this.segmentLength,
          y - sin(this.angles[i]) * this.segmentLength
        );
      }
    }
  }

  positionSegments() {
    for (let i = this.locations.length - 1; i >= 1; i--) {
      this.locations[i - 1] = createVector(
        this.locations[i].x + cos(this.angles[i]) * this.segmentLength,
        this.locations[i].y + sin(this.angles[i]) * this.segmentLength
      );
    }
  }

  // drawSegments() {
  //   for (let i = 0; i < this.locations.length; i++) {
  //     push();
  //     translate(this.locations[i].x, this.locations[i].y);
  //     rotate(this.angles[i]);
  //     line(0, 0, this.segmentLength, 0);
  //     pop();
  //   }
  // }
}