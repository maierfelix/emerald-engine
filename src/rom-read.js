import { decodeCharByte } from "./rom-utils";

export const I8 = Int8Array.BYTES_PER_ELEMENT;
export const I16 = Int16Array.BYTES_PER_ELEMENT;
export const I32 = Int32Array.BYTES_PER_ELEMENT;
export const PTR = Int32Array.BYTES_PER_ELEMENT;

export function readByte(buffer, offset) {
  return (
    buffer[offset] & 0xff
  );
};

export function readShort(buffer, offset) {
  return (
    (buffer[offset] << 0) |
    (buffer[offset + 1] << 8)
  );
};

export function readInt(buffer, offset) {
  return (
    (buffer[offset + 0] << 0)  |
    (buffer[offset + 1] << 8)  |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  );
};

export function readPointer(buffer, offset) {
  return (
    readInt(buffer, offset) & 0x1FFFFFF
  );
};

export function readPointerAsInt(buffer, offset) {
  return (
    readPointer(buffer, offset) | 0
  );
};

export function readChar(buffer, offset) {
  return decodeCharByte(readByte(buffer, offset));
};

export function readBytes(buffer, offset, length) {
  let data = new Uint8Array(length);
  for (let ii = 0; ii < length; ++ii) {
    data[ii] = readByte(buffer, offset + ii * I8);
  };
  return data;
};

export function readShorts(buffer, offset, length) {
  let data = new Uint16Array(length);
  for (let ii = 0; ii < length; ++ii) {
    data[ii] = readShort(buffer, offset + ii * I16);
  };
  return data;
};

export function readInts(buffer, offset, length) {
  let data = new Uint32Array(length);
  for (let ii = 0; ii < length; ++ii) {
    data[ii] = readInt(buffer, offset + ii * I32);
  };
  return data;
};

export function readPointers(buffer, offset, length) {
  let ptrs = new Uint8Array(length);
  for (let ii = 0; ii < length; ++ii) {
    let ptr = readPointer(buffer, offset + ii * PTR);
    ptrs.push(ptr);
  };
  return ptrs;
};

export function readString(buffer, offset) {
  let ii = 0;
  let chars = [];
  let char = readChar(buffer, offset);
  while (char !== "|end|") {
    chars.push(char);
    char = readChar(buffer, offset + (++ii));
  };
  return chars.join("");
};

export function readBinaryString(buffer, offset, length) {
  let data = [];
  for (let ii = 0; ii < length; ++ii) {
    let char = readByte(buffer, offset + ii);
    data[ii] = String.fromCharCode(char);
  };
  return data.join("");
};
