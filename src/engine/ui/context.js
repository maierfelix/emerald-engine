import * as CFG from "../../cfg";

import {
  $,
  assert
} from "../../utils";

export function isUIContextMenuActive() {
  return this.drag.context === true;
};

export function resetUIContextMenu(e) {
  $(`#engine-ui-context-switch-map`).style.display = "none";
  $(`#engine-ui-context-create-object`).style.display = "none";
  $(`#engine-ui-context-delete-object`).style.display = "none";
};

export function showUIContextMenu() {
  this.drag.context = true;
  let elMenu = $(`#engine-ui-context-menu`);
  let elActiveMap = $(`#engine-ui-context-switch-map`);
  elMenu.style.display = `flex`;
  let x = this.mx - (elMenu.offsetWidth / 2);
  let y = this.my - (18 - CFG.ENGINE_UI_OFFSET_Y);
  elMenu.style.left = x + `px`;
  elMenu.style.top = y + `px`;
  this.resetUIContextMenu();
  let rel = this.getRelativeMapTile(this.mx, this.my);
  let map = this.getMapByPosition(rel.x, rel.y);
  if (map && this.currentMap !== map) {
    elActiveMap.innerHTML = `Switch to "${map.getName()}"`;
    elActiveMap.style.display = `block`;
  }
  else if (this.isUIInObjectMode()) {
    $(`#engine-ui-context-create-object`).style.display = "block";
    // only show delete object option when an object is found there
    let rel = this.getRelativeMapTile(this.mx, this.my);
    let object = this.getMapObjectByPosition(
      rel.x, rel.y
    );
    if (object) $(`#engine-ui-context-delete-object`).style.display = "block";
  }
  else {
    elMenu.style.display = `none`;
  }
};

export function closeUIContextMenu(e) {
  this.drag.context = false;
  let el = $(`#engine-ui-context-menu`);
  el.style.display = `none`;
};
