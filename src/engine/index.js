import * as CFG from "../cfg";

import {
  $,
  drawGrid,
  setImageSmoothing,
  createCanvasBuffer,
  JSONTilesetToCanvas
} from "../utils";

import extend from "../extend";

import * as _init from "./init";
import * as _camera from "./camera";

import * as _ui_modes from "./ui/modes";

import * as _render_map from "./render/map";
import * as _render_grid from "./render/grid";
import * as _render_events from "./render/events";
import * as _render_tileset from "./render/tileset";
import * as _render_border_map from "./render/map-border";

export default class Engine {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(rom) {
    this.rom = rom;
    this.cx = 0;
    this.cy = 0;
    this.cz = 2.0;
    this.map = $("#engine-map");
    this.tileset = $("#engine-tileset");
    this.tsCtx = this.tileset.getContext("2d");
    this.ctx = this.map.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.frames = 0;
    this.drag = {
      down: false,
      px: 0, py: 0
    };
    this.selection = {
      tileset: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 }
    };
    this.mode = -1;
    this.objMode = -1;
    this.player = null;
    this.currentMap = null;
    this.currentTileset = null;
    this.events = [
      {
        x: 5,
        y: 18,
        kind: CFG.ENGINE_BOX_TYPES.ENTITY,
        width: 1,
        height: 1
      },
      {
        x: 10,
        y: 30,
        kind: CFG.ENGINE_BOX_TYPES.WARP,
        width: 1,
        height: 1
      }
    ];
    this.entities = [];
    this.setup();
  }
};

Engine.prototype.clear = function() {
  this.ctx.clearRect(
    0, 0,
    this.width, this.height
  );
  this.tsCtx.clearRect(
    0, 0,
    (CFG.TILESET_DEFAULT_WIDTH + 1) * CFG.ENGINE_TILESET_SCALE,
    CFG.TILESET_DEFAULT_HEIGHT * CFG.ENGINE_TILESET_SCALE
  );
};

Engine.prototype.draw = function() {
  let map = this.currentMap;
  let tileset = this.currentTileset;
  this.clear();
  //this.drawMapBorder(map);
  this.drawMap(map);
  this.drawTileset(tileset);
  this.frames++;
};

Engine.prototype.update = function() {

};

Engine.prototype.resize = function(e) {
  let width = window.innerWidth;
  let height = window.innerHeight;
  this.width = width;
  this.height = height;
  this.map.width = width;
  this.map.height = height;
  setImageSmoothing(this.ctx, false);
};

Engine.prototype.loadMap = function(id) {
  return null;
};

Engine.prototype.loadMapFromROM = function(bank, map) {
  return this.rom.fetchMap(bank, map);
};

Engine.prototype.loadTilesetFromROM = function(bank, map) {
  return this.rom.getMapTileset(bank, map);
};

Engine.prototype.useTileset = function(tileset) {
  let scale = CFG.ENGINE_TILESET_SCALE;
  let ts = JSONTilesetToCanvas(this.rom, tileset).canvas;
  let width = CFG.TILESET_DEFAULT_WIDTH;
  let height = CFG.TILESET_DEFAULT_HEIGHT;
  this.currentTileset = ts;
  this.tileset.width = (width + 1) * scale;
  this.tileset.height = height * scale;
  setImageSmoothing(this.tsCtx, false);
};

extend(Engine, _init);
extend(Engine, _camera);

extend(Engine, _ui_modes);

extend(Engine, _render_map);
extend(Engine, _render_grid);
extend(Engine, _render_events);
extend(Engine, _render_tileset);
extend(Engine, _render_border_map);
