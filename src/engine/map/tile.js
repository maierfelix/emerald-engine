import * as CFG from "../../cfg";

import {
  uid,
  assert
} from "../../utils";

export function drawTileSelectionAt(x, y, layer, selection) {
  // don't allow drawing into preview layer
  if (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) return;
  let texture = this.textures[layer - 1];
  let tileset = this.instance.currentTileset;
  let ww = (selection.w - selection.x) + 1;
  let hh = (selection.h - selection.y) + 1;
  let sx = selection.x;
  let sy = selection.y;
  for (let ii = 0; ii < ww * hh; ++ii) {
    let xx = (ii % ww) | 0;
    let yy = (ii / ww) | 0;
    this.drawTileAt(
      tileset,
      sx + xx, sy + yy,
      x + xx, y + yy,
      layer
    );
  };
};

export function drawTileByTileIndexAt(tileset, tile, x, y, layer) {
  let tx = ((tile - 1) % CFG.TILESET_HORIZONTAL_SIZE) | 0;
  let ty = ((tile - 1) / CFG.TILESET_HORIZONTAL_SIZE) | 0;
  this.drawTileAt(
    tileset,
    tx, ty,
    x, y,
    layer
  );
};

export function drawTileAt(tileset, sx, sy, tx, ty, layer) {
  let ctx = this.textures[layer - 1];
  let scale = CFG.BLOCK_SIZE;
  // in bounds check
  if (!this.coordsInBounds(tx, ty)) return;
  this.setTileAt(tileset, sx, sy, tx, ty, layer);
  // draw tile on given map texture
  ctx.clearRect(
    tx * scale, ty * scale,
    scale, scale
  );
  ctx.drawImage(
    tileset.canvas,
    sx * scale, sy * scale,
    scale, scale,
    tx * scale, ty * scale,
    scale, scale
  );
};

export function getTileAt(x, y, layer) {
  // in bounds check
  if (!this.coordsInBounds(x, y)) return 0;
  let bundles = this.data;
  let tileIndex = (y * this.width + x) | 0;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let tileset = bundle[tsId];
      let dataLayer = tileset[layer];
      let tile = dataLayer[tileIndex];
      if (tile > 0) return tile - 1;
    };
  };
  return 0;
};

export function setTileAt(tileset, sx, sy, tx, ty, layer) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  let width = this.width | 0;
  let height = this.height | 0;
  // tileset bundle or data doesn't exist yet
  if (this.dataLayerMissing(tileset)) this.createDataLayer(tileset, width, height);
  let data = this.data[bundleId][tsId];
  let sIndex = (sy * (CFG.TILESET_HORIZONTAL_SIZE) + sx) | 0;
  let dIndex = (ty * width + tx) | 0;
  // delete previous data tiles and
  // data tiles in other tilesets
  this.deleteTileAt(tx, ty, layer);
  // increment tile index by 1
  // so we can detect empty tiles (whose value is zero)
  if (tileset.usage[sIndex]) data[layer][dIndex] = sIndex + 1;
};

export function deleteTileAt(tx, ty, layer) {
  let bundles = this.data;
  let tileIndex = (ty * this.width + tx) | 0;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      //console.log(`Deleting in ${bundleId}:${tsId} at ${tx}:${ty}`);
      bundle[tsId][layer][tileIndex] = 0;
    };
  };
};
