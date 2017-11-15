import * as CFG from "../cfg";

import {
  $,
  rnd64,
  roundTo,
  scaledCosine,
  createCanvasBuffer,
  JSONTilesetToCanvas
} from "../utils";

import Seed from "../seed";

export default class TerrainGenerator {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(rom) {
    this.rom = rom;
    this.map = null;
    this.perlin = null;
    this.tileset = null;
    this.mapEl = $("#tg-map");
    this.mapCtx = this.mapEl.getContext("2d");
    this.setup();
  }
  setup() {
    $("#tg-ui").style.display = "block";
    window.addEventListener("resize", () => this.resize());
    this.resize();
    //ows.appendChild(ts.layers.background.canvas);
    //ows.appendChild(ts.layers.foreground.canvas);
    //this.generateTerrain(512*2, 512*2);
    fetch("../ts-terrain.json").then(resp => resp.json()).then(json => {
      let tileset = JSONTilesetToCanvas(this.rom, json);
      tileset.canvas.style.position = "absolute";
      tileset.canvas.style.right = "0px";
      tileset.canvas.style.top = "0px";
      $("#tg-ui").appendChild(tileset.canvas);
      this.tileset = tileset.canvas;
      this.addListeners();
      $("#tg-generate").click();
    });
  }
  addListeners() {
    $("#tg-generate").onclick = (e) => {
      this.generateTerrain(CFG.TERRAIN_DEFAULT_WIDTH, CFG.TERRAIN_DEFAULT_HEIGHT, rnd64());
    };
    $("#tg-seed-generate").onclick = (e) => {
      let seed = parseInt(prompt(`Enter a terrain seed number:`)) || 0;
      this.generateTerrain(CFG.TERRAIN_DEFAULT_WIDTH, CFG.TERRAIN_DEFAULT_HEIGHT, seed);
    };
  }
  resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.mapEl.width = width;
    this.mapEl.height = height;
  }
  clear() {
    this.mapCtx.clearRect(
      0, 0,
      this.mapEl.width, this.mapEl.height
    );
  }
  draw() {
    this.clear();
    if (this.map !== null) {
      let scale = 1.0;
      this.mapCtx.drawImage(
        this.map,
        0, 0,
        this.map.width, this.map.height,
        0, 0,
        this.map.width * scale, this.map.height * scale
      );
    }
  }
  generateTerrain(width, height, seed) {
    // generate perlin base
    (() => {
      let PERLIN_SIZE = 4095;
      let data = new Float64Array(PERLIN_SIZE + 1);
      let rnd = new Seed(seed);
      for (let ii = 0; ii < PERLIN_SIZE + 1; ++ii) {
        data[ii] = rnd.number();
      };
      this.perlin = {
        data: data,
        seed: seed
      };
      $("#tg-terrain-seed").innerHTML = `Seed: ${seed}`;
    })();
    console.log(`Generating terrain [${width},${height}], SEED: ${this.perlin.seed}`);
    let terrain = createCanvasBuffer(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE).ctx;
    terrain.fillStyle = `rgba(255,0,0,0.25)`;
    terrain.fillRect(
      0, 0,
      width, height
    );
    let data = new Uint8Array(width * height);
    let inc = 0.1;
    let modifier = 1.5;
    let yOff = 0;
    for (let y = 0; y < height; y++) {
      let xOff = 0;
      for (let x = 0; x < width; x++) {
        let r = this.noise(xOff, yOff) * 255 / modifier;
        xOff += inc;
        this.fillTerrain(this.tileset, terrain, data, width, x, y, r);
      }
      yOff += inc;
    };
    this.data = data;
    this.width = width;
    this.height = height;
    this.terrain = terrain;
    this.fixupTerrain();
    this.drawTerrain();
    this.autoTileTerrain();
    this.map = terrain.canvas;
  } 
  fillTerrain(tileset, terrain, data, width, x, y, r) {
    let index = ((y * width) + x) | 0;
    let scale = 16;
    // stone
    if (r >= 70) data[index] = 3;
    // sand
    else if (r >= 50 && r < 70) data[index] = 4;
    // Light water
    else if (r >= 40 && r < 50) data[index] = 2;
    // Deep water
    else data[index] = 1;
  }
  fixupTerrain() {
    for (let ii = 0; ii < this.data.length; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tile = this.data[ii] | 0;
      let connCount = this.getConnectionCount(x, y);
      if (connCount <= 1) this.data[ii] = 1;
    };
  }
  getConnectionCount(tx, ty) {
    let baseTile = this.data[ty * this.width + tx];
    let count = 0;
    if (this.data[ty * this.width + (tx - 1)] === baseTile) count++;
    if (this.data[ty * this.width + (tx + 1)] === baseTile) count++;
    if (this.data[(ty - 1) * this.width + tx] === baseTile) count++;
    if (this.data[(ty + 1) * this.width + tx] === baseTile) count++;
    return count;
  }
  /*getConnectionCount(data, width, tx, ty) {
    let baseTile = data[ty * width + tx];
    // 3x3 grid around cx, cy
    let count = 0;
    let length = data.length;
    for (let ii = 0; ii < 9; ++ii) {
      let xx = (ii % 3) | 0;
      let yy = (ii / 3) | 0;
      let x = (tx - 1) + xx;
      let y = (ty - 1) + yy;
      let index = y * width + x;
      if (x < 0 || y < 0) continue;
      if (x === tx && y === ty) continue;
      if (index < 0 || index > length) continue;
      let tile = data[index];
      if (tile <= 0) continue;
      if (baseTile === tile) count++;
      //if (baseTile === 2) data[index] = 3;
    };
    return count;
  }*/
  drawTerrain() {
    let scale = CFG.BLOCK_SIZE;
    for (let ii = 0; ii < this.data.length; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tile = this.data[ii] | 0;
      if (tile === 1) {
        this.terrain.drawImage(
          this.tileset,
          0 * scale, 0 * scale,
          scale, scale,
          x * scale, y * scale,
          scale, scale
        );
      }
      else if (tile === 2) {
        this.terrain.drawImage(
          this.tileset,
          2 * scale, 1 * scale,
          scale, scale,
          x * scale, y * scale,
          scale, scale
        );
      }
      else if (tile === 3) {
        this.terrain.drawImage(
          this.tileset,
          0 * scale, 4 * scale,
          scale, scale,
          x * scale, y * scale,
          scale, scale
        );
      }
      else if (tile === 4) {
        this.terrain.drawImage(
          this.tileset,
          0 * scale, 12 * scale,
          scale, scale,
          x * scale, y * scale,
          scale, scale
        );
      }
    };
  }
  drawTile(x, y, type, edgeType, edges) {
    let coords = {
      "NW": [0,0],
      "N+W": [4,1],
      "N": [1,0],
      "NE": [2,0],
      "N+E": [3,1],
      "E": [2,1],
      "SE": [2,2],
      "S+E": [3,0],
      "S": [1,2],
      "SW": [0,2],
      "S+W": [4,0],
      "W": [0,1]
    };
    if (!coords[edges]) return;
    let pos = coords[edges];
    if (type === 2) {
      pos[0] += 1;
      pos[1] += 0;
    }
    if (type === 3) {
      pos[0] += 1;
      pos[1] += 4;
    }
    if (type === 4) {
      pos[0] += 1;
      pos[1] += 12;
    }
    let scale = CFG.BLOCK_SIZE;
    if (type > 1) {
      //console.log(`x:${x} y:${y} type:${type}`, edgeType, coords[edges]);

      this.terrain.drawImage(
        this.tileset,
        pos[0] * scale, pos[1] * scale,
        scale, scale,
        x * scale, y * scale,
        scale, scale
      );
    }
  }
  getTile(x, y) {
    if ((x >= 0 && x < this.width) && (y >= 0 && y < this.height)) {
      let type = this.data[y * this.width + x];
      return { x, y, type };
    }
    return null;
  }
  autoTileTerrain() {
    let scale = CFG.BLOCK_SIZE;
    for (let ii = 0; ii < this.width * this.height; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;

      let tile = this.getTile(x, y);
      let edges = "";
      let edgeType;

      let n = this.getTile(tile.x, tile.y - 1);
      let s = this.getTile(tile.x, tile.y + 1);
      let e = this.getTile(tile.x + 1, tile.y);
      let w = this.getTile(tile.x - 1, tile.y);

      let nw = this.getTile(tile.x - 1, tile.y - 1);
      let ne = this.getTile(tile.x + 1, tile.y - 1);
      let se = this.getTile(tile.x + 1, tile.y + 1);
      let sw = this.getTile(tile.x - 1, tile.y + 1);

      if (n !== null && tile.type !== n.type) {
        edges += "N";
        edgeType = n.type;
      }
      if (s !== null && tile.type !== s.type) {
        edges += "S";
        edgeType = s.type;
      }
      if (e !== null && tile.type !== e.type) {
        edges += "E";
        edgeType = e.type;
      }
      if (w !== null && tile.type != w.type) {
        edges += "W";
        edgeType = w.type;
      }

      if (edges === "") {
        if (nw !== null && tile.type !== nw.type) {
          edges = "N+W";
          edgeType = nw.type;
        }
        if (ne !== null && tile.type !== ne.type) {
          edges = "N+E";
          edgeType = ne.type;
        }
        if (se !== null && tile.type !== se.type) {
          edges = "S+E";
          edgeType = se.type;
        }
        if (sw !== null && tile.type !== sw.type) {
          edges = "S+W";
          edgeType = sw.type;
        }
      }

      if (edges !== "") {
        this.drawTile(x, y, tile.type, edgeType, edges);
      }

    };
  }
  noise(x, y, z) {
    y = y || 0;
    z = z || 0;

    var PERLIN_YWRAPB = 4;
    var PERLIN_YWRAP = 1<<PERLIN_YWRAPB;
    var PERLIN_ZWRAPB = 8;
    var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB;
    var PERLIN_SIZE = 4095 * 2;

    var perlin_octaves = 4;
    var perlin_amp_falloff = 0.5;

    var perlin = this.perlin.data;

    if (x < 0) {
      x = -x;
    }
    if (y < 0) {
      y = -y;
    }
    if (z < 0) {
      z = -z;
    }

    var xi = Math.floor(x),
      yi = Math.floor(y),
      zi = Math.floor(z);
    var xf = x - xi;
    var yf = y - yi;
    var zf = z - zi;
    var rxf, ryf;

    var r = 0;
    var ampl = 0.5;

    var n1, n2, n3;

    for (var o = 0; o < perlin_octaves; o++) {
      var of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

      rxf = scaledCosine(xf);
      ryf = scaledCosine(yf);

      n1 = perlin[ of & PERLIN_SIZE];
      n1 += rxf * (perlin[( of +1) & PERLIN_SIZE] - n1);
      n2 = perlin[( of +PERLIN_YWRAP) & PERLIN_SIZE];
      n2 += rxf * (perlin[( of +PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
      n1 += ryf * (n2 - n1);

      of += PERLIN_ZWRAP;
      n2 = perlin[ of & PERLIN_SIZE];
      n2 += rxf * (perlin[( of +1) & PERLIN_SIZE] - n2);
      n3 = perlin[( of +PERLIN_YWRAP) & PERLIN_SIZE];
      n3 += rxf * (perlin[( of +PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
      n2 += ryf * (n3 - n2);

      n1 += scaledCosine(zf) * (n2 - n1);

      r += n1 * ampl;
      ampl *= perlin_amp_falloff;
      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;

      if (xf >= 1.0) {
        xi++;
        xf--;
      }
      if (yf >= 1.0) {
        yi++;
        yf--;
      }
      if (zf >= 1.0) {
        zi++;
        zf--;
      }
    }
    return r;
  }
};
