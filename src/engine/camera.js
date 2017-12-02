import * as CFG from "../cfg";

import {
  zoomScale,
  getRelativeTile
} from "../utils";

export function zoom(e) {
  let x = e.clientX;
  let y = e.clientY;
  let min = CFG.ENGINE_CAMERA_MIN_SCALE;
  let max = CFG.ENGINE_CAMERA_MAX_SCALE;
  let deltaY = e.deltaY > 0 ? -1 : 1;
  let oscale = this.cz;
  let scale = (zoomScale(this.cz + deltaY) * deltaY) / 12;
  if (this.cz + scale <= min) this.cz = min;
  if (this.cz + scale >= max) this.cz = max;
  this.cz += scale;
  let sx = (x - this.cx) / oscale;
  let sy = (y - this.cy) / oscale;
  let zd = zoomScale(this.cz) - zoomScale(oscale);
  this.cx -= sx * zd;
  this.cy -= sy * zd;
  this.setUIMousePosition(x, y);
};

export function mouseWheel(e) {
  if (e.target === this.map) {
    e.preventDefault();
    this.zoom(e);
  }
};

export function mouseContext(e) {
  e.preventDefault();
};

export function mouseMove(e) {
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  if (e.target !== this.map) return;
  // left mouse move
  if (this.drag.ldown) {
  // we're in map adding mode
    if (this.newMap !== null) return;
    this.processUIMouseInput(e);
  }
  // right mouse move
  if (this.drag.rdown) {
    this.cx -= (this.drag.px - x) | 0;
    this.cy -= (this.drag.py - y) | 0;
    this.drag.px = x | 0;
    this.drag.py = y | 0;
  }
  this.mx = x;
  this.my = y;
  this.setUIMousePosition(x, y);
};

export function mouseClick(e) {
  if (e.target !== this.map) return;
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  // left
  if (e.which === 1) {
    this.drag.ldown = true;
  }
  // right
  if (e.which === 3) {
    this.drag.px = x | 0;
    this.drag.py = y | 0;
    this.drag.rdown = true;
    this.selection.entity = null;
  }
  this.mouseMove(e);
  this.map.focus();
};

export function mouseUp(e) {
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  // left
  if (e.which === 1) {
    this.drag.ldown = false;
    if (this.newMap !== null) {
      let rel = this.getRelativeMapTile(x, y);
      this.onUIPlaceNewMapAt(this.newMap, rel.x, rel.y);
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

export function lookAtEntity(entity) {

};

export function lookAtPosition(x, y) {

};
