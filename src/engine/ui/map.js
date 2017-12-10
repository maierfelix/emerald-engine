import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
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

export function isUIInMapMoveMode() {
  return this.moving.map !== null;
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

export function onUIResizeMap(map) {
  let width = parseInt($(`#engine-ui-opt-width`).value);
  let height = parseInt($(`#engine-ui-opt-height`).value);
  // only resize if necessary
  if (map.width !== width || map.height !== height) {
    map.resize(width, height);
  }
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
  this.setUINewMapStatsVisibility(visibility);
  if (visibility) this.setUIMapCursor("pointer");
  else this.setUIMapCursor("default");
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

export function onUIMapMove(map) {
  this.moving.map = map;
  this.selection.mapMove.ox = map.x;
  this.selection.mapMove.oy = map.y;
  this.updateMapStatsModeUI(map);
  this.setUIMapStatsModeVisibility(true);
};

export function onUIMapMoveAbort(map, reset) {
  let canBePlaced = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height, map);
  if (reset) {
    map.x = this.selection.mapMove.ox;
    map.y = this.selection.mapMove.oy;
    this.moving.map = null;
    this.setUIMapStatsModeVisibility(false);
  }
  else if (canBePlaced) {
    this.moving.map = null;
    this.setUIMapStatsModeVisibility(false);
  }
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

export function setUINewMapStatsVisibility(state) {
  let el = $(`#engine-ui-top-stats`);
  el.style.visibility = state ? `visible` : `hidden`;
};

export function updateMapStatsModeUI(map) {
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  statX.innerHTML = `X: ` + map.x;
  statY.innerHTML = `Y: ` + map.y;
  statW.innerHTML = `Width: ` + map.width;
  statH.innerHTML = `Height: ` + map.height;
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

export function setUIMapPlacableCursor(map) {
  let isPlaceable = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height);
  if (!isPlaceable) {
    this.setUIMapCursor("not-allowed");
  } else {
    this.setUIMapCursor("pointer");
  }
};

export function setUIMapMoveableCursor(map) {
  let rel = this.getRelativeMapTile(this.mx, this.my);
  if (coordsInMapBoundings(map, rel.x, rel.y)) {
    let isPlaceable = this.isFreeMapSpaceAt(map.x, map.y, map.width, map.height, map);
    if (!isPlaceable) this.setUIMapCursor("not-allowed");
    else this.setUIMapCursor("move");
  } else {
    this.setUIMapCursor("default");
  }
};
