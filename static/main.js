"use strict";

let options = {
  frame: false,
  icon: "./static/img/emerald-engine.png"
};

nw.Window.open("static/index.html?mode=map-editor", options, (win) => {
  win.title = require("../package.json").title;
  win.icon = options.icon;
  win.width = 1280;
  win.height = 640;
  win.showDevTools();
  win.setMinimumSize(1280, 640);
  win.focus();
  //win.maximize();
});
