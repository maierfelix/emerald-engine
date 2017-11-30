import fs from "fs";
import url from "url";
import http from "http";

import * as CFG from "../cfg";

export default class TilesetServer {
  constructor() {
    this.tilesets = {};
    this.tilesetGraphics = {};
    this.cache = {
      TILESETS: {},
      TILESET_LIST: ``
    };
    this.init();
  }
  init() {
    console.log(`TilesetServer running at => 127.0.0.1:${CFG.TS_SERVER_PORT}`);
    console.log(`CTRL + C to shutdown`);
    this.initTickers();
    this.refreshTilesetList();
    http.createServer((req, resp) => {
      this.processRequest(req, resp);
    }).listen(CFG.TS_SERVER_PORT);
  }
  initTickers() {
    setInterval(() => this.refreshTilesetList(), CFG.TS_SERVER_TS_LIST_REFRESH);
  }
  processRequest(req, resp) {
    let queries = url.parse(req.url, true).query;
    for (let key in queries) {
      if (key === "cmd") {
        this.processRequestCommand(queries[key], resp);
        return;
      }
    };
    // nothing to process
    resp.writeHead(404, CFG.TS_SERVER_RESP_TYPE);
    resp.end();
  }
  processRequestCommand(query, resp) {
    resp.setHeader(`Access-Control-Allow-Origin`, `http://localhost`);
    resp.setHeader(`Access-Control-Allow-Methods`, `GET`);
    resp.setHeader(`Access-Control-Allow-Headers`, `X-Requested-With,content-type`);
    let index = query.lastIndexOf(":");
    let cmd = query.substr(0, index > 0 ? index : query.length);
    let value = index > 0 ? query.substr(index + 1, query.length) : ``;
    switch (cmd) {
      case "GET_TILESET_LIST":
        resp.write(this.getTilesetList());
      break;
      case "GET_TILESET": {
        if (index > 0 && value.length) resp.write(this.getTileset(value));
      }
      break;
      default:
        resp.write(`Invalid Command!`);
      break;
    };
    resp.end();
  }
  refreshTilesetList() {
    console.log(`Refreshing tileset list...`);
    // JSON FILES
    let files = fs.readdirSync(CFG.TS_SERVER_TILESET_DIR);
    let names = [];
    files.map(file => {
      let ext = file.substr(file.lastIndexOf(".") + 1, file.length);
      let name = file.substr(0, file.lastIndexOf("."));
      if (ext === "json") names.push(name);
    });
    let count = 0;
    let bundles = {};
    names.map(file => {
      let path = CFG.TS_SERVER_TILESET_DIR + file + ".json";
      // FILE DATA
      let data = fs.readFileSync(path);
      let stats = fs.statSync(path);
      // allocate tileset object
      let json = JSON.parse(data);
      let bundle = bundles[file] = json;
      bundle.tilesets = [];
      bundle.lastModified = new Date(stats.mtime).getTime();
      // allocate tileset graphic space
      this.tilesetGraphics[file] = {};
      // TILESET FILES
      let files = fs.readdirSync(CFG.TS_SERVER_TILESET_DIR + file + "/");
      files.map(file => {
        let ext = file.substr(file.lastIndexOf(".") + 1, file.length);
        let name = file.substr(0, file.lastIndexOf("."));
        if (ext === "png") bundle.tilesets.push(name);
      });
      bundles[file] = bundle;
      bundle.tilesets.map((ts, index) => {
        let data = fs.readFileSync(CFG.TS_SERVER_TILESET_DIR + file + "/" + ts + ".png").toString("base64");
        this.tilesetGraphics[file][ts] = CFG.TS_SERVER_PNG_MAGIC_HEADER + data;
      });
    });
    this.tilesets = bundles;
    this.refreshTilesetListCache(bundles);
  }
  refreshTilesetListCache(obj) {
    this.cache.TILESET_LIST = ``;
    let bundles = JSON.parse(JSON.stringify(obj));
    console.log(`Refreshing tileset list cache...`);
    for (let bnd in bundles) {
      let bundle = bundles[bnd];
      let json = {};
      bundle.tilesets.map(ts => {
        json[ts] = this.tilesetGraphics[bnd][ts];
      });
      this.cache.TILESETS[bnd] = JSON.stringify(json);
    };
    this.cache.TILESET_LIST = JSON.stringify(obj);
  }
  getTilesetList() {
    return this.cache.TILESET_LIST;
  }
  getTileset(name) {
    let cache = this.cache.TILESETS;
    if (cache.hasOwnProperty(name)) {
      return cache[name];
    }
    return ``;
  }
  addTileset() {

  }
  removeTileset() {

  }
};
