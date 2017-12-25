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

let CACHED_ENCOUNTER_HTML = null;
export function getUIEncounterDOMItem() {
  let names = this.getPkmnNameList();
  let strNames = names.map(name => `<option>${name}</option>`).join("");
  let html = null;
  if (!CACHED_ENCOUNTER_HTML) {
    html = `
      <div class="engine-ui-encount-item">
        <div class="ts-btn engine-ui-encount-icon"></div>
        <button class="ts-btn engine-ui-encount-btn-close">-</button>
        <select class="ts-btn ts-btn-select">
          ${strNames}
        </select>
        <input type="number" class="ts-btn ssm engine-ui-encount-chance" placeholder="0%">
        <div class="engine-ui-encount-wrapper">
          <label>Min:</label>
          <input type="number" class="ts-btn ssm engine-ui-encount-min" placeholder="Min:" value="1">
          <label>Max:</label>
          <input type="number" class="ts-btn ssm engine-ui-encount-max" placeholder="Max:" value="5">
        </div>
      </div>
    `;
  } else {
    html = CACHED_ENCOUNTER_HTML;
  }
  return parseHTMLString(html);
};

export function createUIEncounterNode(pkmnId, chance, minLvl, maxLvl) {
  let node = this.getUIEncounterDOMItem();
  let elRemoveBtn = node.children[1];
  let elPkmnBtn = node.querySelector(".ts-btn-select");
  let elPkmnChance = node.querySelector(".engine-ui-encount-chance");
  let elPkmnMinLvl = node.querySelector(".engine-ui-encount-min");
  let elPkmnMaxLvl = node.querySelector(".engine-ui-encount-max");
  let elPkmnPreview = node.querySelector(".engine-ui-encount-icon");
  let pkmnIcon = null;
  let pkmnIconBuffer = createCanvasBuffer(32, 32).ctx;
  let removed = false;
  assert(elRemoveBtn.nodeName === "BUTTON");
  assert(elRemoveBtn.innerHTML === "-");
  elPkmnPreview.appendChild(pkmnIconBuffer.canvas);
  // fill node with parameters
  {
    elPkmnBtn.selectedIndex = pkmnId - 1;
    elPkmnChance.value = chance;
    elPkmnMinLvl.value = minLvl;
    elPkmnMaxLvl.value = maxLvl;
  }
  elRemoveBtn.onclick = (e) => {
    removed = true;
    this.removeUIEncounterNode(node);
  };
  elPkmnBtn.onchange = (e) => {
    let index = elPkmnBtn.selectedIndex + 1;
    pkmnIcon = this.rom.graphics.pkmns.icon[index].canvas;
    // dont trigger an update if it's an fake event
    if (e) this.updateUIEncounterByNode(node);
  };
  elPkmnChance.oninput = (e) => this.updateUIEncounterByNode(node);
  elPkmnMinLvl.oninput = (e) => this.updateUIEncounterByNode(node);
  elPkmnMaxLvl.oninput = (e) => this.updateUIEncounterByNode(node);
  elPkmnBtn.onchange();
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
  return node;
};

export function addUIEncounterNode(pkmnId, area, chance, minLvl, maxLvl) {
  let type = CFG.ENGINE_ENCOUNTER_MODE[area];
  let elMenu = $(`#engine-ui-opt-encount-${type.toLowerCase()}`);
  let node = this.createUIEncounterNode(pkmnId, chance, minLvl, maxLvl);
  elMenu.appendChild(node);
  return node;
};

export function removeUIEncounterNode(node) {
  node.parentNode.removeChild(node);
  this.currentMap.removeEncounterByNode(node);
};

export function updateUIEncounterByNode(node) {
  this.currentMap.updateEncounterByNode(node);
};

export function resetUIActiveMapEncounters() {
  let elGround = $(`#engine-ui-opt-encount-ground`);
  let elWater = $(`#engine-ui-opt-encount-water`);
  let elFishing = $(`#engine-ui-opt-encount-fishing`);
  elGround.innerHTML = ``;
  elWater.innerHTML = ``;
  elFishing.innerHTML = ``;
};

export function setUIActiveMapEncounters(map) {
  this.resetUIActiveMapEncounters();
  let encounters = map.encounters;
  for (let ii = 0; ii < encounters.length; ++ii) {
    let encounter = encounters[ii];
    encounter.node = this.addUIEncounterNode(
      encounter.id,
      encounter.area,
      encounter.chance,
      encounter.minLvl,
      encounter.maxLvl
    );
  };
};
