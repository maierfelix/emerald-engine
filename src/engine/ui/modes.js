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
  closeAlertModal
} from "../../screens/index";

import Map from "../map/index";
import Storage from "../../storage";

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
  // auto refresh the map object settings menu
  if (this.mode === CFG.ENGINE_MODE_OBJ) this.refreshUIMapObject(this.currentObject);
  if (this.mode === void 0) console.warn(`Unexpected mode switch!`);
  this.redrawTileset();
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
  let layer = this.currentLayer;
  let tileset = this.currentTileset;
  let tsSelection = this.selection.tileset;
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
  // object dragging
  if (this.isUIInObjectMode()) {
    let object = this.selection.object;
    if (this.isLeftMousePressed() && object !== null) {
      let map = object.map;
      let norm = map.normalizeCoordinates(
        rel.x - map.x,
        rel.y - map.y
      );
      object.x = norm.x;
      object.y = norm.y;
      this.refreshUIMapObject(object);
    }
    let focusedObject = this.getMapObjectByPosition(rel.x, rel.y);
    // gives the active object a higher priority than unactive objects
    focusedObject = focusedObject && this.currentObject ? this.currentObject : focusedObject;
    this.setUIObjectCursor(focusedObject);
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
  // we're in object creation mode
  else if (this.isUIInObjectCreationMode()) {
    let object = this.creation.object;
    let map = object.map;
    let norm = map.normalizeCoordinates(
      rel.x - map.x,
      rel.y - map.y
    );
    object.x = norm.x;
    object.y = norm.y;
    this.updateMapStatsModeUI(map);
    this.setUIObjectPlacableCursor(object);
  }
  // ts mode
  else if (this.isUIInTilesetMode() && this.isLeftMousePressed()) {
    // normalized coordinates
    let nx = rel.x - map.x;
    let ny = rel.y - map.y;
    // selection
    if (this.isUIInSelectMode()) {
      let selection = this.selection.map;
      let sel = getNormalizedSelection(
        rel.x, rel.y,
        selection.sx, selection.sy
      );
      this.selection.map.ax = (rel.x - sel.x);
      this.selection.map.ay = (rel.y - sel.y);
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
