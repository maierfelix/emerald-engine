import * as CFG from "../cfg";

import {
  zoomScale,
  getRelativeTile,
  getResizeDirection,
  coordsInMapBoundings,
  getNormalizedSelection,
  getRectangleFromSelection
} from "../utils";

export function zoom(e) {
  let x = e.clientX;
  let y = e.clientY;
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
  this.refreshMouseLast();
  this.setUIMousePosition(x, y);
};

export function mouseWheel(e) {
  if (e.target === this.map) {
    e.preventDefault();
    this.zoom(e);
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

export function mouseClick(e) {
  this.refreshMouseLast();
  if (e.target !== this.map) return;
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  // left
  if (e.which === 1) {
    this.drag.ldown = true;
    // map add
    if (this.isUIInMapCreationMode()) {
      let rel = this.getRelativeMapTile(x, y);
      let add = this.selection.newMap;
      add.sx = rel.x;
      add.sy = rel.y;
    }
    // map resize
    else if (this.isUIInMapResizeMode()) {
      let rel = this.getRelativeMapTile(x, y);
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
  }
  // right
  if (e.which === 3) {
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
  let y = e.clientY;
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
  }
  // right
  if (e.which === 3) {
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    this.drag.rdown = false;
    this.selection.entity = null;
  }
};

export function mouseMove(e) {
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  if (e.target !== this.map) return;
  // left mouse move
  if (this.drag.ldown) {
    if (!this.isUIInMapCreationMode()) this.processUIMouseInput(e);
  }
  // right mouse move
  if (this.drag.rdown) {
    this.cx -= (this.drag.px - x) | 0;
    this.cy -= (this.drag.py - y) | 0;
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    // redraw instantly
    this.draw();
  }
  this.mx = x;
  this.my = y;
  let rel = this.getRelativeMapTile(x, y);
  if (this.last.rmx !== rel.x || this.last.rmy !== rel.y) {
    this.setUIMousePosition(x, y);
  }
  this.last.rmx = rel.x;
  this.last.rmy = rel.y;
};

export function lookAtEntity(entity) {

};

export function lookAtPosition(x, y) {

};
