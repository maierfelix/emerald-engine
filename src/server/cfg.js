export const HTTP_SERVER_RESP_TYPE = { "Content-Type": "text/plain" };

export const TS_SERVER_TILESET_DIR = `./data/tilesets/`;
export const TS_SERVER_PNG_MAGIC_HEADER = `data:image/png;base64,`;

export const TS_SERVER_HTTP_PORT = 9000;
export const LOGIN_SERVER_HTTP_PORT = 9001;
export const GAME_SERVER_HTTP_PORT = 9002;

export const GAME_SERVER_WS_PORT = 9003;

export const LOGIN_SERVER_MYSQL = {
  HOST: `127.0.0.1`,
  DB: `emerald-engine`,
  USER: `root`,
  PASS: `root`,
  PORT: 3306
};

export const LOGIN_SERVER_USERNAME = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 32
};

export const LOGIN_SERVER_PASSWORD = {
  MIN_LENGTH: 32,
  MAX_LENGTH: 32
};

export const TS_SERVER_TS_LIST_REFRESH = 1e3 * (30 * 60); // 30min

export const LOGIN_SERVER_SESSION_TIMEOUT = 1e3 * (5); // 5s
export const LOGIN_SERVER_TICKET_DURATION = 1e3 * (60 * 60); // 60min
export const LOGIN_SERVER_TICKER_TICKET_TIMEOUTS = 1e3 * (1 * 60); // 1min
