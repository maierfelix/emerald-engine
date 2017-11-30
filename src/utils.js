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

let uidx = 0;
export function uid() {
  return ++uidx;
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

export function zoomScale(n) {
  return (
    n >= 0 ? n + 1 :
    n < 0 ? -(n) + 1 :
    n + 1
  );
};

export function rnd64() {
  let max = Number.MAX_SAFE_INTEGER;
  return Math.floor((Math.random() * max) - (max / 2));
};

export function getRelativeTile(x, y, scale) {
  let dim = CFG.BLOCK_SIZE * scale;
  let xx = (Math.ceil(x / dim) * CFG.BLOCK_SIZE) - CFG.BLOCK_SIZE;
  let yy = (Math.ceil(y / dim) * CFG.BLOCK_SIZE) - CFG.BLOCK_SIZE;
  return { x: xx, y: yy };
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

export function loadImage(path) {
  return new Promise(resolve => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.src = path;
  });
};

export function loadImageAsCanvas(path) {
  return new Promise(resolve => {
    loadImage(path).then(img => {
      let buffer = createCanvasBuffer(img.width, img.height).ctx;
      buffer.drawImage(
        img,
        0, 0,
        img.width, img.height,
        0, 0,
        img.width, img.height
      );
      resolve(buffer.canvas);
    });
  });
};

export function createCanvasFromBase64(data) {
  return new Promise(resolve => {
    let img = new Image();
    img.onload = (e) => {
      let buffer = createCanvasBuffer(img.width, img.height).ctx;
      buffer.drawImage(img,
        0, 0,
        img.width, img.height,
        0, 0,
        img.width, img.height
      );
      resolve(buffer.canvas);
    };
    img.src = data;
  });
};

export function loadJSONFile(path) {
  return new Promise(resolve => {
    fetch(path).then(resp => resp.json()).then(resolve);
  });
};

export function GET(url, delay = 0) {
  return new Promise(resolve => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = (e) => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) resolve(xhr.responseText);
      }
    };
    if (delay > 0) {
      setTimeout(() => {
        xhr.send(null);
      }, delay);
    } else {
      xhr.send(null);
    }
  });
};

export function drawGrid(ctx, scale, x, y, width, height) {
  let ww = width * scale;
  let hh = height * scale;

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = `rgba(0,0,0,0.4)`;

  let size = CFG.BLOCK_SIZE * scale;
  ctx.beginPath();
  for (let xx = x % size; xx < ww; xx += size) {
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, hh);
  };
  for (let yy = y % size; yy < hh; yy += size) {
    ctx.moveTo(0, yy);
    ctx.lineTo(ww, yy);
  };
  ctx.stroke();
  ctx.closePath();
};

export function getPixelUsageData(canvas, scale) {
  let ctx = canvas.getContext("2d");
  let width = canvas.width / scale;
  let height = canvas.height / scale;
  let size = (width * height);
  let data = new Uint8Array(size);
  for (let ii = 0; ii < size; ++ii) {
    let xx = (ii % width) | 0;
    let yy = (ii / width) | 0;
    let tile = ctx.getImageData(
      xx * scale, yy * scale,
      scale, scale
    );
    data[ii] = !isEmptyImageData(tile) | 0;
  };
  return data;
};

export function typedArrayToArray(typed) {
  let length = typed.length | 0;
  let array = new Array(length);
  for (let ii = 0; ii < length; ++ii) {
    array[ii] = typed[ii] | 0;
  };
  return array;
};

export function isEmptyImageData(imgData) {
  let data = imgData.data;
  let length = data.length | 0;
  let count = 0;
  for (let ii = 0; ii < length; ++ii) {
    let index = ii * 4;
    if (data[index + 3] > 0) ++count;
  };
  return count <= 0;
};

export function getNormalizedSelection(dx, dy, sx, sy) {
  let x1 = sx;
  let y1 = sy;
  let x2 = (dx - sx);
  let y2 = (dy - sy);
  if (x2 < 0) {
    x1 = x1 + x2;
    x2 = x1 - x2;
  } else {
    x2 = x1 + x2;
  }
  if (y2 < 0) {
    y1 = y1 + y2;
    y2 = y1 - y2;
  } else {
    y2 = y1 + y2;
  }
  return { x: x1, y: y1, w: x2, h: y2 };
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
  return new Promise((resolve, reject) => {
    let db = null;
    let req = indexedDB.open("ROMFile", IDBVersion);
    req.onsuccess = (e) => {
      db = req.result;
      let tra = db.transaction(["ROMData"], "readwrite");
      tra.objectStore("ROMData").get("key").onsuccess = (e) => {
        let result = e.target.result;
        if (!result) {
          console.log(`No cached ROM file`);
        } else {
          console.log(`Found a cached ROM file`);
        }
        resolve({ db, result, cached: !!result });
      };
    };
    req.onupgradeneeded = (e) => {
      db = req.result;
      db.createObjectStore("ROMData");
    };
  });
};

export function showROMInputDialog(db) {
  let el = rom_drop;
  el.style.display = "block";
  return new Promise((resolve) => {
    el.ondragover = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    el.ondrop = (e) => {
      e.stopPropagation();
      e.preventDefault();
      let file = e.dataTransfer.files[0];
      let name = file.name;
      let ext = name.substr(name.lastIndexOf("."), name.length);
      if (ext !== ".gba") console.warn(`Invalid ROM file extension!`);
      let reader = new FileReader();
      reader.onload = (e) => {
        let buffer = reader.result;
        let view = new Uint8Array(buffer);
        let tra = db.transaction(["ROMData"], "readwrite");
        tra.objectStore("ROMData").put(view, "key");
        el.style.display = "none";
        resolve(view);
      };
      reader.readAsArrayBuffer(file);
    };
  });
};

export function getNodeChildIndex(node) {
  let index = 0;
  while((node = node.previousSibling) !== null) ++index;
  return index;
};
