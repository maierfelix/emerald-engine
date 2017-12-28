import * as CFG from "../cfg";

import {
  $,
  getRelativeTile,
  getNormalizedSelection
} from "../utils";

export function addListeners() {
  window.addEventListener("resize", (e) => this.resize(window.innerWidth, window.innerHeight));
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
  this.addUIMapChooseListener();
  let self = this;
  // update loop
  (function update() {
    setTimeout(update.bind(this), 1e3 / 60);
    this.update();
  }).call(this);
  this.addTilesetListeners();
  this.addTilesetLayerListeners();
  this.addTilesetEditModeListeners();
  this.addTilesetBundleListener();
  this.addSubTilesetListener();
  this.addMapOptionsListeners();
  this.addContextMenuListeners();
};

export function keyDown(e) {
  let key = e.key;
  let isInActiveMode = this.isUIInAnyActiveMode();
  switch (key) {
    case "Escape":
      this.closeUIModal();
      if (this.isUIInMapCreationMode()) this.onUIMapAddAbort();
      else if (this.isUIInMapResizeMode()) this.onUIMapResizeAbort();
    break;
    case "Enter":
      if (this.isUIInMapCreationMode()) {
        this.onUIPlaceNewMap(this.creation.map);
        this.endCommitSession();
      }
      else if (this.isUIInMapResizeMode()) {
        this.onUIPlaceResizedMap(this.resizing.map);
        this.endCommitSession();
      }
    break;
    case "Delete":
      if (this.currentMap && !isInActiveMode) {
        this.onUIMapDelete(this.currentMap);
        this.endCommitSession();
      }
    break;
    case "z": case "Z":
      if (e.ctrlKey && !isInActiveMode) this.undoTask();
    break;
    case "y": case "Y":
      if (e.ctrlKey && !isInActiveMode) this.redoTask();
    break;
    case "c": case "C":
      if (this.isUIInSelectMode()) this.updateMapSelectionPreview();
    break;
  };
};

export function addUIButtonListeners() {
  $(`#engine-ui-mz`).onclick = () => this.onUILockCameraZ();
  $("#engine-ui-map-add").onclick = () => this.onUIMapAdd();
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
    if (!this.currentMap) return;
    let area = el.selectedIndex;
    let pkmnId = CFG.ENGINE_ENCOUNTER_DEFAULTS.PKMN;
    let chance = CFG.ENGINE_ENCOUNTER_DEFAULTS.CHANCE;
    let minLvl = CFG.ENGINE_ENCOUNTER_DEFAULTS.MIN_LVL;
    let maxLvl = CFG.ENGINE_ENCOUNTER_DEFAULTS.MAX_LVL;
    let node = this.addUIEncounterNode(
      pkmnId,
      area,
      chance,
      minLvl,
      maxLvl
    );
    this.currentMap.addEncounter(
      pkmnId,
      area,
      chance,
      minLvl,
      maxLvl,
      node
    );
    node.querySelector(".ts-btn-select").focus();
  };
};

export function addUIMapChooseListener() {
  let el = $(`#engine-ui-map-select`);
  el.onchange = (e) => {
    let index = el.selectedIndex;
    let map = this.maps[index];
    this.setUIActiveMap(map);
  };
};

export function addMapOptionsListeners() {
  let elName = $(`#engine-ui-opt-name`);
  let elShowName = $(`#engine-ui-opt-show-name`);
  let elType = $(`#engine-ui-opt-type`);
  let elWeather = $(`#engine-ui-opt-weather`);
  let elMusic = $(`#engine-ui-opt-music`);
  //let elDelete = $(`#engine-ui-opt-delete`);
  let elWidth = $(`#engine-ui-opt-width`);
  let elHeight = $(`#engine-ui-opt-height`);
  let elResize = $(`#engine-ui-opt-resize`);
  elName.oninput = (e) => {
    if (this.currentMap) {
      this.onUIUpdateMapSettings(`name`, elName.value);
      this.refreshUIMaps();
      this.setUIActiveMap(this.currentMap);
    }
  };
  elShowName.onchange = (e) => {
    if (this.currentMap) this.onUIUpdateMapSettings(`showName`, elShowName.checked);
  };
  elType.onchange = (e) => {
    if (this.currentMap) this.onUIUpdateMapSettings(`type`, elType.selectedIndex);
  };
  elWeather.onchange = (e) => {
    if (this.currentMap) this.onUIUpdateMapSettings(`weather`, elWeather.selectedIndex);
  };
  elMusic.onchange = (e) => {
    if (this.currentMap) this.onUIUpdateMapSettings(`music`, elMusic.selectedIndex);
  };
  /*elDelete.onclick = (e) => {
    if (this.currentMap) {
      elDelete.blur();
      this.onUIMapDelete(this.currentMap);
    }
  };*/
  elResize.onclick = (e) => {
    if (this.currentMap) this.onUIMapResize(this.currentMap);
  };
};

