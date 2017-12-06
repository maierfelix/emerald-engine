import * as CFG from "../cfg";

import {
  $,
  rnd64,
  roundTo,
  scaledCosine,
  getRelativeTile,
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
    this.options = {
      showGrid: false
    };
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
      let tileset = JSONTilesetToCanvas(this.rom, json, 128);
      tileset.canvas.style.position = "absolute";
      tileset.canvas.style.right = "0px";
      tileset.canvas.style.top = "0px";
      $("#tg-ui").appendChild(tileset.canvas);
      this.tileset = tileset.canvas;
      this.addListeners();
      this.generateTerrain(CFG.TERRAIN_DEFAULT_WIDTH, CFG.TERRAIN_DEFAULT_HEIGHT, CFG.TERRAIN_DEFAULT_SEED);
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
    $("#tg-show-grid").onclick = (e) => {
      this.options.showGrid = !this.options.showGrid;
      $("#tg-show-grid").checked = this.options.showGrid;
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
      let ctx = this.mapCtx;
      ctx.drawImage(
        this.map,
        0, 0,
        this.map.width, this.map.height,
        0, 0,
        this.map.width * scale, this.map.height * scale
      );
      if (this.options.showGrid) this.drawGrid(ctx);
    }
  }
  drawGrid(ctx) {
    let scale = 1.0;
    let canvas = ctx.canvas;
    let width = canvas.width;
    let height = canvas.height;

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(0,0,0,0.5)`;

    let size = CFG.BLOCK_SIZE * scale;
    ctx.beginPath();
    for (let xx = 0; xx < width; xx += size) {
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, height);
    };
    for (let yy = 0; yy < height; yy += size) {
      ctx.moveTo(0, yy);
      ctx.lineTo(width, yy);
    };
    ctx.stroke();
    ctx.closePath();
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
    let heights = new Uint8Array(width * height);
    let inc = 0.1;
    let modifier = 1.5;
    let yOff = 0;
    this.data = data;
    this.heights = heights;
    this.width = width;
    this.height = height;
    this.terrain = terrain;
    for (let y = 0; y < height; y++) {
      let xOff = 0;
      for (let x = 0; x < width; x++) {
        let r = this.noise(xOff, yOff) * 255 / modifier;
        xOff += inc;
        this.fillTerrain(x, y, r);
      }
      yOff += inc;
    };
    //this.smoothTerrain();
    let lastFix = this.fixupTerrain();
    while (true) {
      let fix = this.fixupTerrain();
      if (fix === lastFix || fix <= 0) break;
      lastFix = fix;
    };
    this.floodTerrain();
    this.autoTileTerrain(0);
    this.autoTileTerrain(1);
    this.autoTileTerrain(2);
    this.autoTileTerrain(3);
    this.map = terrain.canvas;
  }
  floodTerrain() {
    for (let ii = 0; ii < this.width * this.height; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tt = this.data[ii] | 0;
      let tile = this.getTile(x, y);
      let level = this.heights[ii] | 0;
      if (level === 2) this.data[ii] = CFG.TERRAIN_TILES.STONE_GRASS.id;
      if (level === 3) this.data[ii] = CFG.TERRAIN_TILES.STONE_SAND.id;
    };
  }
  autoTileTerrain(level) {
    this.heightLevel = level;
    let scale = CFG.BLOCK_SIZE;
    for (let ii = 0; ii < this.width * this.height; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tile = this.getTile(x, y);
      let auto = this.getAutoTileFrom(tile);
      if (auto.level !== level) continue;
      if (auto.edges !== "") {
        this.drawTile(x, y, tile.type);
        this.drawAutoTile(x, y, tile.type, auto.edgeType, auto.edges);
      } else {
        this.drawTile(x, y, tile.type);
      }
    };
  }
  fillTerrain(x, y, r) {
    let index = ((y * this.width) + x) | 0;
    let scale = 16;
    this.heights[index] = 0;
    // light water
    if (r < 65 && r >= 55) {
      this.data[index] = CFG.TERRAIN_TILES.WATER.id;
    }
    // stone
    else if (r >= 65) {
      this.data[index] = CFG.TERRAIN_TILES.STONE.id;
      this.heights[index] = 1;
      if (r >= 85) this.heights[index] = 2;
      if (r >= 100) this.heights[index] = 3;
    }
    // water
    else this.data[index] = CFG.TERRAIN_TILES.WATER.id;
  }
  fixupTerrain() {
    let scale = CFG.BLOCK_SIZE;
    let fixed = 0;
    for (let ii = 0; ii < this.width * this.height; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tile = this.getTile(x, y);
      let auto = this.getAutoTileFrom(tile);
      if (auto.edges !== "" && !CFG.TERRAIN_SHEET_EDGES[auto.edges]) {
        this.data[y * this.width + x] = CFG.TERRAIN_TILES.WATER.id;
        fixed++;
      }
    };
    return fixed;
  }
  smoothTerrain() {
    let scale = CFG.BLOCK_SIZE;
    for (let ii = 0; ii < this.width * this.height; ++ii) {
      let x = (ii % this.width) | 0;
      let y = (ii / this.width) | 0;
      let tile = this.getTile(x, y);
      let auto = this.getAutoTileFrom(tile);
      if (auto.edges !== "" && auto.edges.length >= 2 && tile.type === 3) {
        let tt = 1;
        this.data[y * this.width + x] = tt;
        this.data[y * this.width + x - 1] = tt;
        this.data[y * this.width + x + 1] = tt;
        this.data[(y - 1) * this.width + x] = tt;
        this.data[(y - 1) * this.width + x - 1] = tt;
        this.data[(y - 1) * this.width + x + 1] = tt;
        this.data[(y + 1) * this.width + x] = tt;
        this.data[(y + 1) * this.width + x - 1] = tt;
        this.data[(y + 1) * this.width + x + 1] = tt;
      }
    };
  }
  drawAutoTile(x, y, type, edgeType, edges) {
    if (!CFG.TERRAIN_SHEET_EDGES[edges]) return;
    let pos = CFG.TERRAIN_SHEET_EDGES[edges];
    let tile = this.getTile(x, y);
    let sheetPos = this.getTileSheetByType(tile.type);
    let scale = CFG.BLOCK_SIZE;
    if (type === CFG.TERRAIN_TILES.WATER.id) {
      this.drawTile(x, y, type);
    }
    else {
      // draw bottom tile
      this.drawBottomAutoTile(x, y, type, edgeType);
      this.terrain.drawImage(
        this.tileset,
        (pos.x + 1) * scale, (pos.y + sheetPos.offset) * scale,
        scale, scale,
        x * scale, y * scale,
        scale, scale
      );
    }
  }
  drawBottomAutoTile(x, y, loTile, hiTile) {
    let scale = CFG.BLOCK_SIZE;
    let sheetPos = this.getTileSheetByType(hiTile);
    this.terrain.drawImage(
      this.tileset,
      0 * scale, sheetPos.offset * scale,
      scale, scale,
      x * scale, y * scale,
      scale, scale
    );
  }
  drawTile(x, y, type) {
    let scale = CFG.BLOCK_SIZE;
    let sheetPos = this.getTileSheetByType(type);
    let tile = this.getTile(x, y);
    if (type > 0) {
      this.terrain.drawImage(
        this.tileset,
        0 * scale, sheetPos.offset * scale,
        scale, scale,
        x * scale, y * scale,
        scale, scale
      );
    }
  }
  getTileSheetByType(type) {
    let tiles = CFG.TERRAIN_TILES;
    for (let key in tiles) {
      let tt = tiles[key];
      if (tt.id === type) return tt;
    };
    return null;
  }
  getTile(x, y) {
    if ((x >= 0 && x < this.width) && (y >= 0 && y < this.height)) {
      let index = (y * this.width + x) | 0;
      let type = this.data[index] | 0;
      let level = this.heights[index] | 0;
      return { x, y, type, level };
    }
    return null;
  }
  getAutoTileFrom(tile) {

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

    let count = 0;

    let hl = this.heightLevel;

    if (n && (!this.sameTileTypes(n, tile) || (n.level < tile.level))) {
      edges += "N";
      edgeType = n.type;
      count++;
    }
    if (s && (!this.sameTileTypes(s, tile) || (s.level < tile.level))) {
      edges += "S";
      edgeType = s.type;
      count++;
    }
    if (e && (!this.sameTileTypes(e, tile) || (e.level < tile.level))) {
      edges += "E";
      edgeType = e.type;
      count++;
    }
    if (w && (!this.sameTileTypes(w, tile) || (w.level < tile.level))) {
      edges += "W";
      edgeType = w.type;
      count++;
    }

    if (edges === "") {
      if (nw && (!this.sameTileTypes(nw, tile) || (nw.level < tile.level))) {
        edges = "N+W";
        edgeType = nw.type;
        count++;
      }
      else if (ne && (!this.sameTileTypes(ne, tile) || (ne.level < tile.level))) {
        edges = "N+E";
        edgeType = ne.type;
        count++;
      }
      if (se && (!this.sameTileTypes(se, tile) || (se.level < tile.level))) {
        edges = "S+E";
        edgeType = se.type;
        count++;
      }
      else if (sw && (!this.sameTileTypes(sw, tile) || (sw.level < tile.level))) {
        edges = "S+W";
        edgeType = sw.type;
        count++;
      }

    }

    return { edges, edgeType, count, level: tile.level };

  }
  sameTileTypes(a, b) {
    let sheetA = this.getTileSheetByType(a.type);
    let sheetB = this.getTileSheetByType(b.type);
    return (
      (a.type === b.type) ||
      (sheetA.kind === b.type) ||
      (sheetB.kind === a.type) ||
      (sheetA.kind === sheetB.kind)
    );
  }
  noise(x, y, z) {
    y = y || 0;
    z = z || 0;

    var PERLIN_YWRAPB = 4;
    var PERLIN_YWRAP = 1<<PERLIN_YWRAPB;
    var PERLIN_ZWRAPB = 8;
    var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB;
    var PERLIN_SIZE = 4095;

    var perlin_octaves = 3;
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