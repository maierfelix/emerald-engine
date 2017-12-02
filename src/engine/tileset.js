import * as CFG from "../cfg";

import {
  $,
  GET,
  addSessionToQuery,
  getPixelUsageData,
  loadImageAsCanvas,
  setImageSmoothing,
  createCanvasBuffer,
  createCanvasFromBase64
} from "../utils";

export function loadTilesetFromROM(bank, map) {
  return this.rom.getMapTileset(bank, map);
};

export function loadTilesetBundleFromServer(name) {
  return new Promise(resolve => {
    let query = CFG.ENGINE_TS_SERVER_LOC + `/?cmd=GET_BUNDLE&bundle=${name}`;
    GET(addSessionToQuery(query, this.session)).then(res => {
      let tilesets = JSON.parse(res);
      let count = 0;
      let max = Object.keys(tilesets).length;
      let bundle = {
        name: name,
        tilesets: {}
      };
      this.bundles[name] = bundle;
      for (let ts in tilesets) {
        let b64 = tilesets[ts];
        // turn the base64 tileset into a canvas
        createCanvasFromBase64(b64).then(canvas => {
          if (canvas.width !== CFG.TILESET_DEFAULT_WIDTH) {
            canvas = this.fixTilesetDimensions(canvas);
          }
          let usage = getPixelUsageData(canvas, CFG.BLOCK_SIZE);
          bundle.tilesets[ts] = { canvas, usage };
          if (++count >= max) resolve(bundle);
        });
      };
    });
  });
};

export function resetTilesetSelection() {
  this.preview.tileset = null;
  this.selection.tileset = { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 };
};

export function useTilesetBundle(bundle) {
  this.currentBundle = bundle;
  this.setUITilesetBundle(bundle);
};

export function getTilesetFromBundle(bundle, name) {
  let tileset = bundle.tilesets[name];
  return {
    id: bundle.name + ":" + name,
    name: name,
    bundle: bundle,
    usage: tileset.usage,
    canvas: tileset.canvas
  };
};

export function useTilesetFromBundle(bundle, name) {
  let tileset = this.getTilesetFromBundle(bundle, name);
  this.useTileset(tileset);
  this.resetTilesetSelection();
};

export function useTileset(tileset) {
  this.currentTileset = tileset;
  this.useTilesetCanvas(tileset.canvas);
};

export function useTilesetCanvas(canvas) {
  let scale = CFG.ENGINE_TILESET_SCALE;
  // do some padding, so it looks nicer
  let width = CFG.TILESET_DEFAULT_WIDTH + 1;
  let height = canvas.height + CFG.BLOCK_SIZE;
  this.tileset.width = width * scale;
  this.tileset.height = height * scale;
  setImageSmoothing(this.tsCtx, false);
};

export function bufferTilesetSelection(sel) {
  let xx = sel.x;
  let yy = sel.y;
  let ww = (sel.w - xx + CFG.BLOCK_SIZE);
  let hh = (sel.h - yy + CFG.BLOCK_SIZE);
  let buffer = createCanvasBuffer(ww, hh);
  buffer.ctx.drawImage(
    this.currentTileset.canvas,
    xx, yy,
    ww, hh,
    0, 0,
    ww, hh
  );
  return buffer.canvas;
};

export function resolveBundleList(list) {
  return new Promise(resolve => {
    let count = 0;
    let max = Object.keys(list).length;
    for (let bundleId in list) {
      this.loadTilesetBundleFromServer(bundleId).then(() => {
        if (++count >= max) resolve();
      });
    };
  });
};

export function fixTilesetDimensions(canvas) {
  let buffer = createCanvasBuffer(CFG.TILESET_DEFAULT_WIDTH, canvas.height).ctx;
  buffer.drawImage(
    canvas,
    0, 0,
    canvas.width, canvas.height,
    0, 0,
    canvas.width, canvas.height
  );
  return buffer.canvas;
};
