import {
  zoomScale
} from "../utils";

export function zoom(e) {
  let x = e.clientX;
  let y = e.clientY;
  let deltaY = e.deltaY > 0 ? -1 : 1;
  let oscale = this.cz;
  let scale = (zoomScale(this.cz + deltaY) * deltaY) / 12;
  if (this.cz + scale <= 1.15) this.cz = 1.15;
  if (this.cz + scale >= 10.95) this.cz = 10.95;
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
  if (this.drag.down) {
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
  if (e.which === 2) e.preventDefault();
  if (e.which !== 3) return;
  if (e.target !== this.map) return;
  let x = e.clientX;
  let y = e.clientY;
  this.drag.down = true;
  this.drag.px = x | 0;
  this.drag.py = y | 0;
};

export function mouseUp(e) {
  e.preventDefault();
  let x = e.clientX;
  let y = e.clientY;
  this.drag.down = false;
  this.drag.px = x | 0;
  this.drag.py = y | 0;
};

export function lookAtEntity(entity) {

};

export function lookAtPosition(x, y) {

};
