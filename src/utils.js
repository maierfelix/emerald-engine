import * as CFG from "./cfg";

export const IS_NODE = typeof window === "undefined";
export const IS_BROWSER = !IS_NODE;

export const IDBVersion = 1.0;
export const indexedDB = (
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.OIndexedDB ||
  window.msIndexedDb
);
export const IDBTransation = (
  window.IDBTransation ||
  window.webkitIDBTransaction ||
  window.OIDBTransation ||
  window.msIDBTransaction
);

export function $(name) {
  return document.querySelector(name);
};

export function assert(truth) {
  if (!truth) throw new Error("Assert exception!");
};

export function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
};

export function roundTo(a, b) {
  b = 1 / (b);
  return (Math.round(a * b) / b);
};

export function scaledCosine(i) {
  return 0.5 * (1.0 - Math.cos(i * Math.PI));
};

export function rnd64() {
  let max = Number.MAX_SAFE_INTEGER;
  return Math.floor((Math.random() * max) - (max / 2));
};

export function createCanvasBuffer(width, height) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext("2d");
  setImageSmoothing(ctx, false);
  return { ctx, canvas };
};

export function setImageSmoothing(ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
  ctx.mozImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
};

export function readBinaryFile(path) {
  return new Promise((resolve) => {
    if (IS_NODE) {
      let data = require("fs").readFileSync(path);
      return resolve(data);
    }
    fetch("../" + path)
    .then(resp => resp.arrayBuffer())
    .then(res => resolve(new Uint8Array(res)));
  });
};

export function readCachedFile(path) {
  return new Promise((resolve) => {
    let db = null;
    let req = indexedDB.open("ROMFile", IDBVersion);
    req.onsuccess = (e) => {
      db = req.result;
      let tra = db.transaction(["ROMData"], "readwrite");
      tra.objectStore("ROMData").get("key").onsuccess = (e) => {
        let result = e.target.result;
        if (!result) {
          console.log(`No cached ROM file`);
          readBinaryFile(path).then((buffer) => {
            let tra = db.transaction(["ROMData"], "readwrite");
            tra.objectStore("ROMData").put(buffer, "key");
            resolve(buffer);
          });
        } else {
          console.log(`Found a cached ROM file`);
          resolve(result);
        }
      };
    };
    req.onupgradeneeded = (e) => {
      db = req.result;
      db.createObjectStore("ROMData");
    };
  });
};

export function loadImage(path) {
  return new Promise(resolve => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.src = path;
  });
};

export function JSONTilesetToCanvas(rom, json) {
  let buffer = createCanvasBuffer(CFG.TILESET_DEFAULT_WIDTH, CFG.TILESET_DEFAULT_HEIGHT).ctx;
  let tilesets = json;
  let tileBuffer = createCanvasBuffer(CFG.BLOCK_SIZE, CFG.BLOCK_SIZE).ctx;
  for (let ts in tilesets) {
    let id = ts.split(":");
    let bank = id[0] | 0; let map = id[1] | 0;
    let tileset = rom.getMapTileset(bank, map);
    let layers = tilesets[ts];
    for (let ii = 0; ii < 3; ++ii) {
      let tiles = layers[ii];
      for (let jj = 0; jj < tiles.length; ++jj) {
        let tile = tiles[jj];
        let isBgLayerSource = tile.sx < (CFG.TILESET_DEFAULT_WIDTH / CFG.BLOCK_SIZE);
        let reduceX = (isBgLayerSource ? 0 : -CFG.TILESET_DEFAULT_WIDTH);
        let layer = tileset.layers[isBgLayerSource ? "background" : "foreground"].canvas;
        tileBuffer.clearRect(0, 0, CFG.BLOCK_SIZE, CFG.BLOCK_SIZE);
        if (tile.fx) tileBuffer.scale(-1, 1);
        if (tile.fy) tileBuffer.scale(1, -1);
        tileBuffer.drawImage(
          layer,
          (tile.sx * CFG.BLOCK_SIZE) + reduceX, (tile.sy * CFG.BLOCK_SIZE),
          CFG.BLOCK_SIZE, CFG.BLOCK_SIZE,
          0, 0,
          CFG.BLOCK_SIZE * (tile.fx ? -1 : 1), CFG.BLOCK_SIZE * (tile.fy ? -1 : 1)
        );
        if (tile.fx || tile.fy) tileBuffer.scale(1, 1);
        buffer.drawImage(
          tileBuffer.canvas,
          0, 0,
          CFG.BLOCK_SIZE, CFG.BLOCK_SIZE,
          tile.x * CFG.BLOCK_SIZE, tile.y * CFG.BLOCK_SIZE,
          CFG.BLOCK_SIZE, CFG.BLOCK_SIZE
        );
      };
    };
  };
  return buffer;
};
