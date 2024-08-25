// TODO: add type validation and value bounding (for color) to all user passed settings.

const default_settings = {
  background_color: 0x0a0a0a,
  node_color: 0x448ee4,
  edge_color: 0x606060,
  node_label_color: 0x3f3f3f,
  edge_label_color: 0x7f7f7f,
};

// Function to add user provided settigns to the default settings object
export default function parse_settings(settings) {
  // Check if the settings object contains the container property
  // as this is needed for pixi.js to create the canvas to draw on.
  if (!("container" in settings)) {
    throw Error(
      "Settings must contain the id of \
      a div to add the canvas to.",
    );
  }

  // Make a copy of the default settings object.
  var defaults = Object.assign({}, default_settings);

  // Iterate over each element in the default settings object and
  // replace it, if the property exists, with the
  // coresponding value in the passed in settings object.
  for (const property in defaults) {
    if (property in settings) {
      defaults[property] = settings[property];
    }
  }

  return defaults;
}