export function addTilesetListeners() {
  let el = $("#engine-tileset");
  let down = false;
  el.onmousedown = (e) => {
    let mx = e.offsetX;
    let my = e.offsetY;
    if (e.which !== 1) return;
    down = true;
    this.preview.tileset = null;
    let tile = getRelativeTile(mx, my, CFG.ENGINE_TILESET_SCALE);
    let sel = this.selection.tileset;
    sel.sx = tile.x; sel.sy = tile.y;
    // don't allow any action when in pipette mode
    if (this.isUIInPipetteMode()) return;
    this.setUITilesetSelection(tile.x, tile.y, sel.x, sel.y);
    el.onmousemove.call(this, e);
  };
  el.onmouseup = (e) => {
    let mx = e.offsetX;
    let my = e.offsetY;
    if (e.which !== 1) return;
    down = false;
    this.updateTilesetSelectionPreview();
  };
  el.onmouseout = (e) => {
    el.onmouseup.call(this, e);
  };
  el.onmousemove = (e) => {
    let mx = e.offsetX;
    let my = e.offsetY;
    if (!down) return;
    this.tmx = mx;
    this.tmy = my;
    let tile = getRelativeTile(mx, my, CFG.ENGINE_TILESET_SCALE);
    let selection = this.selection.tileset;
    let sel = getNormalizedSelection(
      tile.x, tile.y,
      selection.sx, selection.sy
    );
    // don't allow any action when in pipette mode
    if (this.isUIInPipetteMode()) return;
    this.setUITilesetSelection(sel.x, sel.y, sel.w, sel.h);
  };
};

export function addTilesetLayerListeners() {
  $("#engine-layer-btn-1").onclick = (e) => this.setUIActiveTilesetLayer(1);
  $("#engine-layer-btn-2").onclick = (e) => this.setUIActiveTilesetLayer(2);
  $("#engine-layer-btn-3").onclick = (e) => this.setUIActiveTilesetLayer(3);
  $("#engine-layer-btn-4").onclick = (e) => this.setUIActiveTilesetLayer(4);
  $("#engine-layer-btn-5").onclick = (e) => this.setUIActiveTilesetLayer(5);
};

export function addTilesetEditModeListeners() {
  $(`#engine-edit-mode-select`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.SELECT);
  $(`#engine-edit-mode-pencil`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.PENCIL);
  $(`#engine-edit-mode-pipette`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.PIPETTE);
  $(`#engine-edit-mode-bucket`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.BUCKET);
  $(`#engine-edit-mode-magic`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.MAGIC);
  $(`#engine-edit-mode-autotile`).onclick = (e) => this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.AUTOTILE);
};

export function addTilesetBundleListener() {
  let el = $(`#engine-ui-cts-name`);
  el.onclick = (e) => this.showUIModal("TS_BUNDLE");
};

export function addSubTilesetListener() {
  let el = $(`#engine-ui-cts-subts`);
  el.onchange = (e) => this.onUISubTilesetChange(el.selectedIndex);
};

export function addContextMenuListeners() {
  $(`#engine-ui-context-switch-map`).onmouseup = (e) => this.switchMapByUIContextMenu(e);
  $(`#engine-ui-context-create-object`).onmouseup = (e) => console.log(e);
  $(`#engine-ui-context-delete-object`).onmouseup = (e) => console.log(e);
};
