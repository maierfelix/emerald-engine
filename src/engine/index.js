import * as CFG from "../cfg";

import {
  $,
  GET,
  drawGrid,
  loadJSONFile,
  rectIntersect,
  getRelativeTile,
  loadImageAsCanvas,
  setImageSmoothing,
  createCanvasBuffer,
  JSONTilesetToCanvas
} from "../utils";

import extend from "../extend";

import Map from "./map/index";
import CanvasRecorder from "../canvas-recorder";

import * as _map from "./map";
import * as _init from "./init";
import * as _camera from "./camera";
import * as _tileset from "./tileset";
import * as _listeners from "./listeners";

import * as _ui_modes from "./ui/modes";
import * as _ui_modal from "./ui/modal";
import * as _ui_encounter from "./ui/encounter";

import * as _render_map from "./render/map";
import * as _render_preview from "./render/preview";
import * as _render_tileset from "./render/tileset";
import * as _render_border_map from "./render/map-border";
import * as _render_map_objects from "./render/map-objects";

export default class MapEditor {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(engine) {
    this.engine = engine;
    this.rom = engine.rom;
    this.cx = 0;
    this.cy = 0;
    this.cz = 2.0;
    this.mx = 0;
    this.my = 0;
    this.tmx = 0;
    this.tmy = 0;
    this.last = {
      rmx: 0, rmy: 0
    };
    this.map = $("#engine-map");
    this.tileset = $("#engine-tileset");
    this.tsCtx = this.tileset.getContext("2d");
    this.ctx = this.map.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.frames = 0;
    this.drag = {
      ldown: false,
      rdown: false,
      px: 0, py: 0
    };
    this.selection = {
      entity: null,
      newMap: { sx: 0, sy: 0, ex: 0, ey: 0, ax: 0, ay: 0, jr: false },
      tileset: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 }
    };
    this.creation = {
      map: null
    };
    this.preview = {
      tileset: null
    };
    this.redraw = {
      tileset: false
    };
    this.session = engine.session;
    this.mode = -1;
    this.objMode = -1;
    this.tsEditMode = -1;
    this.modalMode = null;
    this.player = null;
    this.maps = [];
    this.bundles = {};
    this.currentMap = null;
    this.currentLayer = -1;
    this.currentBundle = null;
    this.currentTileset = null;
    this.entities = [];
    this.setup();
  }
};

MapEditor.prototype.clear = function() {
  this.ctx.clearRect(
    0, 0,
    this.width, this.height
  );
};

MapEditor.prototype.draw = function() {
  let tileset = this.currentTileset;
  this.clear();
  this.drawMaps();
  if (this.mode === CFG.ENGINE_MODE_TS) this.drawTileset(tileset);
  if (this.isUIInMapCreationMode()) {
    this.drawMapPreview(this.creation.map);
  }
  if (this.cz >= CFG.ENGINE_CAMERA_GRID_MIN_SCALE) {
    drawGrid(this.ctx, this.cz, this.cx, this.cy, this.width, this.height);
  }
  this.frames++;
};

MapEditor.prototype.update = function() {

};

MapEditor.prototype.resize = function(e) {
  let width = window.innerWidth;
  let height = window.innerHeight;
  this.width = width;
  this.height = height;
  this.map.width = width;
  this.map.height = height;
  setImageSmoothing(this.ctx, false);
};

MapEditor.prototype.initUI = function() {
  $("#engine-ui").style.display = "block";
  document.body.style.background = `#2c2d2e`;
};

MapEditor.prototype.getPkmnNameList = function() {
  let names = this.rom.names.pkmns;
  let length = Object.keys(names).length;
  let list = new Array(length);
  for (let ii = 1; ii <= length; ++ii) {
    let name = names[ii];
    list[ii] = name;
  };
  return list;
};

MapEditor.prototype.getMapObjectByPosition = function(x, y) {
  let maps = this.maps;
  for (let ii = 0; ii < maps.length; ++ii) {
    let map = maps[ii];
    let objects = map.objects;
    for (let jj = 0; jj < objects.length; ++jj) {
      let object = objects[jj];
      let ox = map.x + object.x;
      let oy = map.y + object.y;
      if (ox === x && oy === y) return object;
    };
  };
  return null;
};

extend(MapEditor, _map);
extend(MapEditor, _init);
extend(MapEditor, _camera);
extend(MapEditor, _tileset);
extend(MapEditor, _listeners);

extend(MapEditor, _ui_modes);
extend(MapEditor, _ui_modal);
extend(MapEditor, _ui_encounter);

extend(MapEditor, _render_map);
extend(MapEditor, _render_tileset);
extend(MapEditor, _render_preview);
extend(MapEditor, _render_border_map);
extend(MapEditor, _render_map_objects);
