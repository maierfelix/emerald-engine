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
  if (map) this.setUIActiveMapOptions(map);
  else this.resetUIActiveMapOptions();
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
      map.createMutatorSession();
      this.commitTask({
        kind: CFG.ENGINE_TASKS.MAP_DELETE,
        changes: [{ map }]
      });
      this.endCommitSession();
      this.removeMap(map, false);
    }
    closeAlertModal();
  });
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
    map.createMutatorSession();
    this.commitTask({
      kind: CFG.ENGINE_TASKS.MAP_CREATE,
      changes: [{ map }]
    });
    this.endCommitSession();
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
    map.createMutatorSession();
    this.commitTask({
      kind: CFG.ENGINE_TASKS.MAP_RESIZE,
      changes: [task]
    });
    this.endCommitSession();
    map.resize(margin.x, margin.y, margin.w, margin.h);
    this.onUIMapResizeFinish();
  }
};
