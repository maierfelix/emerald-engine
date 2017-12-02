import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  loadJSONFile,
  getRelativeTile,
  addSessionToQuery,
  createCanvasBuffer
} from "../../utils";

import Map from "../map/index";

export function resetUIModeButtons() {
  $("#engine-ui-mode-ts").setAttribute("class", "ts-btn");
  $("#engine-ui-mode-obj").setAttribute("class", "ts-btn");
  $("#engine-ui-mode-opt").setAttribute("class", "ts-btn");
};

export function resetUIModeMenus() {
  $("#engine-ui-ts").style.display = "none";
  $("#engine-ui-obj").style.display = "none";
  $("#engine-ui-opt").style.display = "none";
};

export function setUIVisibility(state) {
  let visibility = state ? "visible" : "hidden";
  $("#engine-ui-top-menu").style.visibility = visibility;
  $("#engine-ui-right-menu").style.visibility = visibility;
};

export function setUIMode(mode) {
  this.resetUIModeButtons();
  this.resetUIModeMenus();
  let elBtn = $(`#engine-ui-mode-${mode}`);
  let elMenu = $(`#engine-ui-${mode}`);
  elBtn.setAttribute("class", "ts-btn ts-btn-active");
  elMenu.style.display = "block";
  this.mode = CFG[`ENGINE_MODE_${mode.toUpperCase()}`];
  if (this.mode === void 0) console.warn(`Unexpected mode switch!`);
};

export function resetUIObjMenus() {
  for (let key in CFG.ENGINE_OBJ_MODE) {
    let mode = CFG.ENGINE_OBJ_MODE[key].toLowerCase();
    let elMenu = $(`#engine-ui-obj-${mode}`);
    elMenu.style.display = "none";
  };
};

export function setUIObjMode(index) {
  this.resetUIObjMenus();
  this.objMode = index;
  if (index < 0) return;
  let mode = CFG.ENGINE_OBJ_MODE[index].toLowerCase();
  let elMenu = $(`#engine-ui-obj-${mode}`);
  elMenu.style.display = "block";
};

export function setUIMousePosition(x, y) {
  let rel = getRelativeTile(x - this.cx, y - this.cy, this.cz);
  $("#engine-ui-mx").innerHTML = `X: ${rel.x / CFG.BLOCK_SIZE}`;
  $("#engine-ui-my").innerHTML = `Y: ${rel.y / CFG.BLOCK_SIZE}`;
  // change cursor when hovering over an object
  // only do this when in object mode
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getEventEntityByPosition(rel.x / CFG.BLOCK_SIZE, rel.y / CFG.BLOCK_SIZE);
    this.setUIMapCursor(entity !== null ? "pointer" : "default");
  }
  // we're in map adding mode
  if (this.newMap !== null) {
    let rel = this.getRelativeMapTile(x, y);
    this.newMap.x = rel.x;
    this.newMap.y = rel.y;
    let valid = this.isFreeMapSpaceAt(rel.x, rel.y, this.newMap.width, this.newMap.height);
    if (!valid) {
      this.setUIMapCursor("not-allowed");
    } else {
      this.setUIMapCursor("pointer");
    }
  }
};

export function setUIMapCursor(cursor) {
  this.map.style.cursor = cursor;
};

export function resetUIActiveTilesetLayers() {
  for (let key in CFG.ENGINE_TS_LAYERS) {
    let layerIndex = CFG.ENGINE_TS_LAYERS[key];
    let el = $(`#engine-layer-btn-${layerIndex}`);
    el.setAttribute("class", "");
  };
};

export function setUIActiveTilesetLayer(index) {
  this.tsMode = index;
  this.resetUIActiveTilesetLayers();
  $(`#engine-layer-btn-${index}`).setAttribute("class", "active-layer-btn");
};

export function setUITilesetBundle(bundle) {
  $("#engine-ui-cts-name").innerHTML = `🎨 ${bundle.name}`;
  $("#engine-ui-cts-subts").innerHTML = ``;
  // collect all sub-tileset names
  let tilesets = [];
  for (let key in bundle.tilesets) tilesets.push(key);
  // sort them alphabetically ascending
  tilesets.sort((a, b) => a.localeCompare(b));
  tilesets.map((name, index) => {
    let el = document.createElement("option");
    el.innerHTML = name;
    $("#engine-ui-cts-subts").appendChild(el);
  });
  $("#engine-ui-cts-subts").onchange(null);
  this.resetTilesetSelection();
};

export function onUISubTilesetChange(index) {
  let name = $("#engine-ui-cts-subts").children[index].innerHTML;
  this.useTilesetFromBundle(this.currentBundle, name);
};

export function onUIMapAdd() {
  let map = new Map(this).resize(
    CFG.ENGINE_DEFAULT_MAP.WIDTH, CFG.ENGINE_DEFAULT_MAP.HEIGHT
  );
  this.newMap = map;
  this.setUIVisibility(false);
  this.setUIMapCursor("pointer");
};

export function onUIMapSave() {
  let map = this.currentMap;
  let json = map.toJSON();
  console.log(json);
};

export function onUIPlaceNewMapAt(map, x, y) {
  let valid = this.isFreeMapSpaceAt(x, y, map.width, map.height);
  if (valid) {
    map.x = x;
    map.y = y;
    this.newMap = null;
    this.currentMap = map;
    this.addMap(map);
    this.setUIVisibility(true);
    this.setUIMapCursor("default");
  }
};

export function processUIMouseInput(e) {
  let x = e.clientX;
  let y = e.clientY;
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  // object dragging
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getEventEntityByPosition(rel.x, rel.y);
    if (entity !== null && this.selection.entity === null) this.selection.entity = entity;
    if (this.selection.entity !== null) {
      let entity = this.selection.entity;
      entity.x = rel.x;
      entity.y = rel.y;
    }
  }
  // tile drawing
  else if (this.mode === CFG.ENGINE_MODE_TS) {
    map.drawTileSelectionAt(
      rel.x, rel.y,
      this.tsMode,
      this.selection.tileset
    );
  }
};
