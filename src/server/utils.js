import * as CFG from "./cfg";

import {
  isAlpha,
  isNumber,
  isUmlaut,
  isSharpS,
  isCircumFlex
} from "./char-helpers";

export function isAllowedSpecialChar(cc) {
  return (
    cc === 95  || // _
    isUmlaut() ||
    isSharpS() ||
    isCircumFlex()
  );
};

export function validUsername(username) {
  let length = username.length;
  // validate length
  if (
    length < CFG.LOGIN_SERVER_USERNAME.MIN_LENGTH ||
    length > CFG.LOGIN_SERVER_USERNAME.MAX_LENGTH
  ) return false;
  // validate characters
  for (let ii = 0; ii < length; ++ii) {
    let cc = username.charCodeAt(ii);
    if (!isAlpha(cc) && !isNumber(cc) && !isAllowedSpecialChar(cc)) return false;
  };
  // seems okay
  return true;
};

export function validPassword(password) {
  let length = password.length;
  // validate length
  if (
    length < CFG.LOGIN_SERVER_PASSWORD.MIN_LENGTH ||
    length > CFG.LOGIN_SERVER_PASSWORD.MAX_LENGTH
  ) return false;
  // validate characters
  for (let ii = 0; ii < length; ++ii) {
    let cc = password.charCodeAt(ii);
    if (!isAlpha(cc) && !isNumber(cc)) return false;
  };
  // seems okay
  return true;
};

let rxMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validEmail(email) {
  let length = email.length;
  // validate length
  if (length < 3) return false;
  // vaildate with regex
  return rxMail.test(email);
};

export function getIPFromRequest(req) {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
};

export function send404(resp) {
  resp.writeHead(404, CFG.HTTP_SERVER_RESP_TYPE);
  resp.end();
};

export function sendInvalid(resp) {
  resp.write(``);
  resp.end();
};
