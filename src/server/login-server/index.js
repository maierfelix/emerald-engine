import fs from "fs";
import url from "url";
import http from "http";
import mysql from "mysql";
import crypto from "crypto";
import prompt from "prompt";
import uuidv4 from "uuid/v4";

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

let SECRET_KEY = null;

class Ticket {
  constructor(id, user, duration) {
    this.id = id;
    this.user = user;
    this.timeout = 0; // session timeout
    this.duration = duration; // how long the ticket is valid
    this.resetTimeout();
  }
  resetTimeout() {
    this.timeout = +Date.now() + CFG.LOGIN_SERVER_SESSION_TIMEOUT;
  }
};

export default class LoginServer {
  constructor() {
    this.tickets = [];
    return new Promise(resolve => {
      this.initTickers();
      SECRET_KEY = `iDO!MR:vm?#M4ElTg#([_BN'rjgRD"`;
      /*this.promptSecretKey().then(() => {*/
        this.createMySQLConnection().then(() => {
          this.createHTTPConnection().then(() => {
            console.log(`[LoginServer] => 127.0.0.1:${CFG.LOGIN_SERVER_HTTP_PORT}`);
            resolve(this);
          });
        });
      /*});*/
    });
  }
};

LoginServer.prototype.initTickers = function() {
  setInterval(() => {
    this.updateSessionTickets();
  }, CFG.LOGIN_SERVER_TICKER_TICKET_TIMEOUTS);
  setInterval(() => {
    this.updateSessionTimeouts();
  }, 1e3);
};

LoginServer.prototype.updateSessionTickets = function() {
  let now = +Date.now();
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    let sessionDuration = ticket.duration;
    // ticket timed out, remove it
    if (now > sessionDuration) tickets.splice(ii, 1);
  };
};

LoginServer.prototype.updateSessionTimeouts = function() {
  let now = +Date.now();
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    let sessionTimeout = ticket.timeout;
    // session timed out, remove it
    if (now > sessionTimeout) {
      console.log(`[LoginServer] ${ticket.user} timed out`);
      tickets.splice(ii, 1);
    }
  };
};

LoginServer.prototype.createHTTPConnection = function() {
  return new Promise(resolve => {
    http.createServer((req, resp) => {
      this.processHTTPRequest(req, resp);
    }).listen(CFG.LOGIN_SERVER_HTTP_PORT);
    console.log(`[LoginServer] HTTP connection created`);
    resolve();
  });
};

LoginServer.prototype.createMySQLConnection = function() {
  return new Promise(resolve => {
    let connection = mysql.createConnection({
      host: CFG.LOGIN_SERVER_MYSQL.HOST,
      port: CFG.LOGIN_SERVER_MYSQL.PORT,
      user: CFG.LOGIN_SERVER_MYSQL.USER,
      password: CFG.LOGIN_SERVER_MYSQL.PASS,
      database: CFG.LOGIN_SERVER_MYSQL.DB
    });
    connection.connect((err) => {
      if (err) console.log(err);
      else console.log(`[LoginServer] MySQL connection created`);
      this.connection = connection;
      resolve();
    });
  });
};

LoginServer.prototype.promptSecretKey = function() {
  return new Promise(resolve => {
    prompt.start();
    prompt.message = `[LoginServer] ENTER SECRET KEY:`;
    prompt.delimiter = ``;
    prompt.get([{
      name: ` `,
      hidden: true,
      required: true
    }], (err, result) => {
      if (err) console.log(err);
      let key = result[` `];
      if (key.length) SECRET_KEY = key;
      resolve();
    });
  });
};

LoginServer.prototype.processHTTPRequest = function(req, resp) {
  let queries = url.parse(req.url, true).query;
  if (queries.cmd) {
    return this.processHTTPRequestQuery(queries, resp);
  }
  // nothing to process
  send404(resp);
};

LoginServer.prototype.processHTTPRequestQuery = function(queries, resp) {
  resp.setHeader(`Access-Control-Allow-Origin`, `http://localhost`);
  resp.setHeader(`Access-Control-Allow-Methods`, `GET`);
  resp.setHeader(`Access-Control-Allow-Headers`, `X-Requested-With,content-type`);
  let cmd = queries.cmd;
  switch (cmd) {
    case "LOGIN": {
      return this.processHTTPLoginRequest(queries, resp);
    } break;
    case "REGISTER": {
      return this.processHTTPRegistrationRequest(queries, resp);
    } break;
    case "PING":
      return this.processHTTPPingRequest(queries, resp);
    default:
      resp.writeHead(404, CFG.HTTP_SERVER_RESP_TYPE);
    break;
  };
  resp.end();
};

LoginServer.prototype.processHTTPPingRequest = function(queries, resp) {
  let user = queries.username;
  let sessionId = queries.sessionId;
  let sessionTicket = this.getTicketByUsername(user);
  // reset session timeout
  if (sessionTicket !== null) {
    sessionTicket.resetTimeout();
    return sendObject({ status: "SESSION_OK" }, resp);
  }
  // session invalid
  return sendObject({ status: "SESSION_INVALID" }, resp);
};

