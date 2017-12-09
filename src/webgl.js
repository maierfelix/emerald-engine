import * as CFG from "./cfg";

import {
  $,
  assert,
  createCanvasBuffer
} from "./utils";

import {
  VERTEX,
  FRAGMENT
} from "./webgl-shaders";

export default class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = this.getGLContext(canvas);
    this.alpha = 1.0;
    this.GLTile = createCanvasBuffer(CFG.BLOCK_SIZE, CFG.BLOCK_SIZE).ctx;
    this.GLBuffers = {};
    this.GLVertices = {};
    this.GLLocs = {};
    this.GLProgram = null;
    this.init();
  }
};

WebGLRenderer.prototype.init = function() {
  let gl = this.gl;
  this.GLProgram = this.createProgram();
  gl.useProgram(this.GLProgram);
  this.GLLocs.uScale = gl.getUniformLocation(this.GLProgram, "uScale");
  this.GLLocs.uOpacity = gl.getUniformLocation(this.GLProgram, "uOpacity");
  this.GLLocs.uObjScale = gl.getUniformLocation(this.GLProgram, "uObjScale");
};

WebGLRenderer.prototype.getGLContext = function(canvas) {
  let opts = {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    stencil: false,
    preserveDrawingBuffer: false
  };
  return canvas.getContext("webgl", opts);
};

WebGLRenderer.prototype.resize = function(width, height) {
  let gl = this.gl;
  this.width = width;
  this.height = height;
  this.canvas.width = width;
  this.canvas.height = height;
  gl.viewport(0, 0, width, height);
  // update shader scales
  gl.uniform2f(this.GLLocs.uScale, width, height);
  gl.uniform1f(this.GLLocs.uOpacity, 1.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
};

WebGLRenderer.prototype.clear = function() {
  let gl = this.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
};

WebGLRenderer.prototype.createProgram = function() {
  let gl = this.gl;
  let size = CFG.ENGINE_WEBGL_TEX_LIMIT;
  let program = gl.createProgram();
  let vShader = gl.createShader(gl.VERTEX_SHADER);
  let fShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vShader, VERTEX); gl.compileShader(vShader);
  gl.shaderSource(fShader, FRAGMENT); gl.compileShader(fShader);

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  let buffers = this.GLBuffers;
  let vertices = this.GLVertices;
  let idxs = vertices.idx = new Float32Array(size * 6);
  vertices.position = new Float32Array(size * 12);

  buffers.idx = gl.createBuffer();
  buffers.position = gl.createBuffer();
  for (let ii = 0; ii < size; ii++) {
    idxs[6 * ii + 0] = 0;
    idxs[6 * ii + 1] = 1;
    idxs[6 * ii + 2] = 2;
    idxs[6 * ii + 3] = 1;
    idxs[6 * ii + 4] = 2;
    idxs[6 * ii + 5] = 3;
  };

  this.setGLAttribute(program, buffers.idx, "aIdx", 1, idxs);
  return program;
};

WebGLRenderer.prototype.drawTexture = function(texture, x, y, width, height) {
  let gl = this.gl;
  let program = this.GLProgram;
  let pos = this.GLVertices.position;
  // update uniforms
  gl.uniform2f(this.GLLocs.uObjScale, width, height);
  gl.uniform1f(this.GLLocs.uOpacity, this.alpha);
  for (let ii = 0; ii < 6; ++ii) {
    pos[2 * ii + 0] = x + (width / 2);
    pos[2 * ii + 1] = y + (height / 2);
  };
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  this.setGLAttribute(program, this.GLBuffers.position, "aObjCen", 2, pos);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

WebGLRenderer.prototype.createTexture = function(width, height) {
  let buffer = createCanvasBuffer(width, height).ctx;
  let texture = this.createGLTextureFromCanvas(buffer.canvas);
  buffer = null;
  return texture;
};

WebGLRenderer.prototype.freeTexture = function(texture) {
  let gl = this.gl;
  gl.deleteTexture(texture);
};

WebGLRenderer.prototype.createGLTextureFromCanvas = function(canvas) {
  let gl = this.gl;
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};

WebGLRenderer.prototype.updateGLTextureByCanvas = function(texture, canvas, x, y) {
  let gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

WebGLRenderer.prototype.updateGLTextureByData = function(texture, data, x, y) {
  let gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

WebGLRenderer.prototype.updateGLTextureTileByCanvas = function(texture, canvas, sx, sy, tx, ty) {
  let gl = this.gl;
  let tile = this.GLTile;
  let scale = CFG.BLOCK_SIZE;
  // setup the canvas tile we update from
  tile.clearRect(
    0, 0,
    scale, scale
  );
  tile.drawImage(
    canvas,
    sx, sy,
    scale, scale,
    0, 0,
    scale, scale
  );
  // update the gl texture with our tile canvas
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, tx, ty, gl.RGBA, gl.UNSIGNED_BYTE, tile.canvas);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

WebGLRenderer.prototype.setGLAttribute = function(program, buffer, name, size, values) {
  let gl = this.gl;
  let attr = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attr);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 0, 0);
};
