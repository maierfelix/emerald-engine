import {
  $
} from "../utils";

import * as CFG from "../cfg";

export function showUILoadingModal(rom, msg, color) {
  // no title color defined, use default color
  if (!color) setUILoadingModalTitleColor(CFG.ENGINE_UI_COLORS.DEFAULT);
  setUILoadingModalTitle(msg);
  setUILoadingModalTitleBottom(``);
  let rndBallIdx = (Math.random() * 12) + 1 | 0;
  let elRndBall = rom.graphics.items[rndBallIdx].canvas;
  let el = $(`#ui-modal-loading`);
  el.style.display = "flex";
  el.style.opacity = 0.0;
  // delayed opacity<->display hack
  setTimeout(() => el.style.opacity = 1.0, 10);
  let elBall = $(`#ui-modal-loading-ball`);
  let elSpinner = $(`#ui-modal-loading-spinner`);
  let data = elRndBall.getContext("2d").getImageData(
    9, 12,
    1, 1
  ).data;
  let r = data[0];
  let g = data[1];
  let b = data[2];
  elSpinner.style.border = `4px solid rgba(${r/2},${g/2},${b/2},1.0)`;
  elSpinner.style.borderTop = `4px solid rgba(${r},${g},${b},1.0)`;
  elBall.innerHTML = ``;
  elBall.appendChild(elRndBall);
};

export function closeUILoadingModal(forced) {
  let el = $(`#ui-modal-loading`);
  if (forced) {
    el.style.opacity = 0.0;
    el.style.display = "none";
    return;
  }
  setTimeout(() => el.style.opacity = 0.0, 10);
  setTimeout(() => {
    if (parseFloat(el.style.opacity) <= 0) {
      el.style.display = "none";
    }
  }, 210);
};

export function setUILoadingModalTitleColor(color) {
  $(`#ui-modal-loading-title`).style.color = color;
  $(`#ui-modal-loading-title-bottom`).style.color = color;
};

export function setUILoadingModalTitle(msg) {
  msg = msg || ``;
  $(`#ui-modal-loading-title`).innerHTML = msg;
};

export function setUILoadingModalTitleBottom(msg) {
  msg = msg || ``;
  $(`#ui-modal-loading-title-bottom`).innerHTML = msg;
};
