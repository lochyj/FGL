export function randPos() {
  return [Math.round(Math.random() * 1000), Math.round(Math.random() * 1000)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
