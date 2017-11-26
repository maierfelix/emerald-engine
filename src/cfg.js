export const TILE_EDITOR_BG_COLOR = `rgba(87, 87, 87, 1)`;

export const TILESET_DEFAULT_WIDTH = 128;
export const TILESET_DEFAULT_HEIGHT = 2560;

export const TILESET_FINAL_SCALE = 4;
export const TILESET_LAYER_SCALE = 3;

export const TS_MAX_STACK_SIZE = 10;

export const TILE_SIZE = 8;
export const BLOCK_SIZE = TILE_SIZE * 2;

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
  "NW":  { x: 0, y: 0 },
  "N+W": { x: 4, y: 1 },
  "N":   { x: 1, y: 0 },
  "NE":  { x: 2, y: 0 },
  "N+E": { x: 3, y: 1 },
  "E":   { x: 2, y: 1 },
  "SE":  { x: 2, y: 2 },
  "S+E": { x: 3, y: 0 },
  "S":   { x: 1, y: 2 },
  "SW":  { x: 0, y: 2 },
  "S+W": { x: 4, y: 0 },
  "W":   { x: 0, y: 1 }
};

export const ENGINE_DEFAULT_MAP = [0, 9];

export const ENGINE_TILESET_SCALE = 2.0;

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
