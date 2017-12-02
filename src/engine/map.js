import * as CFG from "../cfg";

import {
  $,
  GET,
  rectIntersect,
  getRelativeTile
} from "../utils";

import Map from "./map/index";

export function loadMap(id) {
  return null;
};

export function loadMapFromROM(bank, map) {
  return this.rom.fetchMap(bank, map);
};

export function loadMapFromServer(name) {
  return new Promise(resolve => {
    GET(`../data/maps/${name}.json`).then(res => {
      let json = JSON.parse(res);
      let bundles = json.data;
      this.resolveBundleList(bundles).then(() => {
        let map = new Map(this).fromJSON(json);
        resolve(map);
      });
    });
  });
};

export function addMap(map) {
  this.maps.push(map);
};

export function removeMap(map) {
  let maps = this.maps;
  let length = maps.length;
  for (let ii = 0; ii < length; ++ii) {
    let cmap = maps[ii];
    if (cmap === map) {
      this.maps.splice(ii, 1);
      break;
    }
  };
};

export function getRelativeMapTile(x, y) {
  let rel = getRelativeTile(x - this.cx, y - this.cy, this.cz);
  return {
    x: rel.x / CFG.BLOCK_SIZE,
    y: rel.y / CFG.BLOCK_SIZE
  };
};

export function isFreeMapSpaceAt(x, y, w, h) {
  let maps = this.maps;
  let length = maps.length;
  for (let ii = 0; ii < length; ++ii) {
    let map = maps[ii];
    let intersect = rectIntersect(
      map.x, map.y, map.width, map.height,
      x, y, w, h
    );
    if (intersect !== null) return false;
  };
  return true;
};
