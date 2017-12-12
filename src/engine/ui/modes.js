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

export function isUIInCreationMode() {
  return (
    this.isUIInMapCreationMode()
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

export function setUIMousePosition(x, y) {
  let rel = this.getRelativeMapTile(x, y);
  let map = this.currentMap;
  // set ui mouse position
  {
    // absolute position
    $("#engine-ui-mx").innerHTML = `X: ${rel.x}`;
    $("#engine-ui-my").innerHTML = `Y: ${rel.y}`;
    // relative to current map position
    $("#engine-ui-rmx").innerHTML = `X: ${rel.x - map.x}`;
    $("#engine-ui-rmy").innerHTML = `Y: ${rel.y - map.y}`;
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
    let map = this.creation.map;
    // we're resizing the added map
    if (this.drag.ldown) {
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
  // map resizing
  else if (this.isUIInMapResizeMode()) {
    let map = this.resizing.map;
    let resize = this.selection.mapResize;
    if (!this.drag.ldown) this.setUIMapResizeCursor(map);
    // drag-resize the map
    if (this.drag.ldown) {
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
      if (!dir.length) {
        let sx = resize.sx;
        let sy = resize.sy;
        if (sx !== Number.MAX_SAFE_INTEGER && sy !== Number.MAX_SAFE_INTEGER) {
          map.x = rel.x - sx;
          map.y = rel.y - sy;
        }
      }
      else if (sx !== Number.MAX_SAFE_INTEGER && sy !== Number.MAX_SAFE_INTEGER) {
        if (sel.x < 0) {
          map.margin.x = (rel.x - sx) - map.x;
        }
        else if (sel.x > 0) {
          map.margin.w = (rel.x - sx) - map.x;
        }
        /*if (sel.y < 0) {
          let height = map.y - rel.y - sy;
          map.y = rel.y - sy;
          map.height += height;
        }
        else if (sel.y > 0) {
          let height = (rel.y + 1) - map.y;
          map.height = height;
        }*/
      }
      this.updateMapStatsModeUI(map);
      let isPlaceable = this.isFreeMapSpaceAt(
        map.x + map.margin.x, map.y + map.margin.y,
        map.width + map.margin.w, map.height + map.margin.h,
        map
      );
      this.setUIMapStatsMapValidity(map, isPlaceable);
    }
  }
};
