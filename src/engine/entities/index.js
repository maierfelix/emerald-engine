import * as CFG from "../../cfg";

export default class Entity {
  constructor(map) {
    this.map = map;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.opacity = 1.0;
    this.collidable = false;
  }
  kill() {
    this.map.removeObject(this);
  }
};
