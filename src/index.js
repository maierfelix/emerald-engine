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
  isLoadingModalActive,
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

Engine.prototype.initSessionTicker = function() {
  let session = this.session;
  let query = CFG.ENGINE_LOGIN_SERVER_LOC + `/?cmd=PING&username=${session.user}&sessionId=${session.id}`;
  clearInterval(this.ppTimer);
  this.ppTimer = setInterval(() => {
    GET(query).then(result => {
      if (this.session.isFixing) return;
      if (this.session.invalid) {
        this.session.isFixing = true;
        this.reAuthenticateToServer();
      }
      if (result === null) {
        if (!isLoadingModalActive()) {
          showLoadingModal(this.rom, `Connection lost!`);
          setLoadingModalBottom(`Trying to reconnect...`);
          this.session.invalid = true;
        }
      } else {
        let json = JSON.parse(result);
        if (json.status === `SESSION_INVALID`) {
          this.session.invalid = true;
          if (!isLoadingModalActive()) {
            showLoadingModal(this.rom, `Session timeout!`);
            setLoadingModalBottom(`Authenticating...`);
            this.reAuthenticateToServer();
          }
        } else {
          if (isLoadingModalActive()) closeLoadingModal();
        }
      }
    });
  }, CFG.ENGINE_SESSION_TIMEOUT);
};

Engine.prototype.reAuthenticateToServer = function() {
  setLoadingModalTitle(`Reauthenticating...`);
  this.loginIntoServer(this.session).then(json => {
    if (json && json.id) {
      this.session = json;
      this.instance.session = json;
      if (isLoadingModalActive()) closeLoadingModal();
    } else {
      showLoadingModal(this.rom, `Failed to authenticate!`);
      setTimeout(() => {
        this.reAuthenticateToServer();
      }, CFG.ENGINE_INIT_SCREEN_ERROR_DELAY * 2.5);
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
      instance = new MapEditor(this);
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

Engine.prototype.loginIntoServer = function(login) {
  let query = CFG.ENGINE_LOGIN_SERVER_LOC + `/?cmd=LOGIN&username=${login.user}&password=${login.pass}`;
  return new Promise((resolve, reject) => {
    GET_JSON(query).then(json => {
      // impossible to contact the server
      if (!json) return resolve(null);
      if (json && json.kind === "STATUS" && json.msg === "CREATE_SESSION_TICKET") {
        let sessionId = json.data;
        let session = {
          user: login.user,
          pass: login.pass,
          id: sessionId
        };
        this.session = session;
        this.initSessionTicker();
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
      // impossible to contact the server
      if (!json) return resolve(null);
      if (json.kind === "STATUS" && json.msg === "REGISTRATION_SUCCESSFUL") {
        let sessionId = json.data;
        let session = {
          user: login.user,
          pass: login.pass,
          id: json.id
        };
        this.session = session;
        this.initSessionTicker();
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

Engine.prototype.showInitScreen = function() {
  return new Promise(resolve => {
    showInitScreen(this).then(result => {
      if (result.action === "LOGIN") {
        let login = result.data;
        showLoadingModal(this.rom, `Authenticating...`);
        setTimeout(() => {
          this.loginIntoServer(login).then(json => {
            if (!json) {
              closeLoadingModal();
              return this.showInitScreen().then(resolve);
            }
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
            if (!json) {
              closeLoadingModal();
              return this.showInitScreen().then(resolve);
            }
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

let engine = new Engine();
