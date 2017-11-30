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
  window.addEventListener("mousedown", (e) => {
    this.mouseClick(e);
    // ui modal
    if (this.modalMode) {
      if (e.target === $("#ui-modal-ts_bundle")) this.closeUIModal();
    }
  });
  window.addEventListener("mouseup", (e) => this.mouseUp(e));
  window.addEventListener("contextmenu", (e) => this.mouseContext(e));
  window.addEventListener("keydown", (e) => this.keyDown(e));
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
  this.addTilesetLayerListeners();
  this.addTilesetBundleListener();
  this.addSubTilesetListener();
};

export function keyDown(e) {
  let key = e.key;
  switch (key) {
    case "Escape":
      this.closeUIModal();
    break;
  };
};

export function addUIButtonListeners() {
  $("#engine-ui-map-save").onclick = () => this.onUIMapSave();
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
    this.preview.tileset = this.bufferTilesetSelection(this.selection.tileset);
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

export function addTilesetLayerListeners() {
  $("#engine-layer-btn-1").onclick = (e) => this.setUIActiveTilesetLayer(1);
  $("#engine-layer-btn-2").onclick = (e) => this.setUIActiveTilesetLayer(2);
  $("#engine-layer-btn-3").onclick = (e) => this.setUIActiveTilesetLayer(3);
  $("#engine-layer-btn-4").onclick = (e) => this.setUIActiveTilesetLayer(4);
  $("#engine-layer-btn-5").onclick = (e) => this.setUIActiveTilesetLayer(5);
};

export function addTilesetBundleListener() {
  let el = $(`#engine-ui-cts-name`);
  el.onclick = (e) => this.showUIModal("TS_BUNDLE");
};

export function addSubTilesetListener() {
  let el = $(`#engine-ui-cts-subts`);
  el.onchange = (e) => this.onUISubTilesetChange(el.selectedIndex);
};
