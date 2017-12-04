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
      let maps = JSON.parse(res);
      let count = 0;
      maps.map(json => {
        new Map(this).fromJSON(json).then((map) => {
          this.addMap(map);
          if (++count >= maps.length) resolve(map);
        });
      });
    });
  });
};

export function addMap(map) {
  this.maps.push(map);
  this.refreshUIMapChooseList(this.maps);
  this.setUIActiveMap(map);
};

export function mapsToJSON() {
  let json = `[`;
  this.maps.map((map, index) => {
    json += map.toJSON();
    if (index + 1 < this.maps.length) json += ",";
  });
  json += `]`;
  return json;
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
  // validate max map dimension
  if (
    w > CFG.ENGINE_MAP_MAX_WIDTH ||
    h > CFG.ENGINE_MAP_MAX_HEIGHT
  ) return false;
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

export function resetMapPreviewAnchor() {
  this.selection.newMap.ax = 0;
  this.selection.newMap.ay = 0;
};
