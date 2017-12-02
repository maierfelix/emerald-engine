import fs from "fs";
import url from "url";
import http from "http";
import mysql from "mysql";
import prompt from "prompt";

import * as CFG from "../cfg";

import {
  send404,
  getIPFromRequest
} from "../utils";

export default class HTTPServer {
  constructor() {
    return new Promise(resolve => {
      this.createHTTPConnection().then(() => {
        console.log(`[HTTPServer] => 127.0.0.1:${CFG.HTTP_SERVER_HTTP_PORT}`);
        resolve(this);
      });
    });
  }
};

HTTPServer.prototype.createHTTPConnection = function() {
  return new Promise(resolve => {
    http.createServer((req, resp) => {
      this.processHTTPRequest(req, resp);
    }).listen(CFG.HTTP_SERVER_HTTP_PORT);
    console.log(`[HTTPServer] HTTP connection created`);
    resolve();
  });
};

HTTPServer.prototype.processHTTPRequest = function(req, resp) {
  resp.setHeader(`Access-Control-Allow-Origin`, `127.0.0.1`);
  resp.setHeader(`Access-Control-Allow-Methods`, `GET`);
  resp.setHeader(`Access-Control-Allow-Headers`, `X-Requested-With,content-type`);
  resp.write(``);
  resp.end();
};
