let sandcube;

function setup() {
  createCanvas(windowWidth, windowHeight)
  // angleMode(DEGREES)
  background(22)
  sandcube = new Sandcube(createVector(width / 2, height / 2), 220, 40)
  noLoop()
}

function draw() {
  //step 1: draw circle out of pixel chunks
  //step 2: draw hexagon out of pixel chunks
  sandcube.render()
  // console.log(sandcube.grains.length)
}

class Sandcube {
  constructor(position, radius, resolution) {
    this.position = position;
    this.radius = radius
    this.resolution = resolution
    this.hexagonLines = []
    this.hexagon = this.initHexagon()
    this.grid = this.initGrid()
    // this.grains = this.initGrains()
  }

  initHexagon() {
    const hexagon = []

    for (let i = 0; i < 6; i++) {
      const angle = TWO_PI / 6 * i
      const x = sin(angle) * this.radius
      const y = cos(angle) * this.radius
      hexagon[i] = createVector(x, y)
    }

    //also generate a bunch of hexagon lines
    Object.values(hexagon).forEach((p1, i) => {
      let p2 = i === 5 ? hexagon[0] : hexagon[i + 1]
      this.hexagonLines.push({start: p1, end: p2})
    })

    return hexagon;
  }

  initGrid() {
    const grid = []

    //generate grains
    for (let x = -this.radius; x < this.radius; x += this.resolution) {
      for (let y = -this.radius; y < this.radius; y += this.resolution) {
        const pt = createVector(x, y)
        grid.push(pt)
      }
    }

    grid.forEach((pt, index) => {
      if (index !== 0) return;
      //get filter point
      const fp = createVector(pt.x + this.resolution / 2, pt.y + this.resolution / 2)

      //get a 0-360 degree heading value
      const heading = degrees(fp.heading()) >= 0 ?
        degrees(fp.heading()) :
        360 + degrees(fp.heading())

      
      //loop through hexagon lines
      this.hexagonLines.forEach(hexline => {
        const intersection = getIntersectionPoint(
          fp.x, 
          fp.y,
          0,
          0,
          hexline.start.x,
          hexline.start.y,
          hexline.end.x,
          hexline.end.y
        )

        console.log(intersection)
      })



      //get the corresponding hex points to compare with grid block
      //get which angle quadrant it's in
      // const p1 = floor(heading / 60)
      // console.log(p1)
      // console.log(heading / 60)
      // const p2 = p1 === 5 ? 0 : p1 + 1;

      // console.log(intersectingPoint)
      


      // const lerpCoefficient = map(heading, p1 * 60, p2 * 60, 0, 1)
      // //get corresponding point on hexagon
      // const cp = p5.Vector.lerp(this.hexagon[`p${p1}`], this.hexagon[`p${p2}`], lerpCoefficient)

      // if (dist(fp.x, fp.y, 0, 0) > dist(cp.x, cp.y, 0, 0)) {
      //   grid.splice(index, 1)
      //   strokeWeight(1)
      //   stroke("blue")
      //   line(width / 2 + cp.x, height / 2 + cp.y, width / 2 + fp.x, height / 2 + fp.y)
      //   stroke("green")
      //   line(width / 2, height / 2, width / 2 + fp.x, height / 2 + fp.y)
      //   fill(255)
      // }
    })





    return grid;
  }





  // initGrains() {
  //   const grains = []
  //   for (let x = -this.radius / 2; x < this.radius / 2; x += this.resolution) {
  //     for (let y = -this.radius / 2; y < this.radius / 2; y += this.resolution) {
  //       const pt = createVector(x, y)
  //       if (pt.mag() <= this.radius) {
  //         grains.push(pt)
  //       }
  //     }
  //   }
  //   return grains;
  // }

  render() {
    // push()
    // fill("#00ff0033")
    // // noStroke()
    // translate(this.position.x, this.position.y)
    // this.grid.forEach(({ x, y }) => {
    //   fill(255)
    //   rect(x, y, this.resolution)
    // })
    // pop()

    push()
    stroke("#ff000033")
    strokeWeight(5)
    beginShape()
    translate(this.position.x, this.position.y)
    Object.values(this.hexagon).forEach(({ x, y }) => {
      noFill()
      vertex(x, y)
    })
    endShape(CLOSE)
    pop()
  }

}


function getIntersectionPoint(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  let s1_x = p1_x - p0_x;
  let s1_y = p1_y - p0_y;
  let s2_x = p3_x - p2_x;
  let s2_y = p3_y - p2_y;

  let s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  let t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >=0 && s <= 1 && t >= 0 && t <= 0) {
    return createVector(p0_x + (t * s1_x), p0_y + t * s1_y)
  } else {
    return false;
  }
}

