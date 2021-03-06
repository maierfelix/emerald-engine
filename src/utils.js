import * as CFG from "./cfg";

import md5 from "./md5";

const path = require("path");
window.__dirname = path.dirname(process.execPath);

export const fs = require("fs");

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
  if (!truth) console.error("Assert exception!");
};

let uidx = 0;
export function uid() {
  return ++uidx;
};

export function MD5(data) {
  return md5(data);
};

export function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
};

export function createCanvasBuffer(width, height) {
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext("2d");
  setImageSmoothing(ctx, false);
  return { ctx, canvas };
};

export function cloneCanvas(canvas) {
  let tmp = document.createElement("canvas");
  tmp.width = canvas.width;
  tmp.height = canvas.height;
  let ctx = tmp.getContext("2d");
  setImageSmoothing(ctx, false);
  ctx.drawImage(
    canvas,
    0, 0,
    canvas.width, canvas.height,
    0, 0,
    canvas.width, canvas.height
  );
  return tmp;
};

export function setImageSmoothing(ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
  ctx.mozImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
};

export function setCanvasHDPI(ctx) {
  let canvas = ctx.canvas;
  let ratio = window.devicePixelRatio || 1;
  let width = canvas.width;
  let height = canvas.height;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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

export function createImageFromCanvas(canvas) {
  return new Promise(resolve => {
    let img = new Image();
    img.onload = (e) => {
      resolve(img);
    };
    img.src = canvas.toDataURL("image/png");
  });
};

export function loadJSONFile(path) {
  return new Promise(resolve => {
    fetch(path).then(resp => resp.json()).then(resolve);
  });
};

export function REQUEST(url, delay = 0, kind, type = "text") {
  return new Promise(resolve => {
    let xhr = new XMLHttpRequest();
    xhr.open(kind, url, true);
    xhr.responseType = type;
    xhr.onerror = (e) => {
      resolve(null);
    };
    xhr.onload = (e) => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          if (type === "text") return resolve(xhr.responseText);
          else if (type === "arraybuffer") return resolve(xhr.response);
          else console.warn(`Unsupported XHR type`);
        }
      }
      resolve(null);
    };
    if (delay > 0) {
      setTimeout(() => {
        xhr.send();
      }, delay);
    } else {
      xhr.send();
    }
  });
};

export function GET_BINARY(url, delay = 0) {
  return new Promise(resolve => {
    REQUEST(url, delay, "GET", "arraybuffer").then((result) => {
      resolve(new Uint8Array(result));
    });
  });
};

export function GET(url, delay = 0) {
  return new Promise(resolve => {
    REQUEST(url, delay, "GET").then(resolve);
  });
};

export function POST(url, delay = 0) {
  return new Promise(resolve => {
    REQUEST(url, delay, "POST").then(resolve);
  });
};

export function GET_JSON(url, delay = 0) {
  return new Promise(resolve => {
    GET(url, delay).then(result => {
      let json = JSON.parse(result);
      resolve(json);
    });
  });
};

