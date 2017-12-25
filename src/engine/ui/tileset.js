import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  getRelativeTile
} from "../../utils";

export function resetUIActiveTilesetLayers() {
  for (let key in CFG.ENGINE_TS_LAYERS) {
    let layerIndex = CFG.ENGINE_TS_LAYERS[key];
    let el = $(`#engine-layer-btn-${layerIndex}`);
    el.classList.remove("active-layer-btn")
  };
};

export function setUIActiveTilesetLayer(index) {
  this.currentLayer = index;
  this.resetUIActiveTilesetLayers();
  $(`#engine-layer-btn-${index}`).classList.add("active-layer-btn");
};

export function resetUIActiveEditModes() {
  for (let key in CFG.ENGINE_TS_EDIT) {
    let el = $(`#engine-edit-mode-${key.toLowerCase()}`);
    el.classList.remove("active-layer-btn");
  };
};

export function setUIActiveEditMode(mode) {
  this.setActiveEditMode(mode);
  this.resetUIActiveEditModes();
  let el = null;
  switch (mode) {
    case CFG.ENGINE_TS_EDIT.PENCIL:
      el = $(`#engine-edit-mode-pencil`);
    break;
    case CFG.ENGINE_TS_EDIT.PIPETTE:
      el = $(`#engine-edit-mode-pipette`);
    break;
    case CFG.ENGINE_TS_EDIT.BUCKET:
      el = $(`#engine-edit-mode-bucket`);
    break;
    case CFG.ENGINE_TS_EDIT.MAGIC:
      el = $(`#engine-edit-mode-magic`);
    break;
    case CFG.ENGINE_TS_EDIT.AUTOTILE:
      el = $(`#engine-edit-mode-autotile`);
    break;
  };
  if (el) el.classList.add("active-layer-btn");
  if (this.isUIInFillMode()) {
    this.forceUISingleTilesetSelection();
  }
  if (this.isUIInPipetteMode()) {
    this.resetTilesetSelection();
  }
  this.updateTilesetSelectionPreview();
};

export function setActiveEditMode(mode) {
  this.tsEditMode = mode;
  this.redrawTileset();
};

export function forceUISingleTilesetSelection() {
  let sel = this.selection.tileset;
  let tile = getRelativeTile(this.tmx, this.tmy, CFG.ENGINE_TILESET_SCALE);
  let x = tile.x >= 0 ? tile.x : 0;
  let y = tile.y >= 0 ? tile.y : 0;
  sel.x = x;
  sel.y = y;
  sel.w = x;
  sel.h = y;
  this.updateTilesetSelectionPreview();
};

export function setUITilesetSelection(x, y, w, h) {
  let sel = this.selection.tileset;
  sel.x = x;
  sel.y = y;
  sel.w = w;
  sel.h = h;
  if (this.isUIInFillMode()) {
    this.forceUISingleTilesetSelection();
  }
  this.redrawTileset();
};

export function updateTilesetSelectionPreview() {
  if (!this.currentTileset) return;
  let sel = this.selection.tileset;
  let map = this.currentMap;
  this.preview.tileset = null;
  if (this.isUIInAutotileMode() && this.isSelectionInAutotileFormat(sel)) {
     this.preview.tileset = this.bufferTilesetAutotileSelection(map, sel);
  } else if (this.isUIInPipetteMode()) {
    // no preview when in pipette mode
  } else {
    this.preview.tileset = this.bufferTilesetSelection(sel);
  }
  this.redrawTileset();
};

export function setUITilesetBundle(bundle) {
  $("#engine-ui-cts-name-txt").innerHTML = bundle.name;
  $("#engine-ui-cts-subts").innerHTML = ``;
  // collect all sub-tileset names
  let tilesets = [];
  for (let key in bundle.tilesets) tilesets.push(key);
  // sort them alphabetically ascending
  tilesets.sort((a, b) => a.localeCompare(b));
  tilesets.map((name, index) => {
    let el = document.createElement("option");
    el.innerHTML = name;
    $("#engine-ui-cts-subts").appendChild(el);
  });
  $("#engine-ui-cts-subts").onchange(null);
  this.resetTilesetSelection();
};

export function onUISubTilesetChange(index) {
  let name = $("#engine-ui-cts-subts").children[index].innerHTML;
  this.useTilesetFromBundle(this.currentBundle, name);
};
