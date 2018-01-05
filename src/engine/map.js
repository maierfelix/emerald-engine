import * as CFG from "../cfg";

import {
  $,
  GET,
  rectIntersect,
  getRelativeTile,
  addSessionToQuery,
  createCanvasBuffer
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

export function loadMapList(maps, index = 0) {
  return new Promise(resolve => {
    let json = maps[index];
    new Map(this).fromJSON(json).then((map) => {
      this.addMap(map);
      if (++index < maps.length) this.loadMapList(maps, index).then(resolve);
      else resolve();
    });
  });
};

export function loadWorldFromServer(name) {
  return new Promise(resolve => {
    let query = CFG.ENGINE_TS_SERVER_LOC + "/?cmd=GET_WORLD&world=" + name;
    GET(addSessionToQuery(query, this.session)).then(json => {
      let world = JSON.parse(json);
      world.name = name;
      this.setWorld(world).then(resolve);
    });
  });
};

export function setWorld(world) {
  return new Promise(resolve => {
    this.currentWorld = world;
    if (!world.maps.length) resolve();
    else this.loadMapList(world.maps).then(resolve);
  });
};

export function addMap(map) {
  this.maps.push(map);
  this.refreshUIMaps();
};

export function removeMap(map, destroy = true) {
  for (let ii = 0; ii < this.maps.length; ++ii) {
    if (this.maps[ii] === map) {
      if (destroy) this.maps[ii].destroy();
      this.maps.splice(ii, 1);
      break;
    }
  };
  this.currentMap = null;
  this.refreshUIMaps();
  if (this.maps.length) this.setUIActiveMap(this.maps[this.maps.length - 1]);
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

export function getRelativeMapTile(x, y) {
  let rel = getRelativeTile(x - this.cx, y - this.cy, this.cz);
  return {
    x: rel.x / CFG.BLOCK_SIZE,
    y: rel.y / CFG.BLOCK_SIZE
  };
};

export function isValidMapSize(w, h) {
  return (
    w >= CFG.ENGINE_MAP_MIN_WIDTH &&
    h >= CFG.ENGINE_MAP_MIN_HEIGHT &&
    w <= CFG.ENGINE_MAP_MAX_WIDTH &&
    h <= CFG.ENGINE_MAP_MAX_HEIGHT
  );
};

export function isFreeMapSpaceAt(x, y, w, h, ignoreMap = null) {
  let maps = this.maps;
  let length = maps.length;
  // validate min/max map dimension
  if (!this.isValidMapSize(w, h)) return false;
  for (let ii = 0; ii < length; ++ii) {
    let map = maps[ii];
    // ignore the submitted map
    if (ignoreMap !== null && map === ignoreMap) continue;
    let mrX = map.margin.x;
    let mrY = map.margin.y;
    let mrW = map.margin.w - mrX;
    let mrH = map.margin.h - mrY;
    // get the intersected area
    let intersect = rectIntersect(
      map.x + mrX, map.y + mrY,
      map.width + mrW, map.height + mrH,
      x, y,
      w, h
    );
    if (intersect !== null) return false;
  };
  return true;
};

export function getMapByPosition(x, y) {
  let maps = this.maps;
  let length = maps.length;
  for (let ii = 0; ii < length; ++ii) {
    let map = maps[ii];
    if (
      (x >= map.x && x < map.x + map.width) &&
      (y >= map.y && y < map.y + map.height)
    ) return map;
  };
  return null;
};

export function resetMapPreviewAnchor() {
  this.selection.newMap.ax = 0;
  this.selection.newMap.ay = 0;
};

export function getMapObjectByPosition(x, y) {
  let maps = this.maps;
  for (let ii = 0; ii < maps.length; ++ii) {
    let map = maps[ii];
    let objects = map.objects;
    for (let jj = 0; jj < objects.length; ++jj) {
      let object = objects[jj];
      if (
        (object.x) === (x - map.x) &&
        (object.y) === (y - map.y)
      ) return object;
    };
  };
  return null;
};

export function resetMapSelection() {
  this.preview.map = null;
  this.selection.map = { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 };
};

export function setMapSelection(x, y, w, h) {
  let selection = this.selection.map;
  selection.x = x;
  selection.y = y;
  selection.w = w;
  selection.h = h;
  if (this.isUIInSelectMode()) this.updateMapSelectionPreview();
};

export function updateMapSelectionPreview() {
  let sel = this.selection.map;
  let map = this.currentMap;
  let layer = this.currentLayer;
  let buffer = this.bufferMapSelection(map, sel, layer);
  this.selectedTiles = buffer.tiles;
  this.preview.map = buffer.preview;
};

export function bufferMapSelection(map, sel, layer) {
  let xx = sel.x - map.x;
  let yy = sel.y - map.y;
  let ww = ((sel.w - map.x) - xx + 1);
  let hh = ((sel.h - map.y) - yy + 1);
  let scale = CFG.BLOCK_SIZE;
  let buffer = createCanvasBuffer(ww * scale, hh * scale).ctx;
  let tiles = [];
  let layers = (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) ? CFG.ENGINE_TS_LAYERS.PREVIEW : 1;
  let currentBundleId = this.currentTileset.bundle.name;
  let currentTilesetId = this.currentTileset.name;
  for (let ll = 1; ll <= layers; ++ll) {
    let ly = (layers === CFG.ENGINE_TS_LAYERS.PREVIEW) ? ll : layer;
    if (ly === CFG.ENGINE_TS_LAYERS.PREVIEW) continue; // ignore layer 4
    for (let ii = 0; ii < ww * hh; ++ii) {
      let x = (ii % ww) | 0;
      let y = (ii / ww) | 0;
      let tile = map.getTileInformationAt(x + xx, y + yy, ly);
      // tile is empty, create a fake tile
      if (tile === null) {
        tile = {
          x: -1,
          y: -1,
          tile: -1,
          bundleId: currentBundleId,
          tilesetId: currentTilesetId
        };
      }
      let tileset = this.bundles[tile.bundleId].tilesets[tile.tilesetId].canvas;
      buffer.drawImage(
        tileset,
        tile.x * scale, tile.y * scale,
        scale, scale,
        x * scale, y * scale,
        scale, scale
      );
      tile.tx = x;
      tile.ty = y;
      tile.layer = ly;
      tiles.push(tile);
    };
  };
  return {
    tiles,
    preview: buffer.canvas
  }
};
