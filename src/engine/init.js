import * as CFG from "../cfg";

import {
  $,
  MD5,
  GET
} from "../utils";

import Map from "./map/index";

export function setup() {
  this.addListeners();
  this.resize(window.innerWidth, window.innerHeight);
  this.setUIMode("ts");
  this.setUIObjMode(0);
  this.setUIEncounterMode(0);
  this.setUIActiveTilesetLayer(1);
  this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.PENCIL);
  this.loadDefaultMap();
};

export function loadDefaultMap() {
  this.loadWorldFromServer("littleroot-town").then(() => {
    this.setUIActiveMap(this.maps[this.maps.length - 1]);
    this.loadTilesetBundleFromServer("dawn").then(bundle => {
      this.useTilesetBundle(bundle);
      this.initUI();
      this.useTilesetFromBundleByIndex(bundle, $(`#engine-ui-cts-subts`).childNodes.length - 1);
      this.setUIActiveMap(this.maps[0]);
    });
  });
};
