export function randPos() {
  return [Math.round(Math.random() * 1000), Math.round(Math.random() * 1000)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function load_defaults(settings, defaults) {
  if (!(settings instanceof Object)) return defaults;

  for (const property in defaults) {
    if (property in settings === true) {
      defaults[property] = settings[property];
    }
  }

  return defaults;
}

// This function does nothing. Why you might ask?
// Well each node has a click handler. If the user
// doesnt assign a handler, we simply assign it this.
export function nothing() {
  return;
}
