"use strict";

// - EDGE DATA -
// id: 0,
// node_a: 0,
// node_b: 1,
// width: 10,
// weight: 10,
// color: 0xff00ff,
// label: "",

let edges;

export default edges = {
  data: [],

  find: (id) => {
    for (var i = 0; i < edges.data.length; i++) {
      if (edges.data[i].id == id) {
        return i;
      }
    }
    return null;
  },
};
