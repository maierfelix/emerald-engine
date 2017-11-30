import * as CFG from "../../cfg";

import {
  uid,
  assert,
  typedArrayToArray
} from "../../utils";

import extend from "../../extend";

import Engine from "../index";

import * as _objects from "./objects";
import * as _settings from "./settings";
import * as _textures from "./texture";
import * as _encounters from "./encounters";

export default class Map {
  constructor(instance, width = 8, height = 8) {
    assert(instance instanceof Engine);
    this.id = uid();
    this.x = 0;
    this.y = 0;
    this.width = width | 0;
    this.height = height | 0;
    this.data = {};
    this.texture = {
      0: null, // bg
      1: null, // bgb
      2: null  // fg
    };
    this.instance = instance;
    this.collisions = [];
    this.objects = [];
    this.encounters = [];
    this.settings = {
      name: null,
      type: null,
      music: null,
      weather: null,
      showName: false
    };
    this.resize(width, height);
  }
};

Map.prototype.fromJSON = function(json) {
  assert(json.data !== void 0);
  assert(json.width !== void 0);
  assert(json.height !== void 0);
  this.data = json.data;
  this.resize(json.width, json.height);
  return this;
};

Map.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  this.initTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  this.resizeTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  return this;
};

Map.prototype.drawTileSelectionAt = function(x, y, layer, selection) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  let texture = this.texture[layer - 1];
  let tileset = this.instance.currentTileset;
  let ww = ((selection.w - selection.x) / CFG.BLOCK_SIZE) + 1;
  let hh = ((selection.h - selection.y) / CFG.BLOCK_SIZE) + 1;
  let sx = (selection.x / CFG.BLOCK_SIZE);
  let sy = (selection.y / CFG.BLOCK_SIZE);
  for (let ii = 0; ii < ww * hh; ++ii) {
    let xx = (ii % ww) | 0;
    let yy = (ii / ww) | 0;
    this.drawTileAt(
      tileset,
      sx + xx, sy + yy,
      x + xx, y + yy,
      layer
    );
  };
};

Map.prototype.drawTileAt = function(tileset, sx, sy, dx, dy, layer) {
  let ctx = this.texture[layer - 1];
  let scale = CFG.BLOCK_SIZE;
  // in bounds check
  if (dx < 0 || dx >= this.width) return;
  if (dy < 0 || dy >= this.height) return;
  this.setTileAt(tileset, sx, sy, dx, dy, layer);
  ctx.clearRect(
    dx * scale, dy * scale,
    scale, scale
  );
  ctx.drawImage(
    tileset.canvas,
    sx * scale, sy * scale,
    scale, scale,
    dx * scale, dy * scale,
    scale, scale
  );
};

Map.prototype.setTileAt = function(tileset, sx, sy, dx, dy, layer) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  let width = this.width | 0;
  let height = this.height | 0;
  // tileset bundle or data doesn't exist yet
  if (this.dataLayerMissing(tileset)) this.createDataLayer(tileset, width, height);
  let data = this.data[bundleId][tsId];
  let sIndex = (sy * (CFG.TILESET_DEFAULT_WIDTH / CFG.BLOCK_SIZE) + sx) | 0;
  let dIndex = (dy * width + dx) | 0;
  // delete previous data tiles and
  // data tiles in other tilesets
  this.deleteTileAt(dx, dy, layer);
  // increment tile index by 1
  // so we can detect empty tiles (whose value is zero)
  if (tileset.usage[sIndex]) data[layer][dIndex] = sIndex + 1;
};

Map.prototype.dataLayerMissing = function(tileset) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  return (
    (this.data[bundleId] === void 0) ||
    (this.data[bundleId][tsId] === void 0)
  );
};

Map.prototype.deleteTileAt = function(dx, dy, layer) {
  let bundles = this.data;
  let tileIndex = (dy * this.width + dx) | 0;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      //console.log(`Deleting in ${bundleId}:${tsId} at ${dx}:${dy}`);
      bundle[tsId][layer][tileIndex] = 0;
    };
  };
};

Map.prototype.createDataLayer = function(tileset, width, height) {
  let size = (width * height) | 0;
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  // allocate bundle data
  if (!this.data[bundleId]) this.data[bundleId] = {};
  let mapData = this.data[bundleId];
  // allocate bundle tileset data
  let data = mapData[tsId] = {
    1: new Array(size).fill(0),
    2: new Array(size).fill(0),
    3: new Array(size).fill(0)
  };
  for (let ii = 0; ii < size; ++ii) {
    let x = (ii % width) | 0;
    let y = (ii / width) | 0;
    data[1][ii] = 0;
    data[2][ii] = 0;
    data[3][ii] = 0;
  };
};

Map.prototype.toJSON = function() {
  let object = {
    data: this.data,
    width: this.width,
    height: this.height
  };
  return JSON.stringify(object);
};

extend(Map, _objects);
extend(Map, _settings);
extend(Map, _textures);
extend(Map, _encounters);
