import * as CFG from "../cfg";

import {
  $,
  loadJSONFile,
  getRelativeTile,
  setImageSmoothing,
  createCanvasBuffer,
  JSONTilesetToCanvas,
  getNormalizedSelection
} from "../utils";

export function setup() {
  this.addListeners();
  this.resize();
  this.loadDefaultMap();
};

export function loadDefaultMap() {
  loadJSONFile("../tileset.json").then(json => {
    this.useTileset(json);
    this.currentMap = this.loadMapFromROM(0, 19);
    $("#engine-ui").style.display = "block";
    document.body.style.background = `#2c2d2e`;
  });
};

export function addListeners() {
  window.addEventListener("resize", (e) => this.resize(e));
  window.addEventListener("mousewheel", (e) => this.mouseWheel(e));
  window.addEventListener("mousemove", (e) => this.mouseMove(e));
  window.addEventListener("mousedown", (e) => this.mouseClick(e));
  window.addEventListener("mouseup", (e) => this.mouseUp(e));
  window.addEventListener("contextmenu", (e) => this.mouseContext(e));
  let self = this;
  // update loop
  (function update() {
    setTimeout(update.bind(this), 1e3 / 60);
    this.update();
  }).call(this);
  this.addTilesetListeners();
};

export function addTilesetListeners() {
  let el = $("#engine-tileset");
  let down = false;
  el.onmousedown = (e) => {
    if (e.which !== 1) return;
    down = true;
    let mx = e.offsetX;
    let my = e.offsetY;
    let tile = getRelativeTile(mx, my, CFG.ENGINE_TILESET_SCALE);
    let selection = this.selection.tileset;
    selection.x = tile.x; selection.y = tile.y;
    selection.sx = tile.x; selection.sy = tile.y;
    selection.w = selection.x;
    selection.h = selection.y;
    el.onmousemove.call(this, e);
  };
  el.onmouseup = (e) => {
    if (e.which !== 1) return;
    down = false;
  };
  el.onmousemove = (e) => {
    if (!down) return;
    let mx = e.offsetX;
    let my = e.offsetY;
    let tile = getRelativeTile(mx, my, CFG.ENGINE_TILESET_SCALE);
    let selection = this.selection.tileset;
    let sel = getNormalizedSelection(
      tile.x, tile.y,
      selection.sx, selection.sy
    );
    selection.x = sel.x;
    selection.y = sel.y;
    selection.w = sel.w;
    selection.h = sel.h;
  };
};