export function addSessionToQuery(query, session) {
  return `${query}&user=${session.user}&session=${session.id}`;
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

export function rectIntersect(
  x1, y1, w1, h1,
  x2, y2, w2, h2
) {
  let x = Math.max(x1, x2);
  let num1 = Math.min(x1 + w1, x2 + w2);
  let y = Math.max(y1, y2);
  let num2 = Math.min(y1 + h1, y2 + h2);
  if (num1 > x && num2 > y) {
    return {
      x: x,
      y: y,
      w: num1 - x,
      h: num2 - y
    };
  }
  return null;
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

export function getRectangleFromSelection(dx, dy, sx, sy) {
  let normalized = getNormalizedSelection(dx, dy, sx, sy);
  let x = Math.min(normalized.x, normalized.w);
  let y = Math.min(normalized.y, normalized.h);
  let w = Math.max(normalized.x, normalized.w);
  let h = Math.max(normalized.y, normalized.h);
  return { x, y, w, h };
};

export function getTilesetTileIndexBy(x, y) {
  return (y * CFG.TILESET_HORIZONTAL_SIZE + x) + 1;
};

export function getTilesetTilePositionByIndex(index) {
  let x = ((index - 1) % CFG.TILESET_HORIZONTAL_SIZE) | 0;
  let y = ((index - 1) / CFG.TILESET_HORIZONTAL_SIZE) | 0;
  return { x, y };
};

export function coordsInMapBoundings(map, rx, ry) {
  let bounds = map.getMarginBoundings();
  let x = (rx - bounds.x);
  let y = (ry - bounds.y);
  return (
    (x >= 0 && x < bounds.w) &&
    (y >= 0 && y < bounds.h)
  );
};

export function getResizeDirection(rx, ry, map) {
  let bounds = map.getMarginBoundings();
  let x = (rx - bounds.x);
  let y = (ry - bounds.y);
  let width = bounds.w;
  let height = bounds.h;
  let dir = "";
  if (x <= 0 && y <= 0) dir = "nw";
  else if (x <= 0 && (y >= 1 && y < height - 1)) dir = "w";
  else if (x <= 0 && y >= height - 1) dir = "sw";
  else if ((x >= 1 && x < width - 1) && y >= height - 1) dir = "s";
  else if (x >= width - 1 && y >= height - 1) dir = "se";
  else if (x >= width - 1 && (y >= 1 && y < height - 1)) dir = "e";
  else if (x >= width - 1 && y <= 0) dir = "ne";
  else if ((x >= 1 && x < width - 1) && y <= 0) dir = "n";
  return dir;
};

export function getNormalizedResizeDirection(dir) {
  switch (dir) {
    case "w":  return { x: -1, y:  0 };
    case "e":  return { x:  1, y:  0 };
    case "n":  return { x:  0, y: -1 };
    case "s":  return { x:  0, y:  1 };
    case "nw": return { x: -1, y: -1 };
    case "se": return { x:  1, y:  1 };
    case "sw": return { x: -1, y:  1 };
    case "ne": return { x:  1, y: -1 };
  };
  return { x: 0, y: 0 };
};

export function boundingsMatch(a, b) {
  return (
    (a.x === b.x) &&
    (a.y === b.y) &&
    (a.w === b.w) &&
    (a.h === b.h)
  );
};

export function JSONTilesetToCanvas(rom, json, width) {
  let buffer = createCanvasBuffer(width, CFG.TILESET_DEFAULT_HEIGHT).ctx;
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
        let isBgLayerSource = tile.sx < (width / CFG.BLOCK_SIZE);
        let reduceX = (isBgLayerSource ? 0 : -width);
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

export function getNodeChildIndex(node) {
  let index = 0;
  while((node = node.previousSibling) !== null) ++index;
  return index;
};

export function getFocusedDOMNode() {
  let el = document.activeElement;
  return (
    el === document.body ? null : el
  );
};

export function parseHTMLStringAsDocument(html) {
  return new DOMParser().parseFromString(html, "text/html");
};

export function parseHTMLString(html) {
  return parseHTMLStringAsDocument(html).body.childNodes[0];
};

export function loadJavaScriptFile(path) {
  let script = document.createElement("script");
  script.src = path;
  document.body.appendChild(script);
};

export function mangleDataArray(data) {
  let str = ``;
  let length = data.length;
  for (let ii = 0; ii < length; ++ii) {
    if (data[ii + 0] === data[ii + 1]) {
      let search = data[ii + 0];
      let start = ii;
      while (data[ii] === search) ++ii;
      str += `${(ii - start)}x${search}`;
      ii--;
    } else {
      str += data[ii];
    }
    if (ii + 1 < length) str += `,`;
  };
  return str;
};

export function unmangleDataArray(str) {
  let items = str.split(`,`);
  let length = items.length;
  let data = [];
  for (let ii = 0; ii < length; ++ii) {
    let item = items[ii];
    let repeat = item.split(`x`);
    if (repeat.length > 1) {
      let times = parseInt(repeat[0]);
      let value = parseInt(repeat[1]);
      for (let jj = 0; jj < times; ++jj) data.push(value);
    } else {
      data.push(parseInt(item));
    }
  };
  return data;
};

export function stringToArrayBuffer(str) {
  let len = str.length;
  let bytes = new Uint8Array(len * 2);
  for (let ii = 0; ii < len; ++ii)  {
    let cc = str.charCodeAt(ii);
    let index = ii * 2;
    bytes[index + 0] = ((cc >> 0) & 0xff);
    bytes[index + 1] = ((cc >> 8) & 0xff);
  };
  return bytes;
};

export function saveFile(name, data) {
  let a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  let blob = new Blob([data], { type: "octet/stream" }),
  url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
  setTimeout(() => a.parentNode.removeChild(a));
};
