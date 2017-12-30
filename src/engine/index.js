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
import Storage from "../storage";
import WebGLRenderer from "../webgl";
import CanvasRecorder from "../canvas-recorder";

import * as _map from "./map";
import * as _init from "./init";
import * as _undo from "./undo";
import * as _camera from "./camera";
import * as _tileset from "./tileset";
import * as _listeners from "./listeners";

import * as _ui_map from "./ui/map";
import * as _ui_modes from "./ui/modes";
import * as _ui_modal from "./ui/modal";
import * as _ui_tileset from "./ui/tileset";
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
    this.mapGL = $("#engine-map-gl");
    this.tileset = $("#engine-tileset");
    this.tsCtx = this.tileset.getContext("2d");
    this.gl = new WebGLRenderer(this.mapGL);
    this.drawingMode = CFG.ENGINE_DEFAULT_RENDERER;
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
      mapMove: { sx: 0, sy: 0, ox: 0, oy: 0 },
      mapResize: { sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0, updateCursor: false },
      newMap: { sx: 0, sy: 0, ex: 0, ey: 0, ax: 0, ay: 0, justResized: false },
      map: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0, ax: 0, ay: 0 },
      tileset: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 }
    };
    this.creation = {
      map: null
    };
    this.resizing = {
      map: null
    };
    this.preview = {
      map: null,
      tileset: null
    };
    this.redraw = {
      tileset: false
    };
    this.lock = {
      cameraZ: false
    };
    this.session = engine.session;
    this.mode = -1;
    this.objMode = -1;
    this.tsEditMode = -1;
    this.modalMode = null;
    this.forcedMapCreation = false;
    this.player = null;
    this.maps = [];
    this.bundles = {};
    this.currentMap = null;
    this.currentWorld = null;
    this.currentLayer = -1;
    this.currentBundle = null;
    this.currentTileset = null;
    this.entities = [];
    this.pos = 0;
    this.tasks = [];
    this.currentCommit = null;
    this.autoTiling = null;
    this.selectedTiles = [];
    this.tileCopy = null;
    this.setup();
  }
};

MapEditor.prototype.clear = function() {
  this.ctx.clearRect(
    0, 0,
    this.width, this.height
  );
  this.gl.clear();
};

MapEditor.prototype.draw = function() {
  let tileset = this.currentTileset;
  this.clear();
  this.drawMaps();
  if (this.isUIInTilesetMode()) this.drawTileset(tileset);
  if (this.isUIInMapCreationMode()) this.drawMapPreview(this.creation.map);
  else if (this.isUIInMapResizeMode()) this.drawMapPreview(this.resizing.map);
  if (this.cz >= CFG.ENGINE_CAMERA_GRID_MIN_SCALE) {
    drawGrid(this.ctx, this.cz, this.cx, this.cy, this.width, this.height);
  }
  this.frames++;
};

MapEditor.prototype.update = function() {

};

MapEditor.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  this.map.width = width;
  this.map.height = height;
  setImageSmoothing(this.ctx, false);
  this.gl.resize(width, height);
};

MapEditor.prototype.initUI = function() {
  this.updateUIMouseStats();
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

MapEditor.prototype.endCommitSession = function() {
  let maps = this.maps;
  for (let ii = 0; ii < maps.length; ++ii) {
    let map = maps[ii];
    if (!map.isRecordingMutations()) continue;
    let mutations = map.endMutatorSession();
    if (mutations.length) {
      if (this.autoTiling) {
        this.commitTask({
          kind: CFG.ENGINE_TASKS.MAP_AUTOTILE,
          changes: mutations,
          original: this.autoTiling
        });
      } else {
        this.commitTask({
          kind: CFG.ENGINE_TASKS.MAP_TILE_CHANGE,
          changes: mutations
        });
      }
    }
  };
  this.endCommit();
};

MapEditor.prototype.loadStorageSettings = function() {
  let settings = Storage.read(`settings`);
  if (!settings) settings = Storage.write(`settings`, {});
  this.onUILockCameraZ(!!settings.lockCameraZ);
  this.cz = settings.cameraOffsetZ || CFG.ENGINE_CAMERA_MIN_SCALE;
  this.cx = settings.cameraOffsetX || 0.0;
  this.cy = settings.cameraOffsetY || 0.0;
};

extend(MapEditor, _map);
extend(MapEditor, _init);
extend(MapEditor, _undo);
extend(MapEditor, _camera);
extend(MapEditor, _tileset);
extend(MapEditor, _listeners);

extend(MapEditor, _ui_map);
extend(MapEditor, _ui_modes);
extend(MapEditor, _ui_modal);
extend(MapEditor, _ui_tileset);
extend(MapEditor, _ui_encounter);

extend(MapEditor, _render_map);
extend(MapEditor, _render_tileset);
extend(MapEditor, _render_preview);
extend(MapEditor, _render_border_map);
extend(MapEditor, _render_map_objects);
