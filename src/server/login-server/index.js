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
  sendInvalid,
  validEmail,
  validUsername,
  validPassword
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
      this.promptSecretKey().then(() => {
        this.createMySQLConnection().then(() => {
          this.createHTTPConnection().then(() => {
            console.log(`[LoginServer] => 127.0.0.1:${CFG.LOGIN_SERVER_HTTP_PORT}`);
            resolve(this);
          });
        });
      });
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
      console.log(`[LoginServer] ${ticket.user} timed out!`);
      tickets.splice(ii, 1);
    }
  };
};

LoginServer.prototype.isActiveSession = function(user, pass, ticket) {
  return new Promise(resolve => {
    this.isUserRegistered(user, pass).then((registered) => {
      let isValid = registered && this.isActiveSessionTicket(ticket);
      resolve(isValid);
    });
  });
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
    prompt.message = `[LoginServer] SECRET KEY:`;
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
    this.processHTTPRequestQuery(queries, resp);
    return;
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
  if (sessionTicket !== null) sessionTicket.resetTimeout();
  resp.write("");
  resp.end();
};

LoginServer.prototype.processHTTPLoginRequest = function(queries, resp) {
  let user = queries.username;
  let pass = queries.password;
  // validation failed, send 404
  if (!validUsername(user) || !validPassword(pass)) return sendInvalid(resp);
  let query = `
    SELECT * FROM users
    WHERE username=? AND password=?
  `;
  this.isUserRegistered(user, pass).then((registered) => {
    // user is not registered, abort
    if (!registered) return sendInvalid(resp);
    // user is already connected, abort
    if (this.isUserAlreadyConnected(user)) return sendInvalid(resp);
    // clear all previous tickets
    this.removeExistingTicketsByUsername(user);
    // use an earlier active ticket
    // generate a unique session ticket
    let ticket = this.createSessionTicket(user);
    //console.log(`${username} logged in [${new Date().getHours()}:${new Date().getMinutes()}]`);
    // register the session ticket on the game server
    this.sendToGameServer(`CREATE_SESSION`, ticket).then((res) => {
      // send the ticket id to the client
      resp.write(ticket.id);
      resp.end();
    });
  });
};

LoginServer.prototype.isUserRegistered = function(user, pass) {
  let query = `
    SELECT * FROM users
    WHERE username=? AND password=?
  `;
  return new Promise(resolve => {
    this.connection.query(query, [user, pass], (err, results, fields) => {
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
  if (!validUsername(user) || !validPassword(pass) || !validEmail(email)) return sendInvalid(resp);
  let query = `
    INSERT INTO users
    (id, username, password, email)
    VALUES (NULL, ?, ?, ?)
  `;
  this.connection.query(query, [user, pass, email], (err, results, fields) => {
    if (err) {
      sendInvalid(resp);
    } else {
      resp.write("Success!");
      resp.end();
    }
  });
};

LoginServer.prototype.createSessionTicket = function(user) {
  let id = uuidv4();
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
