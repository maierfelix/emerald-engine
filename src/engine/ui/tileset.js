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
    el.setAttribute("class", "");
  };
};

export function setUIActiveTilesetLayer(index) {
  this.currentLayer = index;
  this.resetUIActiveTilesetLayers();
  $(`#engine-layer-btn-${index}`).setAttribute("class", "active-layer-btn");
};

export function resetUIActiveEditModes() {
  for (let key in CFG.ENGINE_TS_EDIT) {
    let el = $(`#engine-edit-mode-${key.toLowerCase()}`);
    el.setAttribute("class", "");
  };
};

export function setUIActiveEditMode(mode) {
  this.setActiveEditMode(mode);
  this.resetUIActiveEditModes();
  switch (mode) {
    case CFG.ENGINE_TS_EDIT.PENCIL:
      $(`#engine-edit-mode-pencil`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.PIPETTE:
      $(`#engine-edit-mode-pipette`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.BUCKET:
      $(`#engine-edit-mode-bucket`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.MAGIC:
      $(`#engine-edit-mode-magic`).setAttribute("class", "active-layer-btn");
    break;
    case CFG.ENGINE_TS_EDIT.AUTOTILE:
      $(`#engine-edit-mode-autotile`).setAttribute("class", "active-layer-btn");
    break;
  };
  if (this.isActiveUITilesetFillMode()) {
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
  if (this.isActiveUITilesetFillMode()) {
    this.forceUISingleTilesetSelection();
  }
  this.redrawTileset();
};

export function isActiveTilesetFillMode() {
  return (
    (this.mode === CFG.ENGINE_MODE_TS ) &&
    (this.tsEditMode === CFG.ENGINE_TS_EDIT.BUCKET ||
    this.tsEditMode === CFG.ENGINE_TS_EDIT.MAGIC)
  );
};

export function isActiveUITilesetFillMode() {
  return this.isActiveTilesetFillMode();
};

export function isUIInAutotileMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.AUTOTILE;
};

export function isUIInPipetteMode() {
  return this.tsEditMode === CFG.ENGINE_TS_EDIT.PIPETTE;
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
  $("#engine-ui-cts-name").innerHTML = `🎨 ${bundle.name}`;
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
