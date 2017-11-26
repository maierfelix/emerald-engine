import * as CFG from "../../cfg";

import {
  $,
  assert,
  getRelativeTile,
  createCanvasBuffer
} from "../../utils";

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
  assert(rmBtn.nodeName === "BUTTON");
  assert(rmBtn.innerHTML === "-");
  rmBtn.onclick = (e) => {
    this.removeUIEncounterNode(node);
  };
  pkmnBtn.onchange = (e) => {
    let index = pkmnBtn.selectedIndex + 1;
    let icon = this.rom.graphics.pkmns.icon[index].canvas;
    let buffer = createCanvasBuffer(32, 32).ctx;
    buffer.drawImage(
      icon,
      0, 0,
      32, 32,
      0, 0,
      32, 32
    );
    pkmnPreview.innerHTML = ``;
    pkmnPreview.appendChild(buffer.canvas);
  };
  pkmnBtn.onchange();
  assert(rmBtn.nodeName === "BUTTON");
  assert(rmBtn.innerHTML === "-");
  elMenu.appendChild(node);
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
