import * as CFG from "../cfg";

import {
  $,
  GET,
  drawGrid,
  loadJSONFile,
  loadImageAsCanvas,
  setImageSmoothing,
  createCanvasBuffer,
  JSONTilesetToCanvas
} from "../utils";

import extend from "../extend";

import Map from "./map/index";

import * as _init from "./init";
import * as _camera from "./camera";
import * as _tileset from "./tileset";
import * as _listeners from "./listeners";

import * as _ui_modes from "./ui/modes";

import * as _render_map from "./render/map";
import * as _render_events from "./render/events";
import * as _render_preview from "./render/preview";
import * as _render_tileset from "./render/tileset";
import * as _render_border_map from "./render/map-border";

export default class MapEditor {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(rom, login) {
    this.rom = rom;
    this.cx = 0;
    this.cy = 0;
    this.cz = 2.0;
    this.mx = 0;
    this.my = 0;
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
      tileset: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 }
    };
    this.preview = {
      tileset: null
    };
    this.mode = -1;
    this.tsMode = -1;
    this.objMode = -1;
    this.modalMode = null;
    this.player = null;
    this.maps = [];
    this.bundles = {};
    this.currentMap = null;
    this.currentBundle = null;
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
    this.setup(login);
  }
};

MapEditor.prototype.clear = function() {
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

MapEditor.prototype.draw = function() {
  let map = this.currentMap;
  let tileset = this.currentTileset;
  this.clear();
  //this.drawMapBorder(map);
  this.drawMap(map);
  this.drawTileset(tileset);
  drawGrid(this.ctx, this.cz, this.cx, this.cy, this.width, this.height);
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

MapEditor.prototype.loadMap = function(id) {
  return null;
};

MapEditor.prototype.loadMapFromROM = function(bank, map) {
  return this.rom.fetchMap(bank, map);
};

MapEditor.prototype.loadMapFromServer = function(name) {
  return new Promise(resolve => {
    GET(`../data/maps/${name}.json`).then(res => {
      let json = JSON.parse(res);
      let bundles = json.data;
      this.resolveBundleList(bundles).then(() => {
        let map = new Map(this).fromJSON(json);
        resolve(map);
      });
    });
  });
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

MapEditor.prototype.getEventEntityByPosition = function(x, y) {
  let events = this.events;
  for (let ii = 0; ii < events.length; ++ii) {
    let event = events[ii];
    if (event.x === x && event.y === y) return event;
  };
  return null;
};

extend(MapEditor, _init);
extend(MapEditor, _camera);
extend(MapEditor, _tileset);
extend(MapEditor, _listeners);

extend(MapEditor, _ui_modes);

extend(MapEditor, _render_map);
extend(MapEditor, _render_events);
extend(MapEditor, _render_tileset);
extend(MapEditor, _render_preview);
extend(MapEditor, _render_border_map);
