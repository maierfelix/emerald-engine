import * as CFG from "../../cfg";

import {
  $,
  GET,
  assert,
  parseHTMLString,
  addSessionToQuery,
} from "../../utils";

import {
  showLoadingModal,
  closeLoadingModal
} from "../../screens";

export function showUIModal(kind) {
  let el = $(`#ui-modal-${kind.toLowerCase()}`);
  el.style.display = "flex";
  el.style.opacity = 0.0;
  this.modalMode = el;
  switch (kind) {
    case "TS_BUNDLE": {
      let target = el.children[0];
      showLoadingModal(this.rom, `Resolving Bundle List...`);
      let query = CFG.ENGINE_TS_SERVER_LOC + `/?cmd=GET_BUNDLE_LIST`;
      GET(addSessionToQuery(query, this.session), CFG.ENGINE_BUNDLE_PICK_DELAY).then(res => {
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
  return parseHTMLString(html);
};
