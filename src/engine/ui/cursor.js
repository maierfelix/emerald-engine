import * as CFG from "../../cfg";

import {
  $,
  assert,
  getResizeDirection,
  coordsInMapBoundings
} from "../../utils";

export function setUIMapCursor(cursor) {
  this.map.style.cursor = cursor;
};

export function setUIMapPlacableCursor(map) {
  let mrX = map.margin.x;
  let mrY = map.margin.y;
  let mrW = map.margin.w - mrX;
  let mrH = map.margin.h - mrY;
  let isPlaceable = this.isFreeMapSpaceAt(
    map.x + mrX, map.y + mrY,
    map.width + mrW, map.height + mrH
  );
  if (isPlaceable) this.setUIMapCursor("pointer");
  else this.setUIMapCursor("not-allowed");
  this.setUIMapStatsMapValidity(map, isPlaceable);
};

export function setUIMapResizeCursor(map) {
  let rel = this.getRelativeMapTile(this.mx, this.my);
  if (coordsInMapBoundings(map, rel.x, rel.y)) {
    let dir = getResizeDirection(rel.x, rel.y, map);
    let cursor = dir ? `${dir}-resize` : "move";
    this.setUIMapCursor(cursor);
  } else {
    this.setUIMapCursor("default");
  }
};

export function setUIObjectCursor(object) {
  let isActiveObject = (object === this.currentObject);
  if (!object) return this.setUIMapCursor("default");
  let map = object.map;
  let valid = this.isObjectPlaceable(object);
  if (valid) {
    if (this.isLeftMousePressed()) {
      if (isActiveObject) this.setUIMapCursor("move");
      else this.setUIMapCursor("default");
    }
    else this.setUIMapCursor("pointer");
  }
  else this.setUIMapCursor("not-allowed");
};

export function setUIObjectPlacableCursor(object) {
  let map = object.map;
  let valid = this.isObjectPlaceable(object);
  if (valid) this.setUIMapCursor("pointer");
  else this.setUIMapCursor("not-allowed");
};
