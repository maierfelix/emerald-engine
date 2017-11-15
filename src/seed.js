/**
 * https://gist.github.com/blixt/f17b47c62508be59987b
 */
export default class Seed {
  constructor(seed) {
    this.m_w = seed;
    this.m_z = 987654321;
    this.mask = 0xffffffff;
  }
  number() {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
    let result = ((this.m_z << 16) + this.m_w) & this.mask;
    return (result / 4294967296) + 0.5;
  }
};
