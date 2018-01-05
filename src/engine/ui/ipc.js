import * as CFG from "../../cfg";

import {
  $,
  assert,
  getTilesetTilePositionByIndex
} from "../../utils";

export function onUIMapFill(x, y, preview = false) {
  let map = this.currentMap;
  let rel = this.getRelativeMapTile(x, y);
  // normalized coordinates
  let nx = rel.x - map.x;
  let ny = rel.y - map.y;
  let sel = this.selection.tileset;
  let tileset = this.currentTileset;
  if (this.isUIInBucketFillMode()) {
    if (preview) map.drawPreview = true;
    map.bucketFillAt(
      nx, ny,
      tileset,
      this.currentLayer,
      sel.x / CFG.BLOCK_SIZE,
      sel.y / CFG.BLOCK_SIZE
    );
    map.drawPreview = false;
  }
  else if (this.isUIInMagicFillMode()) {
    if (preview) map.drawPreview = true;
    map.magicFillAt(
      nx, ny,
      tileset,
      this.currentLayer,
      sel.x / CFG.BLOCK_SIZE,
      sel.y / CFG.BLOCK_SIZE
    );
    map.drawPreview = false;
  }
};

export function onUICopyMapSelection() {
  this.updateMapSelectionPreview();
  this.tileCopy = this.selectedTiles;
};

export function onUIPasteMapSelection() {
  let map = this.currentMap;
  let tiles = this.tileCopy;
  if (!tiles) return;
  if (!map.isRecordingMutations()) map.createMutatorSession();
  let currentLayer = this.currentLayer;
  let sel = this.selection.map;
  let rel = this.getRelativeMapTile(this.mx, this.my);
  let width = (sel.w - sel.x) + 1;
  let height = (sel.h - sel.y) + 1;
  for (let ii = 0; ii < tiles.length; ++ii) {
    let tile = tiles[ii];
    let tileset = this.bundles[tile.bundleId].tilesets[tile.tilesetId];
    let srcTile = getTilesetTilePositionByIndex(tile.tile);
    let layer = currentLayer === CFG.ENGINE_TS_LAYERS.PREVIEW ? tile.layer : currentLayer;
    let sx = tile.x;
    let sy = tile.y;
    let tx = ((rel.x + tile.tx) - sel.ax) - map.x;
    let ty = ((rel.y + tile.ty) - sel.ay) - map.y;
    map.drawTileAt(
      tileset,
      sx, sy,
      tx, ty,
      layer
    );
  };
  this.endCommitSession();
};

export function onUICutMapSelection() {
  let map = this.currentMap;
  if (!map.isRecordingMutations()) map.createMutatorSession();
  this.onUICopyMapSelection();
  this.onUIClearMapSelection();
  this.endCommitSession();
};

export function onUIClearMapSelection() {
  let map = this.currentMap;
  let sel = this.selection.map;
  let layer = this.currentLayer;
  let tileset = this.currentTileset;
  let xx = sel.x - map.x;
  let yy = sel.y - map.y;
  let ww = ((sel.w - map.x) - xx + 1);
  let hh = ((sel.h - map.y) - yy + 1);
  let sx = -1;
  let sy = -1;
  let layers = (layer === CFG.ENGINE_TS_LAYERS.PREVIEW) ? CFG.ENGINE_TS_LAYERS.PREVIEW : 1;
  for (let ll = 1; ll <= layers; ++ll) {
    let ly = (layers === CFG.ENGINE_TS_LAYERS.PREVIEW) ? ll : layer;
    if (ly === CFG.ENGINE_TS_LAYERS.PREVIEW) continue; // ignore layer 4
    for (let ii = 0; ii < ww * hh; ++ii) {
      let x = (ii % ww) | 0;
      let y = (ii / ww) | 0;
      map.drawTileAt(
        tileset,
        sx, sy,
        x + xx, y + yy,
        ly
      );
    };
  };
};
