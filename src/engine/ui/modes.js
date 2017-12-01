import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  loadJSONFile,
  getRelativeTile,
  getNodeChildIndex,
  createCanvasBuffer
} from "../../utils";

import {
  showLoadingModal,
  closeLoadingModal
} from "../../screens";

export function resetUIModeButtons() {
  $("#engine-ui-mode-ts").setAttribute("class", "ts-btn");
  $("#engine-ui-mode-obj").setAttribute("class", "ts-btn");
  $("#engine-ui-mode-opt").setAttribute("class", "ts-btn");
};

export function resetUIModeMenus() {
  $("#engine-ui-ts").style.display = "none";
  $("#engine-ui-obj").style.display = "none";
  $("#engine-ui-opt").style.display = "none";
};

export function setUIMode(mode) {
  this.resetUIModeButtons();
  this.resetUIModeMenus();
  let elBtn = $(`#engine-ui-mode-${mode}`);
  let elMenu = $(`#engine-ui-${mode}`);
  elBtn.setAttribute("class", "ts-btn ts-btn-active");
  elMenu.style.display = "block";
  this.mode = CFG[`ENGINE_MODE_${mode.toUpperCase()}`];
  if (this.mode === void 0) console.warn(`Unexpected mode switch!`);
};

export function resetUIObjMenus() {
  for (let key in CFG.ENGINE_OBJ_MODE) {
    let mode = CFG.ENGINE_OBJ_MODE[key].toLowerCase();
    let elMenu = $(`#engine-ui-obj-${mode}`);
    elMenu.style.display = "none";
  };
};

export function setUIObjMode(index) {
  this.resetUIObjMenus();
  this.objMode = index;
  if (index < 0) return;
  let mode = CFG.ENGINE_OBJ_MODE[index].toLowerCase();
  let elMenu = $(`#engine-ui-obj-${mode}`);
  elMenu.style.display = "block";
};

export function resetUIEncounterMenus() {
  for (let key in CFG.ENGINE_ENCOUNTER_MODE) {
    let mode = CFG.ENGINE_ENCOUNTER_MODE[key].toLowerCase();
    let elMenu = $(`#engine-ui-opt-encount-${mode}`);
    elMenu.style.display = "none";
  };
};

export function setUIEncounterMode(index) {
  this.resetUIEncounterMenus();
  this.encounterMode = index;
  if (index < 0) return;
  let mode = CFG.ENGINE_ENCOUNTER_MODE[index].toLowerCase();
  let elMenu = $(`#engine-ui-opt-encount-${mode}`);
  elMenu.style.display = "block";
};

export function getUIEncounterDOMItem() {
  let names = this.getPkmnNameList();
  let strNames = names.map(name => `<option>${name}</option>`).join("");
  let html = `
    <div class="engine-ui-encount-item">
      <div class="ts-btn engine-ui-encount-icon"></div>
      <button class="ts-btn engine-ui-encount-btn-close">-</button>
      <select class="ts-btn ts-btn-select">
        ${strNames}
      </select>
      <input type="number" class="ts-btn ssm" placeholder="0%">
      <div class="engine-ui-encount-wrapper">
        <label>Min:</label> <input type="number" class="ts-btn ssm" placeholder="Min:" value="1">
        <label>Max:</label>
        <input type="number" class="ts-btn ssm" placeholder="Max:" value="5">
      </div>
    </div>
  `;
  let node = new DOMParser().parseFromString(html, "text/html").body.childNodes[0];
  return node;
};

export function addUIEncounterNodeByType(index) {
  let type = CFG.ENGINE_ENCOUNTER_MODE[index];
  let elMenu = $(`#engine-ui-opt-encount-${type.toLowerCase()}`);
  let node = this.getUIEncounterDOMItem();
  let rmBtn = node.children[1];
  let pkmnBtn = node.querySelector(".ts-btn-select");
  let pkmnPreview = node.querySelector(".engine-ui-encount-icon");
  let pkmnIcon = null;
  let pkmnIconBuffer = createCanvasBuffer(32, 32).ctx;
  let removed = false;
  assert(rmBtn.nodeName === "BUTTON");
  assert(rmBtn.innerHTML === "-");
  pkmnPreview.appendChild(pkmnIconBuffer.canvas);
  rmBtn.onclick = (e) => {
    removed = true;
    this.removeUIEncounterNode(node);
  };
  pkmnBtn.onchange = (e) => {
    let index = pkmnBtn.selectedIndex + 1;
    pkmnIcon = this.rom.graphics.pkmns.icon[index].canvas;
  };
  pkmnBtn.onchange();
  assert(rmBtn.nodeName === "BUTTON");
  assert(rmBtn.innerHTML === "-");
  elMenu.appendChild(node);
  // animate pkmn icon
  let timer = 0;
  (function draw() {
    if (!removed) requestAnimationFrame(() => draw.call(this));
    if (this.mode !== CFG.ENGINE_MODE_OPT) return;
    timer += 0.1;
    let yFrame = (timer % 2) | 0;
    pkmnIconBuffer.clearRect(
      0, 0,
      32, 32
    );
    pkmnIconBuffer.drawImage(
      pkmnIcon,
      0, 32 * yFrame,
      32, 32,
      0, 0,
      32, 32
    );
  }).call(this);
};

