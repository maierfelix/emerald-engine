export function isAlpha(cc) {
  return (
    cc >= 65 && cc <= 90 ||
    cc >= 97 && cc <= 122
  );
};

export function isNumber(cc) {
  return (
    cc >= 48 && cc <= 57
  );
};

export function isUmlaut(cc) {
  return (
    cc === 228 || // ä
    cc === 246 || // ö
    cc === 252    // ü
  );
};

export function isSharpS(cc) {
  return (
    cc === 223 // ß
  );
};

export function isCircumFlex(cc) {
  return (
    cc === 226 || // â
    cc === 234 || // ê
    cc === 238 || // î
    cc === 244 || // ô
    cc === 251    // û
  );
};
