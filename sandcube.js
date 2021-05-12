let sandcube;

function setup() {
  colorMode(HSB, 1)
  createCanvas(windowWidth, windowHeight)
  sandcube = new Sandcube(createVector(width / 2, height / 2), 180, 12)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  sandcube.position = createVector(width / 2, height / 2)
}

function draw() {
  clear()
  background("#121212")
  sandcube.update()
  sandcube.render()
}

function mousePressed() {
  sandcube.isRotating = true;
}

function mouseReleased() {
  sandcube.isRotating = false;
  sandcube.mouseAngle = 0;
  sandcube.prevMouseAngle = 0;
}

class Sandcube {
  constructor(position, radius, resolution) {
    this.position = position
    this.radius = radius
    this.resolution = resolution
    //color properties
    this.color1 = this.generateColor()
    this.color2 = this.generateColor()
    this.color3 = this.generateColor()
    this.maxSwaps = 50
    //hexagon properties
    this.hexagon = this.initHexagon()
    this.hexMask = this.initHexMask()
    //grid properties
    this.rows = 2 * this.radius / this.resolution
    this.cols = 2 * this.radius / this.resolution
    this.grid = this.initGrid()
    //rotation properties
    this.isRotating = false;
    this.rotation = 0;
    this.rotationVelocity = 0;
    this.mouseAngle = 0;
    this.prevMouseAngle = 0;
    //next task: set colors to grid points
  }

  //BASE METHODS 
  render() {
    push()
    translate(this.position.x, this.position.y)
    rotate(this.rotation)
    this.renderGrid()
    // this.renderHexagon()
    this.renderHexMask()
    pop()
  }

  update() {
    this.updateRotation()
    this.updateColors()
  }

  //INIT METHODS 
  initHexagon() {
    const hexagon = []
    for (let i = 0; i < 6; i++) {
      const angle = TWO_PI / 6 * i
      const x = sin(angle) * this.radius
      const y = cos(angle) * this.radius
      hexagon[i] = createVector(x, y)
    }
    return hexagon
  }

  initHexMask() {
    const masks = []
    //create masks out of simpler vertices so that the rectangular grid i
    for (let i = 0; i < 6; i++) {
      const point1 = this.hexagon[i].copy()
      const point2 = i === 5 ? this.hexagon[0].copy() : this.hexagon[i + 1].copy()
      const direction = i >= 3 ? -1 : 1 //direction
      masks[i] = [
        point1,
        point2,
        createVector((this.radius + 10) * direction, point2.y - (10 * direction)),
        createVector((this.radius + 10) * direction, point1.y + (10 * direction))
      ]
    }
    //add buffers
    masks.push([
      createVector(-this.radius, this.hexagon[0].y),
      createVector(this.radius, this.hexagon[0].y),
      createVector(-this.radius, this.hexagon[0].y + 10),
      createVector(this.radius, this.hexagon[0].y + 10),
    ])

    masks.push([
      createVector(-this.radius, this.hexagon[3].y),
      createVector(this.radius, this.hexagon[3].y),
      createVector(this.radius, this.hexagon[3].y - 10),
      createVector(this.radius, this.hexagon[3].y - 10),
    ])

    return masks;
  }

  initGrid() {
    let grid = []
    let index = 0;
    const size = this.resolution;
    for (let x = -this.radius; x < this.radius; x += size) {
      for (let y = -this.radius; y < this.radius; y += size) {
        const points = [
          createVector(x, y),
          createVector(x + size, y),
          createVector(x + size, y + size),
          createVector(x, y + size)
        ]
        const pos = points[0]
        const clr = this.getBlockBaseColor(points)
        grid.push({ pos, clr, size, index })
        index++
      }
    }
    return grid
  }

  //RENDER METHODS 
  renderGrid() {
    this.grid.forEach(({ pos, clr, size }) => {
      if (clr) {
        fill(clr)
        stroke(clr)
      }
      rect(pos.x, pos.y, size)
    })
  }

  renderHexagon() {
    stroke("red")
    strokeWeight(4)
    noFill()
    beginShape()
    this.hexagon.forEach(point => {
      vertex(point.x, point.y)
    })
    endShape(CLOSE)
  }

  renderHexMask() {
    fill("#121212")
    noStroke()
    this.hexMask.forEach(mask => {
      beginShape()
      mask.forEach(point => {
        vertex(point.x, point.y)
      })
      endShape(CLOSE)
    })
  }

  //UPDATE METHODS 
  updateRotation() {
    if (this.isRotating) {
      const dx = mouseX - width / 2
      const dy = mouseY - height / 2
      this.mouseAngle = atan2(dy, dx)
      if (this.prevMouseAngle === 0) this.prevMouseAngle = this.mouseAngle
      let deltaMouse = this.mouseAngle - this.prevMouseAngle
      //limit rotation velocity
      deltaMouse = deltaMouse > 2 ? 2 : deltaMouse < -2 ? -2 : deltaMouse;
      this.rotationVelocity = deltaMouse
      this.rotation += this.rotationVelocity
      this.prevMouseAngle = this.mouseAngle
    } else if (this.rotationVelocity !== 0) {
      if (this.rotationVelocity < 0) {
        this.rotationVelocity += this.rotationVelocity < -0.01 ? 0.01 : 0.00035
        if (this.rotationVelocity >= 0) this.rotationVelocity = 0;
      } else if (this.rotationVelocity > 0) {
        this.rotationVelocity -= this.rotationVelocity > 0.01 ? 0.01 : 0.00035
        if (this.rotationVelocity <= 0) this.rotationVelocity = 0;
      }
      this.rotation += this.rotationVelocity
    }
  }

