import * as CFG from "../cfg";

import {
  $,
  MD5,
  GET
} from "../utils";

import Map from "./map/index";

export function setup() {
  this.addListeners();
  this.resize();
  this.setUIMode("ts");
  this.setUIObjMode(0);
  this.setUIEncounterMode(0);
  this.setUIActiveTilesetLayer(1);
  this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.PENCIL);
  this.loadDefaultMap();
};

export function loadDefaultMap() {
  this.loadTilesetBundleFromServer("dawn").then(bundle => {
    this.useTilesetBundle(bundle);
    this.loadMapFromServer("littleroot-town").then(map => {
      this.currentMap = map;
      this.setUIActiveMap(map);
      this.initUI();
      this.useTilesetFromBundleByIndex(bundle, $(`#engine-ui-cts-subts`).childNodes.length - 1);
    });
  });
};
