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

export default class GameServer {
  constructor() {
    this.tickets = {};
    return new Promise(resolve => {
      this.createHTTPConnection().then(() => {
        console.log(`[GameServer] => 127.0.0.1:${CFG.GAME_SERVER_HTTP_PORT}`);
        resolve(this);
      });
    });
  }
};

GameServer.prototype.createHTTPConnection = function() {
  return new Promise(resolve => {
    http.createServer((req, resp) => {
      this.processHTTPRequest(req, resp);
    }).listen(CFG.GAME_SERVER_HTTP_PORT);
    console.log(`[GameServer] HTTP connection created`);
    resolve();
  });
};

GameServer.prototype.processHTTPRequest = function(req, resp) {
  let queries = url.parse(req.url, true).query;
  if (queries.cmd) {
    this.processHTTPRequestQuery(queries, req, resp);
    return;
  }
  // nothing to process
  send404(resp);
};

GameServer.prototype.processHTTPRequestQuery = function(queries, req, resp) {
  resp.setHeader(`Access-Control-Allow-Origin`, `127.0.0.1`);
  resp.setHeader(`Access-Control-Allow-Methods`, `GET`);
  resp.setHeader(`Access-Control-Allow-Headers`, `X-Requested-With,content-type`);
  let cmd = queries.cmd;
  switch (cmd) {
    case "CREATE_SESSION": {
      // only allow access from local network
      if (getIPFromRequest(req) !== `::ffff:127.0.0.1`) {
        send404(resp);
        return;
      }
      let data = JSON.parse(new Buffer(queries.data, "base64").toString());
      this.tickets[data.ticket] = data;
      resp.write(`OK`);
    } break;
    default:
      resp.writeHead(404, CFG.HTTP_SERVER_RESP_TYPE);
    break;
  };
  resp.end();
};
