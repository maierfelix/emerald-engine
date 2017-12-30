import * as CFG from "../../cfg";

import {
  $,
  GET,
  POST,
  assert,
  boundingsMatch,
  addSessionToQuery,
  getResizeDirection,
  coordsInMapBoundings,
  getTilesetTilePositionByIndex
} from "../../utils";

import {
  showAlertModal,
  closeAlertModal
} from "../../screens/index";

import Map from "../map/index";

export function setUIMapCursor(cursor) {
  this.map.style.cursor = cursor;
};

export function refreshUIMaps() {
  this.refreshUIMapChooseList();
  this.refreshUIMapOptions();
};

export function resetUIMapChooseList() {
  let el = $(`#engine-ui-map-select`);
  el.innerHTML = ``;
};

export function refreshUIMapChooseList() {
  this.resetUIMapChooseList();
  let el = $(`#engine-ui-map-select`);
  this.maps.map((map, index) => {
    let child = document.createElement("option");
    child.innerHTML = map.getName();
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
      this.refreshUIMapOptions(map);
      this.refreshUIMapInteractions(map);
      return;
    }
  };
  console.warn(`Failed to set active map`, map);
};

export function refreshUIMapInteractions(map) {
  let x = this.mx;
  let y = this.my;
  this.onUIMapFill(x, y, true);
  this.updateUIMouseStats();
};

export function setUIActiveMapByName(name) {
  let maps = this.maps;
  for (let ii = 0; ii < maps.length; ++ii) {
    let cmap = maps[ii];
    if (cmap.name === name) return this.setUIActiveMap(cmap);
  };
  console.warn(`Failed to set active map by name`, name);
};

export function switchMapByUIContextMenu() {
  let elActiveMap = $(`#engine-ui-context-switch-map`);
  let rel = this.getRelativeMapTile(this.mx, this.my);
  let map = this.getMapByPosition(rel.x, rel.y);
  this.setUIActiveMap(map);
};

export function refreshUIMapOptions(map) {
  if (map) {
    this.setUIActiveMapObjects(map);
    this.setUIActiveMapOptions(map);
  } else {
    this.resetUIActiveMapObjects();
    this.resetUIActiveMapOptions();
  }
};

export function resetUIActiveMapObjects(map) {

};

export function setUIActiveMapObjects(map) {

};

export function resetUIActiveMapOptions() {
  let elName = $(`#engine-ui-opt-name`);
  let elShowName = $(`#engine-ui-opt-show-name`);
  let elType = $(`#engine-ui-opt-type`);
  let elWeather = $(`#engine-ui-opt-weather`);
  let elMusic = $(`#engine-ui-opt-music`);
  elName.value = ``;
  elShowName.checked = false;
  elType.selectedIndex = 0;
  elWeather.selectedIndex = 0;
  elMusic.selectedIndex = 0;
  this.resetUIActiveMapEncounters();
};

export function setUIActiveMapOptions(map) {
  this.resetUIActiveMapOptions();
  let settings = map.settings;
  let elName = $(`#engine-ui-opt-name`);
  let elShowName = $(`#engine-ui-opt-show-name`);
  let elType = $(`#engine-ui-opt-type`);
  let elWeather = $(`#engine-ui-opt-weather`);
  let elMusic = $(`#engine-ui-opt-music`);
  elName.value = settings.name || ``;
  elShowName.checked = settings.showName ? true : false;
  elType.selectedIndex = settings.type || 0;
  elWeather.selectedIndex = settings.weather || 0;
  elMusic.selectedIndex = settings.music || 0;
  this.setUIActiveMapEncounters(map);
};

export function onUIUpdateMapSettings(property, value) {
  let map = this.currentMap;
  if (!map.settings.hasOwnProperty(property)) {
    console.warn(`Invalid map property ${property}`, map);
  }
  map.settings[property] = value;
};

export function onUIMapDelete(map) {
  showAlertModal(`Do you really want to delete "${map.getName()}"?`).then((answer) => {
    if (answer) {
      this.commitTask({
        kind: CFG.ENGINE_TASKS.MAP_DELETE,
        changes: [{ map }]
      });
      this.removeMap(map, false);
    }
    closeAlertModal();
  });
};

export function setUIMapStatsModeVisibility(visibility) {
  this.setUIVisibility(!visibility);
  this.setUIMapCursor("pointer");
  this.setUIMapStatsVisibility(visibility);
  if (visibility) this.setUIMapCursor("pointer");
  else this.setUIMapCursor("default");
  this.setUIMapStatsWarning(``);
};

