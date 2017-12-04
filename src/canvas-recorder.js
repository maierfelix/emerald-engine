import {
  assert,
  createCanvasBuffer,
  createImageFromCanvas
} from "./utils";

export default class CanvasRecorder {
  constructor(canvas, fps = 30, scale = 0.25) {
    assert(canvas instanceof HTMLCanvasElement);
    this.canvas = canvas;
    this.frames = [];
    this.paused = true;
    this.fps = fps;
    this.scale = scale;
    this.init();
  }
};

CanvasRecorder.prototype.init = function() {
  let self = this;
  (function tick() {
    if (self.fps === 60) requestAnimationFrame(tick);
    else setTimeout(tick, 1e3 / self.fps)
    self.tick();
  })();
};

CanvasRecorder.prototype.tick = function() {
  if (!this.paused) this.addFrame();
};

CanvasRecorder.prototype.addFrame = function() {
  let source = this.canvas;
  let buffer = createCanvasBuffer(
    source.width * this.scale,
    source.height * this.scale
  ).ctx;
  buffer.drawImage(
    source,
    0, 0,
    source.width, source.height,
    0, 0,
    source.width * this.scale, source.height * this.scale
  );
  this.frames.push(buffer.canvas);
};

CanvasRecorder.prototype.start = function() {
  this.paused = false;
};

CanvasRecorder.prototype.pause = function() {
  this.paused = true;
};

CanvasRecorder.prototype.reset = function() {
  this.frames = [];
};

CanvasRecorder.prototype.save = function() {
  let count = 0;
  let images = [];
  return new Promise(resolve => {
    this.frames.map(frame => {
      createImageFromCanvas(frame).then(img => {
        images.push(img);
        if (++count >= this.frames.length) {
          resolve(images);
        }
      });
    });
  });
};
