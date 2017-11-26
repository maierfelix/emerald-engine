import * as CFG from "../cfg";

import {
  $,
  getRelativeTile,
  getNormalizedSelection
} from "../utils";

export function addListeners() {
  window.addEventListener("resize", (e) => this.resize(e));
  window.addEventListener("mousewheel", (e) => this.mouseWheel(e));
  window.addEventListener("mousemove", (e) => this.mouseMove(e));
  window.addEventListener("mousedown", (e) => this.mouseClick(e));
  window.addEventListener("mouseup", (e) => this.mouseUp(e));
  window.addEventListener("contextmenu", (e) => this.mouseContext(e));
  this.addUIButtonListeners();
  this.addUIObjListeners();
  this.addUIEncounterListeners();
  let self = this;
  // update loop
  (function update() {
    setTimeout(update.bind(this), 1e3 / 60);
    this.update();
  }).call(this);
  this.addTilesetListeners();
};

export function addUIButtonListeners() {
  $("#engine-ui-mode-ts").onclick = () => this.setUIMode("ts");
  $("#engine-ui-mode-obj").onclick = () => this.setUIMode("obj");
  $("#engine-ui-mode-opt").onclick = () => this.setUIMode("opt");
};

export function addUIObjListeners() {
  let el = $("#engine-ui-obj-type");
  el.onchange = (e) => {
    let index = el.selectedIndex;
    this.setUIObjMode(index);
  };
};

export function addUIEncounterListeners() {
  let el = $("#engine-ui-encounter-type");
  el.onchange = (e) => {
    let index = el.selectedIndex;
    this.setUIEncounterMode(index);
  };
  $("#engine-ui-add-encounter").onclick = (e) => {
    this.addUIEncounterNodeByType(el.selectedIndex);
  };
};

export function addTilesetListeners() {
  let el = $("#engine-tileset");
  let down = false;
  el.onmousedown = (e) => {
    if (e.which !== 1) return;
    down = true;
    this.preview.tileset = null;
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
    this.preview.tileset = null;
    this.preview.tileset = this.bufferTilesetSelection();
  };
  el.onmouseout = (e) => {
    el.onmouseup.call(this, e);
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
