"use strict";

nw.Window.open("static/index.html?mode=map-editor", { }, (win) => {
  win.width = 1280;
  win.height = 640;
  win.showDevTools();
  win.evalNWBin(null, "dist/bundle.bin");
  win.setMinimumSize(1280, 640);
  win.focus();
  //win.maximize();
});
