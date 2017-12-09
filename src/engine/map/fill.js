import * as CFG from "../../cfg";

import {
  assert,
  getTilesetTileIndexBy,
  getTilesetTilePositionByIndex
} from "../../utils";

export function magicFillAt(x, y, tileset, layer, sx, sy) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  // in bounds check
  if (!this.coordsInBounds(x, y)) return this.clearPreviewTable();
  let texture = this.textures[layer - 1];
  let srcTile = getTilesetTileIndexBy(sx, sy);
  let dstTile = this.getTileAt(x, y, layer);
  let table = this.createFloodFillTable(dstTile, layer);
  for (let ii = 0; ii < table.length; ++ii) {
    let xx = (ii % this.width) | 0;
    let yy = (ii / this.width) | 0;
    if (table[ii] !== 1) continue;
    table[ii] = 2;
  };
  if (this.drawPreview) {
    this.drawPreviewTable(table);
  } else {
    this.drawTable(table, srcTile, tileset, layer);
  }
};

export function bucketFillAt(x, y, tileset, layer, sx, sy) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  if (!this.coordsInBounds(x, y)) return this.clearPreviewTable();
  let texture = this.textures[layer - 1];
  let srcTile = getTilesetTileIndexBy(sx, sy);
  let dstTile = this.getTileAt(x, y, layer);
  let table = this.createFloodFillTable(dstTile, layer);
  this.floodFillAt(
    table,
    tileset,
    srcTile,
    x, y,
    layer
  );
  if (this.drawPreview) {
    this.drawPreviewTable(table);
  } else {
    this.drawTable(table, srcTile, tileset, layer);
  }
};

export function drawTable(table, tile, tileset, layer) {
  let width = this.width | 0;
  let height = this.height | 0;
  let size = (width * height) | 0;
  let tilePos = getTilesetTilePositionByIndex(tile);
  let tx = tilePos.x | 0;
  let ty = tilePos.y | 0;
  let scale = CFG.BLOCK_SIZE;
  let texture = this.textures[layer - 1];
  let textureGL = this.texturesGL[layer - 1];
  // first draw into a buffer
  for (let ii = 0; ii < size; ++ii) {
    let x = (ii % width) | 0;
    let y = (ii / width) | 0;
    if (table[ii] !== 2) continue;
    this.setTileAt(tileset, tx, ty, x, y, layer);
    this.drawTileIntoTextureAt(tileset, tx, ty, x, y, layer);
  };
  // finally update the gpu texture with the buffer
  this.instance.gl.updateGLTextureByCanvas(
    textureGL,
    texture.canvas,
    0, 0
  );
};

export function drawPreviewTable(table) {
  let preview = this.textures.preview;
  this.clearPreviewTable();
  preview.fillStyle = `black`;
  let width = this.width;
  let height = this.height;
  let size = width * height;
  let scale = CFG.BLOCK_SIZE;
  for (let ii = 0; ii < size; ++ii) {
    let xx = (ii % width) | 0;
    let yy = (ii / width) | 0;
    if (table[ii] !== 2) continue;
    preview.fillRect(
      xx, yy,
      1, 1
    );
  };
};

export function clearPreviewTable() {
  let preview = this.textures.preview;
  preview.clearRect(
    0, 0,
    this.width, this.height
  );
};

export function createFloodFillTable(dstTile, srcLayer) {
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

export function floodFillAt(table, tileset, tile, x, y, layer) {
  let width = this.width | 0;
  let stack = [y * width + x];
  while (stack.length > 0) {
    let index = stack.pop();
    let xx = (index % width) | 0;
    let yy = (index / width) | 0;
    let m = this.fillTileAt(table, tileset, tile, xx, yy, layer);
    let n = this.fillTileAt(table, tileset, tile, xx, (yy - 1), layer);
    let s = this.fillTileAt(table, tileset, tile, xx, (yy + 1), layer);
    let w = this.fillTileAt(table, tileset, tile, (xx - 1), yy, layer);
    let e = this.fillTileAt(table, tileset, tile, (xx + 1), yy, layer);
    if (m === 2) stack.push((yy * width + xx) | 0);
    if (n === 2) stack.push(((yy - 1) * width + xx) | 0);
    if (s === 2) stack.push(((yy + 1) * width + xx) | 0);
    if (w === 2) stack.push((yy * width + (xx - 1)) | 0);
    if (e === 2) stack.push((yy * width + (xx + 1)) | 0);
  };
};

export function fillTileAt(table, tileset, tile, x, y, layer) {
  if (!this.coordsInBounds(x, y)) return 0;
  let index = (y * this.width + x);
  if (table[index] === 1) return (table[index] = 2);
  return 0;
};
