import * as CFG from "../cfg";

import {
  zoomScale,
  getRelativeTile,
  getResizeDirection,
  coordsInMapBoundings,
  getNormalizedSelection,
  getRectangleFromSelection
} from "../utils";

import Storage from "../storage";

export function zoom(e) {
  let x = e.clientX;
  let y = e.clientY - CFG.ENGINE_UI_OFFSET_Y;
  let min = CFG.ENGINE_CAMERA_MIN_SCALE;
  let max = CFG.ENGINE_CAMERA_MAX_SCALE;
  let deltaY = e.deltaY > 0 ? -1 : 1;
  let oscale = this.cz;
  let scale = (zoomScale(this.cz + deltaY) * deltaY) / 10;
  if (this.cz + scale <= min) this.cz = min;
  if (this.cz + scale >= max) this.cz = max;
  this.cz += scale;
  let sx = (x - this.cx) / oscale;
  let sy = (y - this.cy) / oscale;
  let zd = zoomScale(this.cz) - zoomScale(oscale);
  this.cx -= sx * zd;
  this.cy -= sy * zd;
  Storage.write(`settings.cameraOffsetX`, this.cx);
  Storage.write(`settings.cameraOffsetY`, this.cy);
  Storage.write(`settings.cameraOffsetZ`, this.cz);
  this.refreshMouseLast();
  this.setUIMousePosition(x, y);
};

export function mouseWheel(e) {
  if (e.target === this.map) {
    e.preventDefault();
    if (!this.lock.cameraZ) this.zoom(e);
  }
  this.refreshMouseLast();
};

export function mouseContext(e) {
  e.preventDefault();
};

export function refreshMouseLast() {
  this.last.rmx = CFG.MAX_SAFE_INTEGER;
  this.last.rmy = CFG.MAX_SAFE_INTEGER;
};

export function updateMouseLast(x, y) {
  this.last.rmx = x;
  this.last.rmy = y;
};

export function isMouseMoveRedundant() {
  let rel = this.getRelativeMapTile(this.mx, this.my);
  return (
    (rel.x === this.last.rmx) &&
    (rel.y === this.last.rmy)
  );
};

export function mouseClick(e) {
  this.refreshMouseLast();
  if (e.target !== this.map) return;
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY - CFG.ENGINE_UI_OFFSET_Y;
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  // left
  if (e.which === 1) {
    // mouse already pressed, FIXUP!
    if (this.isLeftMousePressed()) this.mouseUp(e);
    this.drag.ldown = true;
    // map add
    if (this.isUIInMapCreationMode()) {
      let add = this.selection.newMap;
      add.sx = rel.x;
      add.sy = rel.y;
    }
    // map resize
    else if (this.isUIInMapResizeMode()) {
      let map = this.resizing.map;
      let move = this.selection.mapMove;
      let resize = this.selection.mapResize;
      resize.dir = "";
      resize.sx = move.sx = Number.MAX_SAFE_INTEGER;
      resize.sy = move.sy = Number.MAX_SAFE_INTEGER;
      if (coordsInMapBoundings(map, rel.x, rel.y)) {
        resize.sx = rel.x - map.x;
        resize.sy = rel.y - map.y;
        resize.sw = map.x + map.width;
        resize.sh = map.y + map.height;
        resize.dir = getResizeDirection(rel.x, rel.y, map);
        resize.updateCursor = true;
        if (!resize.dir.length) {
          move.sx = Number.MAX_SAFE_INTEGER;
          move.sy = Number.MAX_SAFE_INTEGER;
        }
      }
    }
    else {
      // start map selection
      if (this.isUIInSelectMode()) {
        let selection = this.selection.map;
        selection.sx = rel.x - map.x;
        selection.sy = rel.y - map.y;
      }
      else if (map && !map.isRecordingMutations()) map.createMutatorSession();
    }
  }
  // middle
  else if (e.which === 2) {
    if (!this.isUIInAnyActiveMode()) this.showUIContextMenu();
  }
  // right
  else if (e.which === 3) {
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    this.drag.rdown = true;
    this.selection.entity = null;
  }
  if (!this.isUIInMapCreationMode()) this.mouseMove(e);
  this.map.focus();
};

export function mouseUp(e) {
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY - CFG.ENGINE_UI_OFFSET_Y;
  let map = this.currentMap;
  this.refreshMouseLast();
  // left
  if (e.which === 1) {
    this.drag.ldown = false;
    if (this.isUIInMapCreationMode()) {
      let rel = this.getRelativeMapTile(x, y);
      let add = this.selection.newMap;
      add.ax = rel.x - this.creation.map.x;
      add.ay = rel.y - this.creation.map.y;
      // mouseup fired after resizing the map, abort
      // allow adding the map on the next mouseup
      if (this.selection.newMap.justResized) {
        this.selection.newMap.justResized = false;
        return;
      }
      this.onUIPlaceNewMap(this.creation.map);
    }
    this.endCommitSession();
    this.autoTiling = null;
  }
  // middle
  else if (e.which === 2) {
    this.closeUIContextMenu(e);
  }
  // right
  else if (e.which === 3) {
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    this.drag.rdown = false;
    this.selection.entity = null;
  }
};

export function mouseMove(e) {
  if (e.target === this.map) e.preventDefault();
  let x = e.clientX;
  let y = e.clientY - CFG.ENGINE_UI_OFFSET_Y;
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  if (e.target !== this.map) return;
  this.mx = x;
  this.my = y;
  // left mouse move
  if (this.isLeftMousePressed() && !this.isMouseMoveRedundant()) {
    if (!this.isUIInMapCreationMode()) {
      if (map && !map.isRecordingMutations()) map.createMutatorSession();
      this.processUIMouseInput(e);
    }
  }
  // right mouse move
  if (this.isRightMousePressed()) {
    this.cx -= (this.drag.px - x) | 0;
    this.cy -= (this.drag.py - y) | 0;
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    Storage.write(`settings.cameraOffsetX`, this.cx);
    Storage.write(`settings.cameraOffsetY`, this.cy);
    // redraw instantly for smoother dragging
    this.draw();
  }
  if (!this.isMouseMoveRedundant()) this.setUIMousePosition(x, y);
  this.updateMouseLast(rel.x, rel.y);
};

export function lookAtEntity(entity) {

};

export function lookAtPosition(x, y) {

};
