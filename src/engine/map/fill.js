import * as CFG from "../../cfg";

import {
  assert,
  getTilesetTileIndexBy
} from "../../utils";

export function magicFillAt(x, y, layer, sx, sy) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  let texture = this.textures[layer - 1];
  let tileset = this.instance.currentTileset;
  let srcTile = getTilesetTileIndexBy(sx, sy);
  let dstTile = this.getTileAt(x, y, layer);
  let table = this.createFloodFillTable(srcTile, dstTile, layer);
  for (let ii = 0; ii < table.length; ++ii) {
    if (table[ii] === 0) continue;
    let xx = (ii % this.width) | 0;
    let yy = (ii / this.width) | 0;
    this.drawTileByTileIndexAt(
      tileset,
      srcTile,
      xx, yy,
      layer
    );
  };
};

export function bucketFillAt(x, y, layer, sx, sy) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  let texture = this.textures[layer - 1];
  let tileset = this.instance.currentTileset;
  let srcTile = getTilesetTileIndexBy(sx, sy);
  let dstTile = this.getTileAt(x, y, layer);
  let table = this.createFloodFillTable(srcTile, dstTile, layer);
  this.floodFillTileAt(
    table,
    tileset,
    srcTile,
    x, y,
    layer
  );
};

export function createFloodFillTable(srcTile, dstTile, srcLayer) {
  let width = this.width;
  let height = this.height;
  let size = width * height;
  let table = new Uint8Array(size);
  for (let ii = 0; ii < size; ++ii) {
    let x = (ii % width) | 0;
    let y = (ii / width) | 0;
    let mapTile = this.getTileAt(x, y, srcLayer);
    if (mapTile === dstTile) table[ii] = 1;
  };
  return table;
};

export function floodFillTileAt(table, tileset, tile, x, y, layer) {
  this.fillTileAt(table, tileset, tile, x, y, layer);
  this.fillTileAt(table, tileset, tile, x, (y - 1), layer);
  this.fillTileAt(table, tileset, tile, x, (y + 1), layer);
  this.fillTileAt(table, tileset, tile, (x - 1), y, layer);
  this.fillTileAt(table, tileset, tile, (x + 1), y, layer);
};

export function fillTileAt(table, tileset, tile, x, y, layer) {
  if (
    (x < 0 || x >= this.width) ||
    (y < 0 || y >= this.height)
  ) return;
  let index = (y * this.width + x);
  if (table[index] !== 0) {
    table[index] = 0;
    this.drawTileByTileIndexAt(
      tileset,
      tile,
      x, y,
      layer
    );
    this.floodFillTileAt(table, tileset, tile, x, y, layer);
  }
};