  updateColors() {
    /* ROTATION BASED IMPLEMENTATION*/
    if (this.rotationVelocity !== 0) {
      const speed = abs(this.rotationVelocity)
      const numSwaps = map(speed, 0, 2, 0, this.maxSwaps)
      for (let i = 0; i < numSwaps; i++) {
        const block = random(this.grid)
        const swapBlock = this.rotateBlock(block, this.rotationVelocity)
        if (swapBlock) {
          const blockColor = block.clr
          const swapColor = swapBlock.clr
          block.clr = swapColor
          swapBlock.clr = blockColor
        }
      }
    }

    /* RANDOM ADJACENT BLOCK IMPLEMENTATION */
    // const speed = abs(this.rotationVelocity)
    // const numSwaps = map(speed, 0, 2, 0, this.maxSwaps)
    // const swapStep = floor(map(speed, 0, 2, 0, this.resolution / 2)) + 1
    // for (let i = 0; i < numSwaps; i++) {
    //   const block = random(this.grid)
    //   const blockColor = block.clr;
    //   const blockIndex = this.grid.indexOf(block)
    //   const adjacentBlocks = this.getAdjacentBlocks(blockIndex, swapStep)
    //   const swapBlock = random(adjacentBlocks)
    //   if (swapBlock) {
    //     const swapColor = swapBlock.clr
    //     block.clr = swapColor;
    //     swapBlock.clr = blockColor;
    //   }
    // }
  }



  //HELPER METHODS
  getBlockBaseColor(points) {
    const center = createVector(0, 0)
    const segment1 = [center, this.hexagon[2], this.hexagon[1], this.hexagon[0]]
    const segment2 = [center, this.hexagon[4], this.hexagon[3], this.hexagon[2]]
    const segment3 = [center, this.hexagon[0], this.hexagon[5], this.hexagon[4]]

    for (let i = 0; i < points.length; i++) {
      const { x, y } = points[i]
      if (this.contains(segment1, x, y)) {
        return this.color1
      } else if (this.contains(segment2, x, y)) {
        return this.color2
      } else if (this.contains(segment3, x, y)) {
        return this.color3
      }
    }

    const n = floor(random(1, 4))
    return this[`color${n}`]
  }

  generateColor() {
    return color(random(), .6, .9)
  }

  contains(shape, x, y) {
    //adapted from: https://rosettacode.org/wiki/Ray-casting_algorithm
    let count = 0;
    for (let i = 0; i < shape.length; i++) {
      const v1 = shape[i];
      const v2 = shape[(i + 1) % shape.length]
      if (west(v1, v2, x, y)) ++count;
    }
    return count % 2;

    function west(v1, v2, x, y) {
      if (v1.y <= v2.y) {
        if (y <= v1.y || y > v2.y || x >= v1.x && x >= v2.x) {
          return false;
        } else if (x < v1.x && x < v2.x) {
          return true;
        } else {
          return (y - v1.y) / (x - v1.x) > (v2.y - v1.y) / (v2.x - v1.x)
        }
      } else {
        return west(v2, v1, x, y)
      }
    }
  }

  getAdjacentBlocks(i, v) {
    const blocks = []
    if (this.rotationVelocity > 0) {
      //clockwise -> go east
      if (this.grid[i + v]) blocks.push(this.grid[i + 1]) // e
      if (this.grid[i - this.cols * ceil(v / 2)]) blocks.push(this.grid[i - this.cols]) //n
      if (this.grid[i + this.cols * ceil(v / 2)]) blocks.push(this.grid[i + this.cols]) //s
      if (this.grid[i - this.cols * ceil(v / 2) + v]) blocks.push(this.grid[i - this.cols + 1]) //ne
      if (this.grid[i + this.cols * ceil(v / 2) + v]) blocks.push(this.grid[i + this.cols + 1]) //se
    } else if (this.rotationVelocity <= 0) {
      //counterclockwise, go west
      if (this.grid[i - v]) blocks.push(this.grid[i - 1]) //w
      if (this.grid[i - this.cols * ceil(v / 2)]) blocks.push(this.grid[i - this.cols]) //n
      if (this.grid[i + this.cols * ceil(v / 2)]) blocks.push(this.grid[i + this.cols]) //s
      if (this.grid[i - this.cols * ceil(v / 2) - v]) blocks.push(this.grid[i - this.cols - 1]) //nw
      if (this.grid[i + this.cols * ceil(v / 2) - v]) blocks.push(this.grid[i + this.cols - 1]) //sw
    }
    return blocks
  }

  rotateBlock(block, speed) {
    const {x, y} = block.pos;
    const radius = sqrt(x**2 + y**2)
    const theta = atan2(y, x) //?
    const targetAngle = theta + speed //may modulate speed
    const rx = sin(targetAngle) * radius
    const ry = cos(targetAngle) * radius
    const swapBlock = this.getBlockContainingPoint(rx, ry)
    return swapBlock
  }

  getBlockContainingPoint(x, y) {
    const bx = floor(x / this.resolution) * this.resolution;
    const by = floor(y / this.resolution) * this.resolution;
    const block = this.grid.filter(b => b.pos.x == bx && b.pos.y == by) //might break
    return block[0]
  }


}