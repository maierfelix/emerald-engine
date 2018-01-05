import * as CFG from "../cfg";

import {
  $,
  fs,
  assert
} from "../utils";

import {
  showLoadingModal,
  closeLoadingModal,
  setLoadingModalTitle
} from "../screens";

import Map from "./map/index";
import { EntityPlugin } from "./plugin";

export function setup() {
  this.loadStorageSettings();
  this.addListeners();
  this.resize(window.innerWidth, window.innerHeight);
  this.setUIMode("ts");
  //this.setUIObjMode(0);
  this.setUIEncounterMode(0);
  this.setUIActiveTilesetLayer(1);
  this.setUIActiveEditMode(CFG.ENGINE_TS_EDIT.PENCIL);
  this.setupPlugins().then(() => {
    this.loadDefaultMap();
  });
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

export function setupPlugins() {
  return new Promise(resolve => {
    this.loadPlugins().then(() => {
      setLoadingModalTitle(`Instantiating plugins...`);
      setTimeout(() => {
        this.processEntityPlugins().then(() => {
          closeLoadingModal();
          resolve();
        });
      }, 100);
    });
  });
};

export function processEntityPlugins() {
  return new Promise(resolve => {
    let entities = this.plugins.entities;
    for (let ii = 0; ii < entities.length; ++ii) {
      let entity = entities[ii];
      this.addUIObjectTypeItem(entity.name);
      this.addUIObjectTypeMenu(entity);
    };
    resolve();
  });
};

export function loadPlugins() {
  showLoadingModal(this.rom, `Resolving plugins...`);
  return new Promise(resolve => {
    this.loadEntityPlugins().then(entities => {
      this.plugins.entities = entities;
      resolve();
    });
  });
};

export function loadEntityPlugins() {
  return new Promise(resolve => {
    let path = CFG.ENGINE_PLUGIN_ENTITY_PATH;
    let entities = [];
    fs.readdir(path, (err, files) => {
      let count = 0;
      files.map(name => {
        let dir = path + name + "/";
        let jsPath = dir + "index.js";
        let htmlPath = dir + "index.html";
        fs.readFile(jsPath, "utf-8", (err, jsData) => {
          fs.readFile(htmlPath, "utf-8", (err, htmlData) => {
            try {
              let entity = new EntityPlugin(this, name, jsData, htmlData);
              entities.push(entity);
            } catch (e) {
              console.error(e);
            }
            if (++count >= files.length) resolve(entities);
          });
        });
      });
    });
  });
};
