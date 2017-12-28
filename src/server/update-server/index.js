import fs from "fs";
import url from "url";
import path from "path";
import http from "http";

import * as CFG from "../cfg";

import {
  send404,
  sendObject,
  sendInvalid,
  validEmail,
  validUsername,
  validPassword,
  getIPFromRequest
} from "../utils";

export default class UpdateServer {
  constructor() {
    this.cache = {
      LATEST_VERSION: ``
    };
    return new Promise(resolve => {
      http.createServer((req, resp) => {
        this.processHTTPRequest(req, resp);
      }).listen(CFG.UPDATE_SERVER_HTTP_PORT);
      console.log(`[UpdateServer] => HTTP connection created`);
      console.log(`[UpdateServer] => 127.0.0.1:${CFG.UPDATE_SERVER_HTTP_PORT}`);
      resolve(this);
    });
  }
};

UpdateServer.prototype.processHTTPRequest = function(req, resp) {
  let queries = url.parse(req.url, true).query;
  if (queries.cmd) {
    return this.processHTTPRequestQuery(queries, resp);
  }
  // nothing to process
  send404(resp);
};

UpdateServer.prototype.processHTTPRequestQuery = function(queries, resp) {
  resp.setHeader(`Access-Control-Allow-Origin`, `http://localhost`);
  resp.setHeader(`Access-Control-Allow-Methods`, `GET`);
  resp.setHeader(`Access-Control-Allow-Headers`, `X-Requested-With,content-type`);
  let cmd = queries.cmd;
  switch (cmd) {
    case "GET_LATEST_VERSION":
      return this.processHTTPLatestVersionRequest(queries, resp);
    case "GET_UPDATE":
      return this.processHTTPUpdateRequest(queries, resp);
    default:
      resp.writeHead(404, CFG.HTTP_SERVER_RESP_TYPE);
    break;
  };
};

UpdateServer.prototype.processHTTPLatestVersionRequest = function(queries, resp) {
  let pkg = require(process.cwd() + `/package.json`);
  resp.write(pkg.version);
  resp.end();
};

UpdateServer.prototype.processHTTPUpdateRequest = function(queries, resp) {
  let version = path.basename(queries.version);
  let loc = process.cwd() + `/data/updates/${version}.exe`;
  fs.exists(loc, exists => {
    if (exists) {
      resp.write(fs.readFileSync(loc));
      resp.end();
    } else {
      send404(resp);
    }
  });
};
