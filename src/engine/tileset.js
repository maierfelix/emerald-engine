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

export function waitForBundle(bundle, resolve) {
  if (bundle.loaded) resolve(bundle);
  else setTimeout(() => this.waitForBundle(bundle, resolve), 100);
};

export function loadTilesetBundleFromServer(name) {
  return new Promise(resolve => {
    // bundle already cached
    if (this.bundles[name]) {
      if (!this.bundles[name].loaded) {
        return this.waitForBundle(this.bundles[name], resolve);
      } else {
        return resolve(this.bundles[name]);
      }
    }
    let query = CFG.ENGINE_TS_SERVER_LOC + `/?cmd=GET_BUNDLE&bundle=${name}`;
    // reserve bundle
    this.bundles[name] = { loaded: false };
    GET(addSessionToQuery(query, this.session)).then(res => {
      let tilesets = JSON.parse(res);
      let count = 0;
      let max = Object.keys(tilesets).length;
      let bundle = {
        name: name,
        loaded: false,
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
          // create an usage map, so we can detect empty tiles fast
          let usage = getPixelUsageData(canvas, CFG.BLOCK_SIZE);
          bundle.tilesets[ts] = { canvas, usage };
          bundle.tilesets[ts] = {
            name: ts,
            bundle,
            usage,
            canvas
          };
          if (++count >= max) {
            bundle.loaded = true;
            resolve(bundle);
          }
        });
      };
    });
  });
};

export function resetTilesetSelection() {
  this.preview.tileset = null;
  this.selection.tileset = { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 };
  this.tmx = this.tmy = 0;
};

export function useTilesetBundle(bundle) {
  this.currentBundle = bundle;
  this.setUITilesetBundle(bundle);
};

export function getTilesetFromBundle(bundleId, tsId) {
  return this.bundles[bundleId].tilesets[tsId];
};

export function useTilesetFromBundle(bundle, tsId) {
  // get the tileset index by it's name
  let el = $(`#engine-ui-cts-subts`);
  let index = 0;
  for (let ii = 0; ii < el.childNodes.length; ++ii) {
    let child = el.childNodes[ii];
    if (child.innerHTML === tsId) {
      index = ii;
      break;
    }
  };
  // change the selected tileset in ui
  el.selectedIndex = index;
  let tileset = this.getTilesetFromBundle(bundle.name, tsId);
  this.useTileset(tileset);
  this.resetTilesetSelection();
};

export function useTilesetFromBundleByIndex(bundle, index) {
  let el = $(`#engine-ui-cts-subts`).children[index];
  this.useTilesetFromBundle(bundle, el.innerHTML);
};

export function redrawTileset() {
  this.redraw.tileset = true;
};

export function useTileset(tileset) {
  this.currentTileset = tileset;
  this.useTilesetCanvas(tileset.canvas);
  this.redrawTileset();
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
  let tileset = this.currentTileset;
  buffer.ctx.drawImage(
    tileset.canvas,
    xx, yy,
    ww, hh,
    0, 0,
    ww, hh
  );
  return buffer.canvas;
};

export function bufferTilesetAutotileSelection(map, sel) {
  let buffer = createCanvasBuffer(CFG.BLOCK_SIZE, CFG.BLOCK_SIZE).ctx;
  buffer.fillRect(
    0, 0,
    CFG.BLOCK_SIZE, CFG.BLOCK_SIZE
  );
  return buffer.canvas;
};

export function resolveBundleList(list) {
  let count = 0;
  let max = Object.keys(list).length;
  return new Promise(resolve => {
    if (max <= 0) return resolve();
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

export function isSelectionInAutotileFormat(sel) {
  let selW = (((sel.w - sel.x) / CFG.BLOCK_SIZE) + 1);
  let selH = (((sel.h - sel.y) / CFG.BLOCK_SIZE) + 1);
  return (
    (selW === CFG.ENGINE_AUTOTILE_WIDTH) &&
    (selH === CFG.ENGINE_AUTOTILE_HEIGHT)
  );
};
