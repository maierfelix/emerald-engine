import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  parseHTMLString,
  createCanvasBuffer
} from "../../utils";

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
      <input type="number" class="ts-btn ssm engine-ui-encount-chance" placeholder="0%">
      <div class="engine-ui-encount-wrapper">
        <label>Min:</label> <input type="number" class="ts-btn ssm" placeholder="Min:" value="1">
        <label>Max:</label>
        <input type="number" class="ts-btn ssm" placeholder="Max:" value="5">
      </div>
    </div>
  `;
  return parseHTMLString(html);
};

export function addUIEncounterNodeByType(index) {
  let type = CFG.ENGINE_ENCOUNTER_MODE[index];
  let elMenu = $(`#engine-ui-opt-encount-${type.toLowerCase()}`);
  let node = this.getUIEncounterDOMItem();
  let rmBtn = node.children[1];
  let pkmnBtn = node.querySelector(".ts-btn-select");
  let pkmnChance = node.querySelector(".engine-ui-encount-chance");
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
    if (!this.isUIInOptionMode()) return;
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
