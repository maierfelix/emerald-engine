export const TILE_EDITOR_BG_COLOR = `rgba(87, 87, 87, 1)`;

export const TILESET_DEFAULT_WIDTH = 192;
export const TILESET_DEFAULT_HEIGHT = 2560;

export const TILESET_FINAL_SCALE = 4;
export const TILESET_LAYER_SCALE = 3;

export const TS_MAX_STACK_SIZE = 10;

export const TILE_SIZE = 8;
export const BLOCK_SIZE = TILE_SIZE * 2;
export const TILESET_HORIZONTAL_SIZE = TILESET_DEFAULT_WIDTH / BLOCK_SIZE;

export const PATH_TILE_FIXUPS = `./fixup-tiles.png`;

export const TERRAIN_DEFAULT_WIDTH = 128;
export const TERRAIN_DEFAULT_HEIGHT = 64;

export const TERRAIN_DEFAULT_SEED = 748406574278243;

export const TERRAIN_TILES = {
  NONE: {
    id: -1,
    offset: 9999
  },
  WATER: {
    id: 1,
    offset: 0
  },
  LIGHT_WATER: {
    id: 2,
    offset: 24
  },
  STONE: {
    id: 3,
    offset: 4
  },
  STONE_GRASS: {
    id: 4,
    kind: 3,
    offset: 20
  },
  STONE_SAND: {
    id: 5,
    kind: 3,
    offset: 28
  }
};

export const TERRAIN_SHEET_EDGES = {
  "NSEW":{ x: 1, y: 1 },
  "NW":  { x: 0, y: 0 },
  "N+W": { x: 3, y: 0 },
  "N":   { x: 1, y: 0 },
  "NE":  { x: 2, y: 0 },
  "N+E": { x: 4, y: 0 },
  "E":   { x: 2, y: 1 },
  "SE":  { x: 2, y: 2 },
  "S+E": { x: 4, y: 1 },
  "S":   { x: 1, y: 2 },
  "SW":  { x: 0, y: 2 },
  "S+W": { x: 3, y: 1 },
  "W":   { x: 0, y: 1 }
};

export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

export const ENGINE_DEV_MODE = true;

export const ENGINE_TILESET_SCALE = 1.5;
export const ENGINE_TILESET_SELECT_COLOR = `rgba(255,0,0,1)`;
export const ENGINE_TILESET_AUTOTILE_COLOR = `rgba(240,240,0,1)`;

export const ENGINE_AUTOTILE_WIDTH = 5;
export const ENGINE_AUTOTILE_HEIGHT = 3;

export const ENGINE_BOX_TEXT_COLOR = `rgba(255,255,255,0.625)`;
export const ENGINE_BOX_TYPES = {
  WARP: {
    label: `W`,
    color: [3, 169, 244]
  },
  ENTITY: {
    label: `E`,
    color: [233, 30, 90]
  }
};

export const ENGINE_UI_COLORS = {
  DEFAULT: `rgba(255,255,255,0.8)`,
  ERROR: `rgba(255,128,128,0.8)`
};

export const ENGINE_FILL_PREVIEW_COLOR = `black`;

export const ENGINE_TS_SERVER_LOC = `http://${location.host}:9000`;
export const ENGINE_LOGIN_SERVER_LOC = `http://${location.host}:9001`;

export const ENGINE_SESSION_TIMEOUT = 1250;

export const ENGINE_BUNDLE_PICK_DELAY = 350;
export const ENGINE_INIT_SCREEN_ACTION_DELAY = 500;
export const ENGINE_INIT_SCREEN_ERROR_DELAY = 1750;
export const ENGINE_INIT_SCREEN_SUCCESS_DELAY = 500;

export const ENGINE_CAMERA_MIN_SCALE = 0.2;
export const ENGINE_CAMERA_MAX_SCALE = 10.95;
export const ENGINE_CAMERA_GRID_MIN_SCALE = 1.15;

export const ENGINE_MODE_TS = 1;
export const ENGINE_MODE_OBJ = 2;
export const ENGINE_MODE_OPT = 3;

export const ENGINE_OBJ_MODE = {
  0: "PERSON",
  1: "WARP",
  2: "SCRIPT",
  3: "SIGN"
};

export const ENGINE_ENCOUNTER_MODE = {
  0: "GRASS",
  1: "WATER",
  2: "FISHING"
};

export const ENGINE_TS_LAYERS = {
  BG: 1,
  BGB: 2,
  FG: 3,
  PREVIEW: 4,
  COLLISION: 5
};

export const ENGINE_TS_EDIT = {
  PENCIL: 1,
  PIPETTE: 2,
  BUCKET: 3,
  MAGIC: 4,
  AUTOTILE: 5
};

export const ENGINE_DEFAULT_MAP = {
  WIDTH: 8,
  HEIGHT: 8
};

export const ENGINE_MAP_MAX_WIDTH = 96;
export const ENGINE_MAP_MAX_HEIGHT = 96;

export const ENGINE_WEBGL_TEX_LIMIT = 256;

export const ENGINE_RENDERER = {
  GL: 1,
  CANVAS: 2
};

export const ENGINE_DEFAULT_RENDERER = ENGINE_RENDERER.GL;