export function setUIMapStatsVisibility(state) {
  let el = $(`#engine-ui-top-stats`);
  el.style.visibility = state ? `visible` : `hidden`;
};

export function updateMapStatsModeUI(map) {
  if (this.isUIInMapResizeMode()) return this.updateMapStatsResizeModeUI(map);
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  statX.innerHTML = `X: ` + map.x;
  statY.innerHTML = `Y: ` + map.y;
  statW.innerHTML = `Width: ` + map.width;
  statH.innerHTML = `Height: ` + map.height;
};

export function updateMapStatsResizeModeUI(map) {
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  let mrX = map.margin.x;
  let mrY = map.margin.y;
  let mrW = map.margin.w - mrX;
  let mrH = map.margin.h - mrY;
  // show a + sign when margin values are positive
  mrX = (mrX > 0 ? `+` : ``) + mrX;
  mrY = (mrY > 0 ? `+` : ``) + mrY;
  mrW = (mrW > 0 ? `+` : ``) + mrW;
  mrH = (mrH > 0 ? `+` : ``) + mrH;
  statX.innerHTML = `X: ${map.x}:${mrX}`;
  statY.innerHTML = `Y: ${map.y}:${mrY}`;
  statW.innerHTML = `Width: ${map.width}:${mrW}`;
  statH.innerHTML = `Height: ${map.height}:${mrH}`;
};

export function setUIMapStatsWarning(msg) {
  let el = $(`#engine-ui-top-stats-warning`);
  let elMsg = $(`#engine-ui-top-stats-warning-msg`);
  el.style.display = msg.length > 0 ? `block` : `none`;
  elMsg.innerHTML = msg;
};

export function setUIMapStatsMapValidity(map, isPlaceable) {
  this.setUIMapStatsWarning(``);
  if (!isPlaceable) {
    let bounds = map.getMarginBoundings();
    if (!this.isValidMapSize(bounds.w, bounds.h)) {
      this.setUIMapStatsWarning(`Invalid Map boundings`);
    } else {
      this.setUIMapStatsWarning(`Invalid Map position`);
    }
  }
};

export function onUIMapAdd(forced = false) {
  let map = new Map(this).setBoundings(
    CFG.ENGINE_DEFAULT_MAP.WIDTH, CFG.ENGINE_DEFAULT_MAP.HEIGHT
  );
  let rel = this.getRelativeMapTile(this.mx, this.my);
  map.x = rel.x;
  map.y = rel.y;
  this.creation.map = map;
  this.forcedMapCreation = forced;
  this.resetMapPreviewAnchor();
  this.setUIMapStatsModeVisibility(true);
  this.updateMapStatsModeUI(this.creation.map);
};

export function onUIMapAddAbort() {
  if (!this.forcedMapCreation) {
    this.creation.map = null;
    this.setUIMapStatsModeVisibility(false);
  }
};

export function onUIMapResize(map) {
  this.resizing.map = map;
  this.updateMapStatsModeUI(map);
  this.setUIMapStatsModeVisibility(true);
  let resize = this.selection.mapResize;
  resize.ox = map.x;
  resize.oy = map.y;
  resize.ow = map.width;
  resize.oh = map.height;
};

export function onUIMapResizeAbort() {
  let map = this.resizing.map;
  let resize = this.selection.mapResize;
  map.x = resize.ox;
  map.y = resize.oy;
  map.resetMargins();
  this.onUIMapResizeFinish();
};

export function onUIMapResizeFinish() {
  this.resizing.map = null;
  this.setUIMapStatsModeVisibility(false);
};

export function onUIMapSave() {
  let maps = JSON.parse(this.mapsToJSON());
  let world = this.currentWorld;
  let data = JSON.stringify({ maps: maps });
  let query = CFG.ENGINE_TS_SERVER_LOC + `/?cmd=SAVE_WORLD&world=` + world.name + `&data=${data}`;
  $("#engine-ui-map-save-txt").innerHTML = `Saving...`;
  POST(addSessionToQuery(query, this.session), 500).then(res => {
    $("#engine-ui-map-save-txt").innerHTML = `Save`;
  });
};

export function onUIPlaceNewMap(map) {
  let valid = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height);
  if (valid) {
    this.commitTask({
      kind: CFG.ENGINE_TASKS.MAP_CREATE,
      changes: [{ map }]
    });
    map.setBoundings(map.width, map.height);
    this.addMap(map);
    this.onUIMapAddAbort();
    this.setUIActiveMap(map);
  }
};