export function removeUIEncounterNode(node) {
  node.parentNode.removeChild(node);
};

export function setUIMousePosition(x, y) {
  let rel = getRelativeTile(x - this.cx, y - this.cy, this.cz);
  $("#engine-ui-mx").innerHTML = `X: ${rel.x / CFG.BLOCK_SIZE}`;
  $("#engine-ui-my").innerHTML = `Y: ${rel.y / CFG.BLOCK_SIZE}`;
  // change cursor when hovering over an object
  // only do this when in object mode
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getEventEntityByPosition(rel.x / CFG.BLOCK_SIZE, rel.y / CFG.BLOCK_SIZE);
    this.map.style.cursor = entity !== null ? "pointer" : "default";
  }
};

export function resetUIActiveTilesetLayers() {
  for (let key in CFG.ENGINE_TS_LAYERS) {
    let layerIndex = CFG.ENGINE_TS_LAYERS[key];
    let el = $(`#engine-layer-btn-${layerIndex}`);
    el.setAttribute("class", "");
  };
};

export function setUIActiveTilesetLayer(index) {
  this.tsMode = index;
  this.resetUIActiveTilesetLayers();
  $(`#engine-layer-btn-${index}`).setAttribute("class", "active-layer-btn");
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

export function onUIMapSave() {
  let map = this.currentMap;
  let json = map.toJSON();
  console.log(json);
};

export function showUIModal(kind) {
  let el = $(`#ui-modal-${kind.toLowerCase()}`);
  el.style.display = "flex";
  el.style.opacity = 0.0;
  this.modalMode = el;
  switch (kind) {
    case "TS_BUNDLE": {
      let target = el.children[0];
      showLoadingModal(this.rom, `Resolving Bundle List...`);
      GET(CFG.ENGINE_TS_SERVER_LOC + `/?cmd=GET_TILESET_LIST`, CFG.ENGINE_BUNDLE_PICK_DELAY).then(res => {
        closeLoadingModal();
        // delayed opacity<->display hack
        setTimeout(() => el.style.opacity = 1.0, 250);
        target.innerHTML = ``;
        let json = JSON.parse(res);
        for (let name in json) {
          let ts = json[name];
          let count = ts.tilesets.length;
          let node = this.createUIModelItem(name + ` [${count}]`, ts.description);
          let btn = node.querySelector(".ui-modal-item-choose");
          btn.onclick = (e) => {
            this.closeUIModal();
            showLoadingModal(this.rom, `Loading ${name} bundle...`);
            setTimeout(() => {
              this.loadTilesetBundleFromServer(name).then(tileset => {
                closeLoadingModal();
                this.useTilesetBundle(tileset);
              });
            }, CFG.ENGINE_BUNDLE_PICK_DELAY / 2);
          };
          target.appendChild(node);
        };
      });
    } break;
  };
};

export function closeUIModal() {
  let el = this.modalMode;
  if (el) {
    this.modalMode = null;
    setTimeout(() => el.style.opacity = 0.0, 10);
    setTimeout(() => {
      if (parseFloat(el.style.opacity) <= 0) {
        el.style.display = "none";
      }
    }, 210);
  }
};

export function createUIModelItem(name, desc) {
  let html = `
    <div class="ui-modal-item">
      <label class="ui-modal-item-title">${name}</label>
      <div class="ui-modal-item-desc">${desc}</div>
      <button class="ts-btn ui-modal-item-choose">Pick Tileset</button>
    </div>
  `;
  let node = new DOMParser().parseFromString(html, "text/html").body.childNodes[0];
  return node;
};

export function processUIMouseInput(e) {
  let x = e.clientX;
  let y = e.clientY;
  let map = this.currentMap;
  let rel = getRelativeTile(x - this.cx, y - this.cy, this.cz);
  // object dragging
  if (this.mode === CFG.ENGINE_MODE_OBJ) {
    let entity = this.getEventEntityByPosition(rel.x / CFG.BLOCK_SIZE, rel.y / CFG.BLOCK_SIZE);
    if (entity !== null && this.selection.entity === null) this.selection.entity = entity;
    if (this.selection.entity !== null) {
      let entity = this.selection.entity;
      entity.x = rel.x / CFG.BLOCK_SIZE;
      entity.y = rel.y / CFG.BLOCK_SIZE;
    }
  }
  // tile drawing
  else if (this.mode === CFG.ENGINE_MODE_TS) {
    map.drawTileSelectionAt(
      rel.x / CFG.BLOCK_SIZE, rel.y / CFG.BLOCK_SIZE,
      this.tsMode,
      this.selection.tileset
    );
  }
};
