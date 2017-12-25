import * as CFG from "../cfg";

import {
  $,
  MD5,
  GET
} from "../utils";

import Map from "./map/index";

export function setup() {
  this.loadStorageSettings();
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
  this.loadWorldFromServer("test").then(() => {
    this.loadTilesetBundleFromServer("dawn").then(bundle => {
      this.useTilesetBundle(bundle);
      this.initUI();
      this.setUIActiveMap(this.maps[0]);
    });
  });
};
