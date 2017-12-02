import {
  $,
  MD5,
  GET,
  GET_JSON,
  readBinaryFile,
  readCachedFile
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

import SERVER_MSG from "./server-msg";

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
    this.ppTimer = null;
    this.session = null;
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

Engine.prototype.initPingPong = function() {
  let session = this.session;
  let query = CFG.ENGINE_LOGIN_SERVER_LOC + `/?cmd=PING&username=${session.user}&sessionId=${session.id}`;
  this.ppTimer = setInterval(() => {
    GET(query);
  }, CFG.ENGINE_SESSION_TIMEOUT);
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
          this.loginIntoServer(login).then(json => {
            if (json.id) {
              localStorage.setItem("emerald-user", login.user);
              setLoadingModalTitle(`Loading...`);
              setTimeout(() => {
                $("#ui-init-screen").style.display = "none";
                document.body.style.backgroundImage = ``;
                closeLoadingModal();
                resolve(json);
              }, CFG.ENGINE_INIT_SCREEN_SUCCESS_DELAY);
            } else {
              setLoadingModalTitleColor(CFG.ENGINE_UI_COLORS.ERROR);
              setLoadingModalTitle(SERVER_MSG[json.kind][json.msg]);
              setTimeout(() => {
                closeLoadingModal();
                this.showInitScreen().then(resolve);
              }, CFG.ENGINE_INIT_SCREEN_ERROR_DELAY);
            }
          });
        }, CFG.ENGINE_INIT_SCREEN_ACTION_DELAY);
      }
      else if (result.action === "REGISTER") {
        let login = result.data;
        showLoadingModal(this.rom, `Authenticating...`);
        setTimeout(() => {
          this.registerAccountIntoServer(login).then(json => {
            if (json.id) {
              setLoadingModalTitle(`Account was created successfully!`);
              setTimeout(() => {
                $("#ui-init-screen").style.display = "none";
                document.body.style.backgroundImage = ``;
                closeLoadingModal();
                resolve(json);
              }, CFG.ENGINE_INIT_SCREEN_SUCCESS_DELAY);
            } else {
              setLoadingModalTitleColor(CFG.ENGINE_UI_COLORS.ERROR);
              setLoadingModalTitle(SERVER_MSG[json.kind][json.msg]);
              setTimeout(() => {
                closeLoadingModal();
                this.showInitScreen().then(resolve);
              }, CFG.ENGINE_INIT_SCREEN_ERROR_DELAY);
            }
          });
        }, CFG.ENGINE_INIT_SCREEN_ACTION_DELAY);
      }
    });
  });
};

Engine.prototype.loginIntoServer = function(login) {
  let query = CFG.ENGINE_LOGIN_SERVER_LOC + `/?cmd=LOGIN&username=${login.user}&password=${login.pass}`;
  return new Promise(resolve => {
    GET_JSON(query).then(json => {
      clearInterval(this.ppTimer);
      if (json.kind === "STATUS" && json.msg === "CREATE_SESSION_TICKET") {
        let sessionId = json.data;
        let session = {
          user: login.user,
          pass: login.pass,
          id: sessionId
        };
        this.session = session;
        this.initPingPong();
        resolve(session);
      } else {
        resolve(json);
      }
    });
  });
};

Engine.prototype.registerAccountIntoServer = function(login) {
  let query = CFG.ENGINE_LOGIN_SERVER_LOC + `/?cmd=REGISTER&username=${login.user}&password=${login.pass}&email=rofl@rofl.com`;
  return new Promise(resolve => {
    GET_JSON(query).then(json => {
      clearInterval(this.ppTimer);
      if (json.kind === "STATUS" && json.msg === "REGISTRATION_SUCCESSFUL") {
        let sessionId = json.data;
        let session = {
          user: login.user,
          pass: login.pass,
          id: json.id
        };
        this.session = session;
        this.initPingPong();
        resolve(session);
      } else {
        resolve(json);
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
