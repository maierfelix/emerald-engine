import * as CFG from "../../cfg";

import {
  $,
  assert
} from "../../utils";

export function setUIMapStatsModeVisibility(visibility) {
  this.setUIVisibility(!visibility);
  this.setUIMapCursor("pointer");
  this.setUIMapStatsVisibility(visibility);
  if (visibility) this.setUIMapCursor("pointer");
  else this.setUIMapCursor("default");
  this.setUIMapStatsWarning(``);
};

export function setUIMapStatsVisibility(state) {
  let el = $(`#engine-ui-top-stats`);
  el.style.visibility = state ? `visible` : `hidden`;
};

export function updateMapStatsModeUI(map) {
  if (this.isUIInMapResizeMode()) return this.updateMapStatsResizeModeUI(map);
  else if (this.isUIInObjectCreationMode()) {
    let object = this.creation.object;
    return this.updateObjectStatsObjectCreationModeUI(object, object.map);
  }
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  // make sure they are displayed
  statW.style.display = "block";
  statH.style.display = "block";
  // update DOM nodes
  statX.innerHTML = `X: ` + map.x;
  statY.innerHTML = `Y: ` + map.y;
  statW.innerHTML = `Width: ` + map.width;
  statH.innerHTML = `Height: ` + map.height;
};

export function updateMapStatsResizeModeUI(map) {
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  let mrX = map.margin.x;
  let mrY = map.margin.y;
  let mrW = map.margin.w - mrX;
  let mrH = map.margin.h - mrY;
  // show a + sign when margin values are positive
  mrX = (mrX > 0 ? `+` : ``) + mrX;
  mrY = (mrY > 0 ? `+` : ``) + mrY;
  mrW = (mrW > 0 ? `+` : ``) + mrW;
  mrH = (mrH > 0 ? `+` : ``) + mrH;
  // make sure they are displayed
  statW.style.display = "block";
  statH.style.display = "block";
  // update DOM nodes
  statX.innerHTML = `X: ${map.x}:${mrX}`;
  statY.innerHTML = `Y: ${map.y}:${mrY}`;
  statW.innerHTML = `Width: ${map.width}:${mrW}`;
  statH.innerHTML = `Height: ${map.height}:${mrH}`;
};

export function updateObjectStatsObjectCreationModeUI(object, map) {
  let statX = $(`#engine-ui-new-map-stat-x`);
  let statY = $(`#engine-ui-new-map-stat-y`);
  let statW = $(`#engine-ui-new-map-stat-width`);
  let statH = $(`#engine-ui-new-map-stat-height`);
  // make sure they are invisible
  statW.style.display = "none";
  statH.style.display = "none";
  statX.innerHTML = `X: ${map.x}:${object.x}`;
  statY.innerHTML = `Y: ${map.y}:${object.y}`;
};

export function setUIMapStatsWarning(msg) {
  let el = $(`#engine-ui-top-stats-warning`);
  let elMsg = $(`#engine-ui-top-stats-warning-msg`);
  el.style.display = msg.length > 0 ? `block` : `none`;
  elMsg.innerHTML = msg;
};

export function setUIMapStatsMapValidity(map, isPlaceable) {
  this.setUIMapStatsWarning(``);
  if (!isPlaceable) {
    let bounds = map.getMarginBoundings();
    if (!this.isValidMapSize(bounds.w, bounds.h)) {
      this.setUIMapStatsWarning(`Invalid Map boundings`);
    } else {
      this.setUIMapStatsWarning(`Invalid Map position`);
    }
  }
};
