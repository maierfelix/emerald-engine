import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  saveFile,
  loadJSONFile,
  getRelativeTile,
  addSessionToQuery,
  getResizeDirection,
  createCanvasBuffer,
  stringToArrayBuffer,
  coordsInMapBoundings,
  getNormalizedSelection,
  getNormalizedResizeDirection
} from "../../utils";

import {
  showAlertModal,
  closeAlertModal,
  isLoadingModalActive
} from "../../screens/index";

import Map from "../map/index";
import Storage from "../../storage";

export function isActiveTilesetFillMode() {
  return (
    this.isUIInTilesetMode() &&
    (this.isUIInBucketFillMode() || this.isUIInMagicFillMode())
  );
};

export function isUIInFillMode() {
  return this.isActiveTilesetFillMode();
};

export function isUIInCreationMode() {
  return this.isUIInMapCreationMode();
};

export function isUIInSelectMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.SELECT;
};

export function isUIInPencilMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.PENCIL;
};

export function isUIInPipetteMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.PIPETTE;
};

export function isUIInBucketFillMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.BUCKET;
};

export function isUIInMagicFillMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.MAGIC;
};

export function isUIInAutotileMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.AUTOTILE;
};

export function isUIInTilesetMode() {
  return this.mode === CFG.ENGINE_MODE_TS;
};

export function isUIInObjectMode() {
  return this.mode === CFG.ENGINE_MODE_OBJ;
};

export function isUIInOptionMode() {
  return this.mode === CFG.ENGINE_MODE_OPT;
};

export function isUIInMapCreationMode() {
  return this.creation.map !== null;
};

export function isUIInMapResizeMode() {
  return this.resizing.map !== null;
};

export function isLeftMousePressed() {
  return this.drag.ldown === true;
};

export function isRightMousePressed() {
  return this.drag.rdown === true;
};

export function isUIInAnyActiveMode() {
  return (
    isLoadingModalActive() ||
    this.isLeftMousePressed() ||
    this.isUIInMapCreationMode() ||
    this.isUIInMapResizeMode()
  );
};

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

export function isUIContextMenuActive() {
  return this.drag.context === true;
};

export function onUILockCameraZ(state) {
  let el = $(`#engine-ui-mz`);
  if (state === void 0) this.lock.cameraZ = !this.lock.cameraZ;
  else this.lock.cameraZ = state;
  if (this.lock.cameraZ) el.classList.add("locked");
  else el.classList.remove("locked");
  Storage.write(`settings.lockCameraZ`, this.lock.cameraZ);
  this.updateUIMouseStats();
};

export function resetUIContextMenu(e) {
  $(`#engine-ui-context-switch-map`).style.display = "none";
  $(`#engine-ui-context-create-object`).style.display = "none";
  $(`#engine-ui-context-delete-object`).style.display = "none";
};

export function showUIContextMenu() {
  this.drag.context = true;
  let el = $(`#engine-ui-context-menu`);
  let elActiveMap = $(`#engine-ui-context-switch-map`);
  el.style.display = `flex`;
  let x = this.mx - (el.offsetWidth / 2);
  let y = this.my - (18 - CFG.ENGINE_UI_OFFSET_Y);
  el.style.left = x + `px`;
  el.style.top = y + `px`;
  this.resetUIContextMenu();
  let rel = this.getRelativeMapTile(this.mx, this.my);
  let map = this.getMapByPosition(rel.x, rel.y);
  if (map && this.currentMap !== map) {
    elActiveMap.innerHTML = `Switch to "${map.getName()}"`;
    elActiveMap.style.display = `block`;
  } else {
    $(`#engine-ui-context-create-object`).style.display = "block";
    $(`#engine-ui-context-delete-object`).style.display = "block";
  }
};

export function closeUIContextMenu(e) {
  this.drag.context = false;
  let el = $(`#engine-ui-context-menu`);
  el.style.display = `none`;
};

