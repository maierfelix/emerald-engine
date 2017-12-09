import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  loadJSONFile,
  getRelativeTile,
  addSessionToQuery,
  createCanvasBuffer,
  getNormalizedSelection
} from "../../utils";

import {
  showAlertModal,
  closeAlertModal
} from "../../screens/index";

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
  this.redrawTileset();
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

export function setUIMapCursor(cursor) {
  this.map.style.cursor = cursor;
};

export function resetUIMapChooseList() {
  let el = $(`#engine-ui-map-select`);
  el.innerHTML = ``;
};

export function refreshUIMapChooseList(maps) {
  this.resetUIMapChooseList();
  let el = $(`#engine-ui-map-select`);
  maps.map((map, index) => {
    let child = document.createElement("option");
    child.innerHTML = `Map [${index}]`;
    el.appendChild(child);
  });
};

export function setUIActiveMap(map) {
  let maps = this.maps;
  for (let ii = 0; ii < maps.length; ++ii) {
    let cmap = maps[ii];
    if (cmap === map) {
      $(`#engine-ui-map-select`).selectedIndex = ii;
      this.currentMap = map;
      this.refreshUIMapMenuByMap(map);
      return;
    }
  };
  console.warn(`Failed to set active map`, map);
};

export function refreshUIMapMenuByMap(map) {
  this.setUIActiveMapObjects(map);
  this.setUIActiveMapOptions(map);
};

export function setUIActiveMapObjects(map) {

};

export function setUIActiveMapOptions(map) {
  let settings = map.settings;
  let elName = $(`#engine-ui-opt-name`);
  let elShowName = $(`#engine-ui-opt-show-name`);
  let elType = $(`#engine-ui-opt-type`);
  let elWeather = $(`#engine-ui-opt-weather`);
  let elMusic = $(`#engine-ui-opt-music`);
  let elWidth = $(`#engine-ui-opt-width`);
  let elHeight = $(`#engine-ui-opt-height`);
  elName.value = settings.name || ``;
  elShowName.checked = settings.showName ? true : false;
  elType.selectedIndex = settings.type || 0;
  elWeather.selectedIndex = settings.weather || 0;
  elMusic.selectedIndex = settings.music || 0;
  elWidth.value = map.width;
  elHeight.value = map.height;
};

export function onUIUpdateMapSettings(property, value) {
  let map = this.currentMap;
  if (!map.settings.hasOwnProperty(property)) {
    console.warn(`Invalid map property ${property}`, map);
  }
  map.settings[property] = value;
};

export function onUIDeleteMap(map) {
  showAlertModal(`Do you really want to delete this map?`).then((answer) => {
    if (answer) this.removeMap(map);
    closeAlertModal();
  });
};

export function resetUIActiveTilesetLayers() {
  for (let key in CFG.ENGINE_TS_LAYERS) {
    let layerIndex = CFG.ENGINE_TS_LAYERS[key];
    let el = $(`#engine-layer-btn-${layerIndex}`);
    el.setAttribute("class", "");
  };
};

export function setUIActiveTilesetLayer(index) {
  this.currentLayer = index;
  this.resetUIActiveTilesetLayers();
  $(`#engine-layer-btn-${index}`).setAttribute("class", "active-layer-btn");
};

export function resetUIActiveEditModes() {
  for (let key in CFG.ENGINE_TS_EDIT) {
    let el = $(`#engine-edit-mode-${key.toLowerCase()}`);
    el.setAttribute("class", "");
  };
};

