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
  let ww = ((selection.w - selection.x) / CFG.BLOCK_SIZE) + 1;
  let hh = ((selection.h - selection.y) / CFG.BLOCK_SIZE) + 1;
  let sx = (selection.x / CFG.BLOCK_SIZE);
  let sy = (selection.y / CFG.BLOCK_SIZE);
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

export function drawTileAt(tileset, sx, sy, dx, dy, layer) {
  let ctx = this.textures[layer - 1];
  let scale = CFG.BLOCK_SIZE;
  // in bounds check
  if (dx < 0 || dx >= this.width) return;
  if (dy < 0 || dy >= this.height) return;
  this.setTileAt(tileset, sx, sy, dx, dy, layer);
  ctx.clearRect(
    dx * scale, dy * scale,
    scale, scale
  );
  ctx.drawImage(
    tileset.canvas,
    sx * scale, sy * scale,
    scale, scale,
    dx * scale, dy * scale,
    scale, scale
  );
};

export function setTileAt(tileset, sx, sy, dx, dy, layer) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  let width = this.width | 0;
  let height = this.height | 0;
  // tileset bundle or data doesn't exist yet
  if (this.dataLayerMissing(tileset)) this.createDataLayer(tileset, width, height);
  let data = this.data[bundleId][tsId];
  let sIndex = (sy * (CFG.TILESET_DEFAULT_WIDTH / CFG.BLOCK_SIZE) + sx) | 0;
  let dIndex = (dy * width + dx) | 0;
  // delete previous data tiles and
  // data tiles in other tilesets
  this.deleteTileAt(dx, dy, layer);
  // increment tile index by 1
  // so we can detect empty tiles (whose value is zero)
  if (tileset.usage[sIndex]) data[layer][dIndex] = sIndex + 1;
};

export function deleteTileAt(dx, dy, layer) {
  let bundles = this.data;
  let tileIndex = (dy * this.width + dx) | 0;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      //console.log(`Deleting in ${bundleId}:${tsId} at ${dx}:${dy}`);
      bundle[tsId][layer][tileIndex] = 0;
    };
  };
};
