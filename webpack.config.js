const path = require("path");

module.exports = {
  entry: "./src/index.mjs",
  experiments: {
    outputModule: true,
  },
  output: {
    filename: "FGL.mjs",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: "module",
    },
  },
};
