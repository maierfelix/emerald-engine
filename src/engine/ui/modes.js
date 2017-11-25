import * as CFG from "../../cfg";

import {
  $
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
  this.mode = index;
  if (index < 0) return;
  let mode = CFG.ENGINE_OBJ_MODE[index].toLowerCase();
  let elMenu = $(`#engine-ui-obj-${mode}`);
  elMenu.style.display = "block";
};
