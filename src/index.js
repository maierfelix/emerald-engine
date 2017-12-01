import {
  $,
  MD5,
  GET,
  readBinaryFile,
  readCachedFile,
  loginIntoServer
} from "./utils";

import {
  showInitScreen,
  showLoadingModal,
  closeLoadingModal,
  showROMInputDialog,
  setLoadingModalTitle,
  setLoadingModalBottom,
  setLoadingModalTitleColor
} from "./screens/index";

import * as CFG from "./cfg";

import Rom from "./rom/";
import MapEditor from "./engine/";
import ROMTilesetEditor from "./rom-ts-editor/"
import TerrainGenerator from "./terrain-generator/";

// check browser compatibility
console.assert(
  (typeof Worker !== "undefined") &&
  (typeof FileReader !== "undefined") &&
  (typeof IDBDatabase !== "undefined") &&
  (typeof WebGLRenderingContext !== "undefined")
);

console.clear();

class Engine {
  constructor() {
    this.mode = null;
    this.init();
  }
};

Engine.prototype.getModeByAdressBar = function() {
  let mode = null;
  location.search.split("?").map((search) => {
    let entry = search.split("=");
    let name = entry[0];
    let value = entry[1];
    if (!name || !value) return;
    mode = value;
  });
  return mode;
};

Engine.prototype.init = function() {
  this.mode = this.getModeByAdressBar();
  readCachedFile("rom.gba")
  .then((obj) => {
    let { db, result, cached } = obj;
    if (!cached) {
      showROMInputDialog(db).then(buffer => this.initStage(db, buffer));
    } else {
      this.initStage(db, result);
    }
  });
};

Engine.prototype.setupInstance = function(login) {
  let instance = null;
  switch (this.mode) {
    case "terrain-generator":
      instance = new TerrainGenerator(this.rom);
    break;
    case "rom-tileset-editor":
      instance = new ROMTilesetEditor(this.rom, 0, 9);
    break;
    case "map-editor":
      instance = new MapEditor(this.rom, login);
    break;
  };
  if (!instance) {
    console.warn(`No active instance`);
    return;
  }
  console.log(instance);
  this.instance = instance;
  (function draw() {
    requestAnimationFrame(draw);
    instance.draw();
  })();
};

Engine.prototype.showInitScreen = function() {
  return new Promise(resolve => {
    showInitScreen(this).then(result => {
      if (result.action === "LOGIN") {
        let login = result.data;
        showLoadingModal(this.rom, `Authenticating...`);
        setTimeout(() => {
          loginIntoServer(login).then((result) => {
            if (result) {
              localStorage.setItem("emerald-user", login.user);
              setLoadingModalTitle(`Loading...`);
              setTimeout(() => {
                $("#ui-init-screen").style.display = "none";
                document.body.style.backgroundImage = ``;
                closeLoadingModal();
                resolve(result);
              }, 500);
            } else {
              setLoadingModalTitleColor(CFG.ENGINE_UI_COLORS.ERROR);
              setLoadingModalTitle(`Username or password is incorrect!`);
              setLoadingModalBottom(`Please try logging in again.`);
              setTimeout(() => {
                closeLoadingModal();
                this.showInitScreen().then(resolve);
              }, 1500);
            }
          });
        }, 500);
      }
    });
  });
};

Engine.prototype.initStage = function(db, buffer) {
  new Rom(buffer, { debug: () => {} })
  .then((rom) => {
    this.rom = rom;
    this.showInitScreen().then(login => {
      this.setupInstance(login);
    });
  })
  .catch((e) => {
    console.error(e);
    console.warn(`ROM file is invalid or broken!`);
    let tra = db.transaction(["ROMData"], "readwrite");
    tra.objectStore("ROMData").delete("key");
    init();
  });
};

let engine = new Engine();