export function processUIMouseInput(e) {
  let x = this.mx;
  let y = this.my;
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  let layer = this.currentLayer;
  let tileset = this.currentTileset;
  let etSelection = this.selection.entity;
  let tsSelection = this.selection.tileset;
  // there is no active map
  if (!map) return;
  // we're in map adding mode, abort
  if (this.isUIInMapCreationMode()) return;
  // object dragging
  if (this.isUIInObjectMode()) {
    let entity = this.getMapObjectByPosition(rel.x, rel.y);
    if (entity !== null && etSelection === null) this.selection.entity = entity;
    if (etSelection !== null) {
      let entity = this.selection.entity;
      entity.x = rel.x;
      entity.y = rel.y;
    }
  }
  // ts mode
  else if (this.isUIInTilesetMode()) {
    // normalized coordinates
    let nx = rel.x - map.x;
    let ny = rel.y - map.y;
    // selection
    if (this.isUIInSelectMode()) {
      let selection = this.selection.map;
      let sel = getNormalizedSelection(
        nx, ny,
        selection.sx, selection.sy
      );
      this.selection.map.ax = rel.x - sel.x;
      this.selection.map.ay = rel.y - sel.y;
      this.setMapSelection(sel.x, sel.y, sel.w, sel.h);
      this.updateMapSelectionPreview();
    }
    // pencil
    else if (this.isUIInPencilMode()) {
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
    else if (this.isUIInFillMode()) {
      this.onUIMapFill(x, y, false);
    }
    // autotile
    else if (this.isUIInAutotileMode()) {
      if (this.isSelectionInAutotileFormat(tsSelection)) {
        if (!this.autoTiling) this.autoTiling = map.cloneData();
        map.drawAutotile(
          nx, ny,
          tileset,
          layer,
          tsSelection.x / CFG.BLOCK_SIZE,
          tsSelection.y / CFG.BLOCK_SIZE
        );
      }
    }
    // pipette
    else if (this.isUIInPipetteMode()) {
      let tile = map.getTileInformationAt(nx, ny, layer);
      if (tile !== null) {
        let bundle = this.bundles[tile.bundleId];
        this.useTilesetBundle(bundle);
        this.useTilesetFromBundle(bundle, tile.tilesetId);
        this.setUITilesetSelection(
          tile.x * CFG.BLOCK_SIZE, tile.y * CFG.BLOCK_SIZE,
          tile.x * CFG.BLOCK_SIZE, tile.y * CFG.BLOCK_SIZE
        );
        //console.log(tile.bundleId + ":" + tile.tilesetId);
      }
    }
  }
};

export function updateUIMouseStats() {
  let map = this.currentMap;
  let x = this.mx;
  let y = this.my;
  let rel = this.getRelativeMapTile(x, y);
  // absolute position
  $("#engine-ui-mx").innerHTML = `X: ${rel.x}`;
  $("#engine-ui-my").innerHTML = `Y: ${rel.y}`;
  $("#engine-ui-mz").innerHTML = `Z: ${(this.cz).toFixed(2)}${this.lock.cameraZ ? " 🔒" : ""}`;
  // relative to current map position
  $("#engine-ui-rmx").innerHTML = `X: ${rel.x - (map ? map.x : 0)}`;
  $("#engine-ui-rmy").innerHTML = `Y: ${rel.y - (map ? map.y : 0)}`;
};

export function setUIMousePosition(x, y) {
  let rel = this.getRelativeMapTile(x, y);
  let map = this.currentMap;
  this.updateUIMouseStats();
  // we're in add map mode
  if (this.isUIInMapCreationMode()) {
    let map = this.creation.map;
    // we're resizing the added map
    if (this.isLeftMousePressed()) {
      // resize new map
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
      this.selection.newMap.justResized = true;
      this.setUIMapPlacableCursor(map);
    // set the new map to our mouse position
    } else {
      map.x = rel.x - this.selection.newMap.ax;
      map.y = rel.y - this.selection.newMap.ay;
      this.setUIMapPlacableCursor(map);
      this.selection.newMap.justResized = false;
    }
    this.updateMapStatsModeUI(map);
  }
  // there is no active map
  if (!map) return;
  // change cursor when hovering over an object
  // only do this when in object mode
  if (this.isUIInObjectMode()) {
    let entity = this.getMapObjectByPosition(rel.x, rel.y);
    this.setUIMapCursor(entity !== null ? "pointer" : "default");
  }
  else if (this.isUIInFillMode() && !this.isUIInMapCreationMode()) {
    this.onUIMapFill(x, y, true);
  }
  // map resizing
  if (this.isUIInMapResizeMode()) {
    let map = this.resizing.map;
    let resize = this.selection.mapResize;
    if (!this.isLeftMousePressed()) this.setUIMapResizeCursor(map);
    // drag-resize the map
    if (this.isLeftMousePressed()) {
      // update the cursor only one time
      if (resize.updateCursor) {
        this.setUIMapResizeCursor(map);
        resize.updateCursor = false;
      }
      let sx = resize.sx;
      let sy = resize.sy;
      let sw = resize.sw;
      let sh = resize.sh;
      let dir = resize.dir;
      let sel = getNormalizedResizeDirection(dir);
      // move
      if (!dir.length) {
        let sx = resize.sx;
        let sy = resize.sy;
        if (sx !== Number.MAX_SAFE_INTEGER && sy !== Number.MAX_SAFE_INTEGER) {
          map.x = rel.x - sx;
          map.y = rel.y - sy;
        }
      }
      else if (sx !== Number.MAX_SAFE_INTEGER && sy !== Number.MAX_SAFE_INTEGER) {
        let ox = map.margin.x; let oy = map.margin.y;
        let ow = map.margin.w; let oh = map.margin.h;
        if (sel.x < 0) {
          map.margin.x = sx + (rel.x - sx) - map.x;
          if (!map.isMarginBoundingsValid()) map.margin.x = ox;
        }
        else if (sel.x > 0) {
          map.margin.w = sx + (rel.x - sx) - map.width + 1 - map.x;
          if (!map.isMarginBoundingsValid()) map.margin.w = ow;
        }
        if (sel.y < 0) {
          map.margin.y = sy + (rel.y - sy) - map.y;
          if (!map.isMarginBoundingsValid()) map.margin.y = oy;
        }
        else if (sel.y > 0) {
          map.margin.h = sy + (rel.y - sy) - map.height + 1 - map.y;
          if (!map.isMarginBoundingsValid()) map.margin.h = oh;
        }
      }
      this.updateMapStatsModeUI(map);
      let bounds = map.getMarginBoundings();
      let isPlaceable = this.isFreeMapSpaceAt(
        bounds.x, bounds.y,
        bounds.w, bounds.h,
        map
      );
      this.setUIMapStatsMapValidity(map, isPlaceable);
    }
  }
};