export function onUIPlaceResizedMap(map) {
  let margin = map.getMarginBoundings();
  let valid = this.isFreeMapSpaceAt(margin.x, margin.y, margin.w, margin.h, map);
  if (valid) {
    let data = map.cloneData();
    let current = map.getBoundings();
    let resizedPos = this.selection.mapResize;
    let original = {
      x: resizedPos.ox,
      y: resizedPos.oy,
      w: resizedPos.ow,
      h: resizedPos.oh
    };
    let task = {
      map,
      data,
      current,
      original,
      margin
    };
    this.commitTask({
      kind: CFG.ENGINE_TASKS.MAP_RESIZE,
      changes: [task]
    });
    map.resize(margin.x, margin.y, margin.w, margin.h);
    this.onUIMapResizeFinish();
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
  if (this.isUIInBucketFillMode()) {
    if (preview) map.drawPreview = true;
    map.bucketFillAt(
      nx, ny,
      tileset,
      this.currentLayer,
      sel.x / CFG.BLOCK_SIZE,
      sel.y / CFG.BLOCK_SIZE
    );
    map.drawPreview = false;
  }
  else if (this.isUIInMagicFillMode()) {
    if (preview) map.drawPreview = true;
    map.magicFillAt(
      nx, ny,
      tileset,
      this.currentLayer,
      sel.x / CFG.BLOCK_SIZE,
      sel.y / CFG.BLOCK_SIZE
    );
    map.drawPreview = false;
  }
};

export function onUICopyMapSelection() {
  this.updateMapSelectionPreview();
  this.tileCopy = this.selectedTiles;
};

export function onUIPasteMapSelection() {
  let map = this.currentMap;
  let tiles = this.tileCopy;
  if (!tiles) return;
  if (!map.isRecordingMutations()) map.createMutatorSession();
  let currentLayer = this.currentLayer;
  let sel = this.selection.map;
  let rel = this.getRelativeMapTile(this.mx, this.my);
  let width = (sel.w - sel.x) + 1;
  let height = (sel.h - sel.y) + 1;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let tileset = this.bundles[tile.bundleId].tilesets[tile.tilesetId];
    let srcTile = getTilesetTilePositionByIndex(tile.tile);
    let layer = currentLayer === 4 ? tile.layer : currentLayer;
    let sx = tile.x;
    let sy = tile.y;
    let tx = ((rel.x + tile.tx) - sel.ax) - map.x;
    let ty = ((rel.y + tile.ty) - sel.ay) - map.y;
    map.drawTileAt(
      tileset,
      sx, sy,
      tx, ty,
      layer
    );
  };
  this.endCommitSession();
};

export function onUICutMapSelection() {
  let map = this.currentMap;
  if (!map.isRecordingMutations()) map.createMutatorSession();
  this.onUICopyMapSelection();
  this.onUIClearMapSelection();
  this.endCommitSession();
};

export function onUIClearMapSelection() {
  let map = this.currentMap;
  let sel = this.selection.map;
  let layer = this.currentLayer;
  let tileset = this.currentTileset;
  let xx = sel.x - map.x;
  let yy = sel.y - map.y;
  let ww = ((sel.w - map.x) - xx + 1);
  let hh = ((sel.h - map.y) - yy + 1);
  let sx = -1;
  let sy = -1;
  let layers = layer === 4 ? 4 : 1;
  for (let ll = 1; ll <= layers; ++ll) {
    let ly = layers === 4 ? ll : layer;
    if (ly === 4) continue; // ignore layer 4
    for (let ii = 0; ii < ww * hh; ++ii) {
      let x = (ii % ww) | 0;
      let y = (ii / ww) | 0;
      map.drawTileAt(
        tileset,
        sx, sy,
        x + xx, y + yy,
        ly
      );
    };
  };
  console.log("Clear", xx, yy, ww, hh);
};

export function setUIMapPlacableCursor(map) {
  let mrX = map.margin.x;
  let mrY = map.margin.y;
  let mrW = map.margin.w - mrX;
  let mrH = map.margin.h - mrY;
  let isPlaceable = this.isFreeMapSpaceAt(
    map.x + mrX, map.y + mrY,
    map.width + mrW, map.height + mrH
  );
  if (!isPlaceable) {
    this.setUIMapCursor("not-allowed");
  } else {
    this.setUIMapCursor("pointer");
  }
  this.setUIMapStatsMapValidity(map, isPlaceable);
};

export function setUIMapResizeCursor(map) {
  let rel = this.getRelativeMapTile(this.mx, this.my);
  if (coordsInMapBoundings(map, rel.x, rel.y)) {
    let dir = getResizeDirection(rel.x, rel.y, map);
    let cursor = dir ? `${dir}-resize` : "move";
    this.setUIMapCursor(cursor);
  } else {
    this.setUIMapCursor("default");
  }
};