export function setUIActiveEditMode(mode) {
  this.setActiveEditMode(mode);
  this.resetUIActiveEditModes();
  switch (mode) {
    case CFG.ENGINE_TS_EDIT.PENCIL:
      $(`#engine-edit-mode-pencil`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.PIPETTE:
      $(`#engine-edit-mode-pipette`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.BUCKET:
      $(`#engine-edit-mode-bucket`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.MAGIC:
      $(`#engine-edit-mode-magic`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.AUTOTILE:
      $(`#engine-edit-mode-autotile`).setAttribute("class", "active-layer-btn");
    break;
  };
  if (this.isActiveUITilesetFillMode()) {
    this.forceUISingleTilesetSelection();
  }
  this.updateTilesetSelectionPreview();
};

export function setActiveEditMode(mode) {
  this.tsEditMode = mode;
  this.redrawTileset();
};

export function forceUISingleTilesetSelection() {
  let sel = this.selection.tileset;
  let tile = getRelativeTile(this.tmx, this.tmy, CFG.ENGINE_TILESET_SCALE);
  let x = tile.x >= 0 ? tile.x : 0;
  let y = tile.y >= 0 ? tile.y : 0;
  sel.x = x;
  sel.y = y;
  sel.w = x;
  sel.h = y;
  this.updateTilesetSelectionPreview();
};

export function setUITilesetSelection(x, y, w, h) {
  let sel = this.selection.tileset;
  sel.x = x;
  sel.y = y;
  sel.w = w;
  sel.h = h;
  if (this.isActiveUITilesetFillMode()) {
    this.forceUISingleTilesetSelection();
  }
  this.redrawTileset();
};

export function isActiveTilesetFillMode() {
  return (
    (this.mode === CFG.ENGINE_MODE_TS ) &&
    (this.tsEditMode === CFG.ENGINE_TS_EDIT.BUCKET ||
    this.tsEditMode === CFG.ENGINE_TS_EDIT.MAGIC)
  );
};

export function isActiveUITilesetFillMode() {
  return this.isActiveTilesetFillMode();
};

export function isUIInCreationMode() {
  return this.isUIInMapCreationMode();
};

export function isUIInMapCreationMode() {
  return this.creation.map !== null;
};

export function isUIInAutotileMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.AUTOTILE;
};

export function updateTilesetSelectionPreview() {
  if (!this.currentTileset) return;
  let sel = this.selection.tileset;
  let map = this.currentMap;
  this.preview.tileset = null;
  if (this.isUIInAutotileMode() && this.isSelectionInAutotileFormat(sel)) {
     this.preview.tileset = this.bufferTilesetAutotileSelection(map, sel);
  } else {
    this.preview.tileset = this.bufferTilesetSelection(sel);
  }
  this.redrawTileset();
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
  let rel = this.getRelativeMapTile(this.mx, this.my);
  map.x = rel.x;
  map.y = rel.y;
  this.creation.map = map;
  this.resetMapPreviewAnchor();
  this.setUIVisibility(false);
  this.setUIMapCursor("pointer");
  this.setUINewMapStatsVisibility(true);
  this.updateUINewMapStats();
};

export function onUIMapAddAbort() {
  this.creation.map = null;
  this.setUIMapCursor("default");
  this.setUIVisibility(true);
  this.setUINewMapStatsVisibility(false);
};

export function onUIMapSave() {
  let json = this.mapsToJSON();
  console.log(json);
};

export function onUIPlaceNewMap(map) {
  let valid = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height);
  if (valid) {
    map.resize(map.width, map.height);
    this.addMap(map);
    this.onUIMapAddAbort();
  }
};

export function setUINewMapStatsVisibility(state) {
  let el = $(`#engine-ui-top-stats`);
  el.style.visibility = state ? `visible` : `hidden`;
};

export function updateUINewMapStats() {
  let map = this.creation.map;
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  statX.innerHTML = `X: ` + map.x;
  statY.innerHTML = `Y: ` + map.y;
  statW.innerHTML = `Width: ` + map.width;
  statH.innerHTML = `Height: ` + map.height;
};

export function processUIMouseInput(e) {
  let x = e.clientX;
  let y = e.clientY;
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  let layer = this.currentLayer;
  let tileset = this.currentTileset;
  let etSelection = this.selection.entity;
  let tsSelection = this.selection.tileset;
  // normalized coordinates
  let nx = rel.x - map.x;
  let ny = rel.y - map.y;
  // we're in map adding mode, abort
  if (this.isUIInMapCreationMode()) return;
  // object dragging
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getMapObjectByPosition(rel.x, rel.y);
    if (entity !== null && etSelection === null) this.selection.entity = entity;
    if (etSelection !== null) {
      let entity = this.selection.entity;
      entity.x = rel.x;
      entity.y = rel.y;
    }
  }
  // tile drawing
  else if (this.mode === CFG.ENGINE_MODE_TS) {
    // pencil
    if (this.tsEditMode === CFG.ENGINE_TS_EDIT.PENCIL) {
      let normalizedSel = {
        x: tsSelection.x / CFG.BLOCK_SIZE,
        y: tsSelection.y / CFG.BLOCK_SIZE,
        w: tsSelection.w / CFG.BLOCK_SIZE,
        h: tsSelection.h / CFG.BLOCK_SIZE
      };
      map.drawTileSelectionAt(
        nx, ny,
        layer,
        normalizedSel
      );
    }
    // fill
    else if (this.isActiveUITilesetFillMode()) {
      this.onUIMapFill(x, y, false);
    }
    // autotile
    else if (this.isUIInAutotileMode()) {
      if (this.isSelectionInAutotileFormat(tsSelection)) {
        map.drawAutotile(
          nx, ny,
          tileset,
          layer,
          tsSelection.x / CFG.BLOCK_SIZE,
          tsSelection.y / CFG.BLOCK_SIZE
        );
      }
    }
  }
};

export function onUIMapFill(x, y, preview = false) {
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  // normalized coordinates
  let nx = rel.x - map.x;
  let ny = rel.y - map.y;
  let sel = this.selection.tileset;
  let tileset = this.currentTileset;
  switch (this.tsEditMode) {
    case CFG.ENGINE_TS_EDIT.BUCKET:
      if (preview) map.drawPreview = true;
      map.bucketFillAt(
        nx, ny,
        tileset,
        this.currentLayer,
        sel.x / CFG.BLOCK_SIZE,
        sel.y / CFG.BLOCK_SIZE
      );
      map.drawPreview = false;
    break;
    case CFG.ENGINE_TS_EDIT.MAGIC:
      if (preview) map.drawPreview = true;
      map.magicFillAt(
        nx, ny,
        tileset,
        this.currentLayer,
        sel.x / CFG.BLOCK_SIZE,
        sel.y / CFG.BLOCK_SIZE
      );
      map.drawPreview = false;
    break;
  };
};

export function setUIMousePosition(x, y) {
  let rel = this.getRelativeMapTile(x, y);
  // set ui mouse position
  {
    $("#engine-ui-mx").innerHTML = `X: ${rel.x}`;
    $("#engine-ui-my").innerHTML = `Y: ${rel.y}`;
  }
  // change cursor when hovering over an object
  // only do this when in object mode
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getMapObjectByPosition(rel.x, rel.y);
    this.setUIMapCursor(entity !== null ? "pointer" : "default");
  }
  else if (this.isActiveUITilesetFillMode() && !this.isUIInMapCreationMode()) {
    this.onUIMapFill(x, y, true);
  }
  // we're in add map mode
  if (this.isUIInMapCreationMode()) {
    // we're resizing the added map
    if (this.drag.ldown) {
      // resize new map
      let map = this.creation.map;
      let sx = this.selection.newMap.sx;
      let sy = this.selection.newMap.sy;
      let normalized = getNormalizedSelection(
        rel.x, rel.y, sx, sy
      );
      let xx = normalized.x;
      let yy = normalized.y;
      let ww = (normalized.w - xx + 1);
      let hh = (normalized.h - yy + 1);
      map.x = xx;
      map.y = yy;
      map.width = ww;
      map.height = hh;
      this.selection.newMap.jr = true;
      this.setUIMapPlacableCursor(map);
    // set the added map to our mouse position
    } else {
      let map = this.creation.map;
      map.x = rel.x - this.selection.newMap.ax;
      map.y = rel.y - this.selection.newMap.ay;
      this.setUIMapPlacableCursor(map);
      this.selection.newMap.jr = false;
    }
    this.updateUINewMapStats();
  }
};

export function setUIMapPlacableCursor(map) {
  let valid = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height);
  if (!valid) {
    this.setUIMapCursor("not-allowed");
  } else {
    this.setUIMapCursor("pointer");
  }
};