LoginServer.prototype.processHTTPLoginRequest = function(queries, resp) {
  let user = queries.username;
  let pass = queries.password;
  // validation failed
  if (!validUsername(user) || !validPassword(pass)) {
    return sendObject({ kind: "ERROR", msg: "INVALID_LOGIN" }, resp);
  }
  let query = `
    SELECT * FROM users
    WHERE username=? AND password=?
  `;
  this.isUserRegistered(user, pass).then(registered => {
    // user is not registered, abort
    if (!registered) {
      return sendObject({ kind: "ERROR", msg: "INVALID_LOGIN" }, resp);
    }
    // user is already connected
    if (this.isUserAlreadyConnected(user)) {
      // wait until the maximum session timeout is reached
      // then try again to let the user login
      setTimeout(() => {
        // user can login now
        if (!this.isUserAlreadyConnected(user)) {
          this.sendLoginResponse(user, resp);
        // user is probably trying to connect multiple times
        } else {
          console.log(`[LoginServer] Parallel login detected for ${user}`);
          return sendObject({ kind: "ERROR", msg: "ACCOUNT_IN_USE" }, resp);
        }
      }, CFG.LOGIN_SERVER_SESSION_TIMEOUT - 500);
      return;
    }
    this.sendLoginResponse(user, resp);
  });
};

LoginServer.prototype.sendLoginResponse = function(user, resp) {
  console.log(`[LoginServer] ${user} logged in`);
  // generate a unique session ticket
  let ticket = this.createSessionTicket(user);
  // send the ticket id to the client
  sendObject({ kind: "STATUS", msg: "CREATE_SESSION_TICKET", data: ticket.id }, resp);
};

LoginServer.prototype.isUserRegistered = function(user, pass) {
  let encryPass = this.encryptStringSecretly(pass);
  let query = `
    SELECT * FROM users
    WHERE username=? AND password=?
  `;
  return new Promise(resolve => {
    this.connection.query(query, [user, encryPass], (err, results, fields) => {
      if (err) console.log(err);
      resolve(results.length >= 1);
    });
  });
};

LoginServer.prototype.isUserAlreadyConnected = function(user) {
  let ticket = this.getTicketByUsername(user);
  return ticket !== null;
};

LoginServer.prototype.processHTTPRegistrationRequest = function(queries, resp) {
  let email = queries.email;
  let user = queries.username;
  let pass = queries.password;
  // validate registration data
  if (!validUsername(user)) {
    return sendObject({ kind: "ERROR", msg: "BAD_USERNAME" }, resp);
  }
  if (!validPassword(pass)) {
    return sendObject({ kind: "ERROR", msg: "BAD_PASSWORD" }, resp);
  }
  if (!validEmail(email)) {
    return sendObject({ kind: "ERROR", msg: "BAD_EMAIL" }, resp);
  }
  let encryPass = this.encryptStringSecretly(pass);
  let query = `
    INSERT INTO users
    (id, username, password, email)
    VALUES (NULL, ?, ?, ?)
  `;
  this.connection.query(query, [user, encryPass, email], (err, results, fields) => {
    if (err) {
      return sendObject({ kind: "ERROR", msg: "USERNAME_TAKEN" }, resp);
    }
    console.log(`[LoginServer] ${user} registered`);
    let ticket = this.createSessionTicket(user);
    return sendObject({ kind: "STATUS", msg: "REGISTRATION_SUCCESSFUL", id: ticket.id }, resp);
  });
};

LoginServer.prototype.createSessionTicket = function(user) {
  let id = uuidv4();
  // clear all previous tickets
  this.removeExistingTicketsByUsername(user);
  if (!this.isActiveSessionTicket(id)) {
    let duration = +Date.now() + CFG.LOGIN_SERVER_TICKET_DURATION;
    let ticket = new Ticket(id, user, duration);
    this.tickets.push(ticket);
    return ticket;
  }
  return this.createSessionTicket();
};

LoginServer.prototype.isActiveSessionTicket = function(ticketId) {
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    if (ticket.id === ticketId) return true;
  };
  return false;
};

LoginServer.prototype.getTicketByUsername = function(username) {
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    if (ticket.user === username) return ticket;
  };
  return null;
};

LoginServer.prototype.getTicketById = function(id) {
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    if (ticket.id === id) return ticket;
  };
  return null;
};

LoginServer.prototype.removeExistingTicketsByUsername = function(username) {
  let tickets = this.tickets;
  let length = tickets.length;
  for (let ii = 0; ii < length; ++ii) {
    let ticket = tickets[ii];
    if (ticket.user === username) tickets.splice(ii, 1);
  };
};

LoginServer.prototype.sendToGameServer = function(cmd, data) {
  let json = JSON.stringify(data);
  let buffer = new Buffer(json).toString("base64");
  let options = {
    host: `127.0.0.1`,
    port: CFG.GAME_SERVER_HTTP_PORT,
    path: `/?cmd=${cmd}&data=${buffer}`
  };
  return new Promise(resolve => {
    http.request(options, (resp) => {
      resolve(resp);
    }).end();
  });
};

LoginServer.prototype.encryptStringSecretly = function(str) {
  let cipher = crypto.createCipher(CFG.LOGIN_SERVER_ENCRYPTION_ALGO, SECRET_KEY);
  let crypted = cipher.update(str, "utf-8", "hex");
  crypted += cipher.final("hex");
  return crypted;
};

LoginServer.prototype.decryptStringSecretly = function(str) {
  let decipher = crypto.createDecipher(CFG.LOGIN_SERVER_ENCRYPTION_ALGO, SECRET_KEY);
  let dec = decipher.update(str, "hex", "utf-8");
  dec += decipher.final("utf-8");
  return dec;
};
