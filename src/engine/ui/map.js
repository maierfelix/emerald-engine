import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  getResizeDirection,
  coordsInMapBoundings
} from "../../utils";

import {
  showAlertModal,
  closeAlertModal
} from "../../screens/index";

import Map from "../map/index";

export function isUIInMapCreationMode() {
  return this.creation.map !== null;
};

export function isUIInMapResizeMode() {
  return this.resizing.map !== null;
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
  elName.value = settings.name || ``;
  elShowName.checked = settings.showName ? true : false;
  elType.selectedIndex = settings.type || 0;
  elWeather.selectedIndex = settings.weather || 0;
  elMusic.selectedIndex = settings.music || 0;
  this.onUISetMapSize(map, map.width, map.height);
};

export function onUIUpdateMapSettings(property, value) {
  let map = this.currentMap;
  if (!map.settings.hasOwnProperty(property)) {
    console.warn(`Invalid map property ${property}`, map);
  }
  map.settings[property] = value;
};

export function onUISetMapSize(map, width, height) {
  let elWidth = $(`#engine-ui-opt-width`);
  let elHeight = $(`#engine-ui-opt-height`);
  let dataLoss = (width < map.width || height < map.height);
  //$(`#engine-ui-resize-map-warning`).style.display = dataLoss ? `flex` : `none`;
  //elWidth.value = Math.max(1, width || 1);
  //elHeight.value = Math.max(1, height || 1);
};

export function onUIMapDelete(map) {
  showAlertModal(`Do you really want to delete this map?`).then((answer) => {
    if (answer) this.removeMap(map);
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

export function onUIMapAdd() {
  let map = new Map(this).setBoundings(
    CFG.ENGINE_DEFAULT_MAP.WIDTH, CFG.ENGINE_DEFAULT_MAP.HEIGHT
  );
  let rel = this.getRelativeMapTile(this.mx, this.my);
  map.x = rel.x;
  map.y = rel.y;
  this.creation.map = map;
  this.resetMapPreviewAnchor();
  this.setUIMapStatsModeVisibility(true);
  this.updateMapStatsModeUI(this.creation.map);
};

export function onUIMapAddAbort() {
  this.creation.map = null;
  this.setUIMapStatsModeVisibility(false);
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
  let json = this.mapsToJSON();
  console.log(json);
};

export function onUIPlaceNewMap(map) {
  let valid = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height);
  if (valid) {
    map.setBoundings(map.width, map.height);
    this.addMap(map);
    this.onUIMapAddAbort();
    this.setUIActiveMap(map);
  }
};

export function onUIPlaceResizedMap(map) {
  let bounds = map.getMarginBoundings();
  let valid = this.isFreeMapSpaceAt(bounds.x, bounds.y, bounds.w, bounds.h, map);
  console.log(bounds, valid);
  if (valid) {
    map.resize(bounds.x, bounds.y, bounds.w, bounds.h);
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
  switch (this.tsEditMode) {
    // bucket filling
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
    // magic bucket filling
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
