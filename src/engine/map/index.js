import * as CFG from "../../cfg";

import {
  uid,
  assert,
  createCanvasBuffer
} from "../../utils";

import extend from "../../extend";

import Engine from "../index";

import * as _fill from "./fill";
import * as _tile from "./tile";
import * as _json from "./json";
import * as _objects from "./objects";
import * as _settings from "./settings";
import * as _textures from "./texture";
import * as _autotile from "./autotile";
import * as _encounters from "./encounters";

export default class Map {
  constructor(instance, width = 8, height = 8) {
    assert(instance instanceof Engine);
    this.id = uid();
    this.x = 0;
    this.y = 0;
    this.width = width | 0;
    this.height = height | 0;
    this.margin = { x: 0, y: 0, w: 0, h: 0 };
    this.data = {};
    this.textures = {
      0: null,       // bg
      1: null,       // bgb
      2: null,       // fg
      preview: null  // preview
    };
    this.texturesGL = {
      0: null,
      1: null,
      2: null
    };
    this.objects = [
      {
        x: 3, y: 2,
        kind: CFG.ENGINE_BOX_TYPES.ENTITY,
        width: 1, height: 1
      }
    ];
    this.instance = instance;
    this.collisions = [];
    this.encounters = [];
    this.settings = {
      name: ``,
      type: 0,
      music: 0,
      weather: 0,
      showName: false
    };
    this.fillTable = null;
    this.drawPreview = false;
    this.init();
  }
};

Map.prototype.init = function() {
  this.fillTable = new Uint8Array(this.width * this.height);
  this.setBoundings(this.width, this.height);
};

Map.prototype.setBoundings = function(width, height) {
  this.width = width;
  this.height = height;
  this.initTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  this.resizeTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  return this;
};

Map.prototype.getBoundings = function() {
  return {
    x: this.x,
    y: this.y,
    w: this.width,
    h: this.height
  };
};

Map.prototype.getMarginBoundings = function() {
  let bounds = this.getBoundings();
  let margin = this.margin;
  return {
    x: bounds.x + margin.x,
    y: bounds.y + margin.y,
    w: bounds.w + margin.w - margin.x,
    h: bounds.h + margin.h - margin.y
  };
};

Map.prototype.isMarginBoundingsValid = function() {
  let bounds = this.getMarginBoundings();
  return (
    bounds.w >= CFG.ENGINE_MAP_MIN_WIDTH &&
    bounds.h >= CFG.ENGINE_MAP_MIN_HEIGHT
  );
};

Map.prototype.resetMargins = function() {
  let margin = this.margin;
  margin.x = margin.y = 0;
  margin.w = margin.h = 0;
};

Map.prototype.resize = function(x, y, width, height) {
  this.destroy();
  this.resizeDataLayers(x, y, width, height);
  this.x = x;
  this.y = y;
  this.setBoundings(width, height);
  this.refreshMapTextures();
  this.resetMargins();
};

Map.prototype.resizeDataLayers = function(x, y, width, height) {
  let bundles = this.data;
  let instance = this.instance;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      for (let ll in ts) {
        let data = ts[ll];
        let buffer = new Uint16Array(width * height);
        for (let ii = 0; ii < this.width * this.height; ++ii) {
          let xx = (ii % this.width) | 0;
          let yy = (ii / this.width) | 0;
          let opx = (yy * this.width + xx) | 0;
          let npx = opx + (yy * (width - this.width)) + (this.x - x) + ((this.y - y) * width);
          if (xx < (x - this.x) || yy < (y - this.y)) continue;
          buffer[npx] = data[opx];
        };
        ts[ll] = buffer;
      };
    };
  };
};

Map.prototype.destroy = function() {
  this.textures[0] = null;
  this.textures[1] = null;
  this.textures[2] = null;
  this.textures["preview"] = null;
  this.instance.gl.freeTexture(this.texturesGL[0]); this.texturesGL[0] = null;
  this.instance.gl.freeTexture(this.texturesGL[1]); this.texturesGL[1] = null;
  this.instance.gl.freeTexture(this.texturesGL[2]); this.texturesGL[2] = null;
};

Map.prototype.dataLayerMissing = function(tileset) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  return (
    (this.data[bundleId] === void 0) ||
    (this.data[bundleId][tsId] === void 0)
  );
};

Map.prototype.createDataLayer = function(tileset, width, height) {
  let size = (width * height) | 0;
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  // allocate bundle data
  if (!this.data[bundleId]) this.data[bundleId] = {};
  this.data[bundleId][tsId] = {
    1: new Uint16Array(size),
    2: new Uint16Array(size),
    3: new Uint16Array(size)
  };
};

Map.prototype.coordsInBounds = function(x, y) {
  return (
    (x >= 0 && x < this.width) &&
    (y >= 0 && y < this.height)
  );
};

Map.prototype.isInView = function() {
  let instance = this.instance;
  let xx = instance.cx + ((this.x * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let yy = instance.cy + ((this.y * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let ww = ((this.width * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let hh = ((this.height * CFG.BLOCK_SIZE) * instance.cz) | 0;
  return (
    (xx + ww >= 0 && xx <= instance.width) &&
    (yy + hh >= 0 && yy <= instance.height)
  );
};

extend(Map, _fill);
extend(Map, _tile);
extend(Map, _json);
extend(Map, _objects);
extend(Map, _settings);
extend(Map, _textures);
extend(Map, _autotile);
extend(Map, _encounters);
