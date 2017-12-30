import * as CFG from "../../cfg";

import {
  uid,
  assert
} from "../../utils";

export function coordsInBounds(x, y) {
  return (
    (x >= 0 && x < this.width) &&
    (y >= 0 && y < this.height)
  );
};

export function isInView() {
  let instance = this.instance;
  let xx = instance.cx + ((this.x * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let yy = instance.cy + ((this.y * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let ww = ((this.width * CFG.BLOCK_SIZE) * instance.cz) | 0;
  let hh = ((this.height * CFG.BLOCK_SIZE) * instance.cz) | 0;
  return (
    (xx + ww >= 0 && xx <= instance.width) &&
    (yy + hh >= 0 && yy <= instance.height)
  );
};

export function setBoundings(width, height) {
  this.width = width;
  this.height = height;
  this.initTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  this.resizeTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  return this;
};

export function getBoundings() {
  return {
    x: this.x,
    y: this.y,
    w: this.width,
    h: this.height
  };
};

export function getMarginBoundings() {
  let bounds = this.getBoundings();
  let margin = this.margin;
  return {
    x: bounds.x + margin.x,
    y: bounds.y + margin.y,
    w: bounds.w + margin.w - margin.x,
    h: bounds.h + margin.h - margin.y
  };
};

export function isMarginBoundingsValid() {
  let bounds = this.getMarginBoundings();
  return (
    bounds.w >= CFG.ENGINE_MAP_MIN_WIDTH &&
    bounds.h >= CFG.ENGINE_MAP_MIN_HEIGHT
  );
};

export function resetMargins() {
  let margin = this.margin;
  margin.x = margin.y = 0;
  margin.w = margin.h = 0;
};
