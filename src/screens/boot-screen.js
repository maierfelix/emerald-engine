import * as CFG from "../cfg";

import {
  GET,
  GET_BINARY,
  setCanvasHDPI,
  setImageSmoothing,
  createCanvasBuffer
} from "../utils";

import { version } from "../../package.json";

const fs = require("fs");

export default function(instance) {

  let ctx = createCanvasBuffer(640, 480).ctx;
  let canvas = ctx.canvas;

  let width = 0;
  let height = 0;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    setImageSmoothing(ctx, false);
    setCanvasHDPI(ctx);
  };
  window.onresize = resize;
  resize();
  canvas.style = `
    position: absolute;
    left: 0px;
    top: ${CFG.ENGINE_UI_OFFSET_Y}px;
    width: 100%;
    height: 100%;
    z-index: 999999;
  `;
  document.body.appendChild(canvas);

  let progress = 0;

  let bar = {
    width: 320,
    height: 22
  };

  let ypad = 15;
  let repeatDots = 1;

  let text = `Emerald Engine`.toUpperCase().split("");
  let letters = [];
  let ccAlpha = 0.0;

  let checkForUpdate = false;
  let continueProgress = true;

  let currentMessage = "Checking for Updates";

  (function update() {
    if (letters.length <= text.length) {
      letters.push(text[letters.length - 1]);
    } else {
      ccAlpha += 0.1;
    }
    setTimeout(update, 1e3 / 14);
  })();

  function checkUpdate() {
    let query = CFG.ENGINE_UPDATE_SERVER_LOC + `/?cmd=GET_LATEST_VERSION`;
    GET(query).then(latestVersion => {
      if (latestVersion > version) {
        currentMessage = "There is an update available!";
        let query = CFG.ENGINE_UPDATE_SERVER_LOC + `/?cmd=GET_UPDATE&version=${latestVersion}`;
        GET_BINARY(query).then(data => {
          currentMessage = "Installing update";
          setTimeout(() => {
            fs.writeFile(__dirname + "/update.bin", data, (err) => {
              if (err) console.warn(err);
              currentMessage = "Restarting client";
              setTimeout(() => {
                const { spawn } = require("child_process");
                const subprocess = spawn("node", [__dirname + "/update.js"], {
                  detached: true,
                  stdio: "ignore"
                });
                nw.App.quit();
              }, 500);
            });
          }, 1e3);
        });
      } else {
        continueProgress = true;
      }
    });
  };

  (function draw() {
    if (progress <= 100) requestAnimationFrame(draw);
    let msg = letters.join("");
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#212123";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `24px Open sans, sans-serif`;

    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowOffsetX = 1.25; 
    ctx.shadowOffsetY = 1.25; 
    ctx.shadowBlur = 2;

    let msgA = msg.substr(0, 8);
    let msgB = msg.substr(8, msg.length);
    let msgC = atob(`Q3JlYXRlZCBieSBGZWxpeCBNYWllcg==`).toUpperCase();
    let wwA = ctx.measureText(msgA).width;
    let wwB = ctx.measureText(msgB).width;

    ypad = 15;
    ctx.fillStyle = "rgba(40,210,0,0.8)";
    ctx.fillText(
      msgA,
      (width / 2) - ((wwA + wwB) / 2), (height / 2) - 30 - ypad
    );
    ctx.fillStyle = "#fff";
    ctx.fillText(
      msgB,
      (width / 2) - ((wwB / 2) - wwA / 2), (height / 2) - 30 - ypad
    );

    ctx.shadowBlur = 1.5;
    ctx.font = `10px Open sans, sans-serif`;
    let wwC = ctx.measureText(msgC).width;
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.75, ccAlpha)})`;
    ctx.fillText(
      msgC,
      (width / 2) - (wwC / 2), (height / 2) - 2 - ypad
    );
    ctx.font = `12px Open sans, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(
      `Emerald Engine v${version}`,
      6, height - 32
    );

    if (ccAlpha >= 1.5) {
      if (!checkForUpdate && progress >= 20) {
        checkForUpdate = true;
        continueProgress = false;
        checkUpdate();
      }
      ypad = 40;
      if (continueProgress) progress += 1.0;
      ctx.globalAlpha = ccAlpha - 1.5;
      if (continueProgress && progress >= 60) progress += 1.25;
      ctx.fillStyle = "#fff";
      ctx.font = `10px Open sans, sans-serif`;
      let msgBoot = (
        progress <= 30 ? currentMessage :
        (progress > 30 && progress <= 70) ? "Resolving assets" :
        "Booting Engine"
      );
      let ww = ctx.measureText(msgBoot).width;
      ctx.fillText(
        (msgBoot + (".".repeat(repeatDots | 0))).toUpperCase(),
        (width / 2) - (ww / 2), (height / 2) + bar.height + ypad + 10
      );
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(
        (width / 2) - (bar.width / 2),
        (height / 2) - (bar.height / 2) + ypad,
        bar.width,
        bar.height
      );
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        (width / 2) - (bar.width / 2),
        (height / 2) - (bar.height / 2) + ypad,
        progress * (bar.width / 1e2),
        bar.height
      );
      repeatDots = ((repeatDots + 0.1) % 4);
      ccAlpha += 0.05;
      ctx.globalAlpha = 1.0;
    }

  })();

  return new Promise(resolve => {
    let timer = setInterval(function() {
      if (progress >= 100) {
        canvas.parentNode.removeChild(canvas);
        clearInterval(timer);
        resolve();
      }
    });
  });

};
