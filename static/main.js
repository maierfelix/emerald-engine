"use strict";

let options = {
  frame: false,
  title: require("../package.json").title,
  icon: "./static/img/emerald-engine.png",
  width: 1280,
  height: 640,
  position: "center"
};

let win = nw.Window.get();
for (let key in options) {
  win[key] = options[key];
};
win.showDevTools();
win.setMinimumSize(1280, 640);
win.focus();
//win.maximize();
