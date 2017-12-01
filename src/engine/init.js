import * as CFG from "../cfg";

import {
  $,
  MD5,
  GET
} from "../utils";

import Map from "./map/index";

export function setup(login) {
  this.addListeners();
  this.resize();
  this.setUIMode("ts");
  this.setUIObjMode(0);
  this.setUIEncounterMode(0);
  this.setUIActiveTilesetLayer(1);
  console.log(login);
  this.loadDefaultMap();
};

export function loadDefaultMap() {
  this.loadTilesetBundleFromServer("dawn").then(tileset => {
    this.useTilesetBundle(tileset);
    this.loadMapFromServer("littleroot-town").then(map => {
      this.currentMap = map;
      this.initUI();
    });
  });
};
