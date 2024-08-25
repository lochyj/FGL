"use strict";

// - NODE DATA -
// id: 0,
// x: 0,
// y: 0,
// mass: 10,
// label: "",
// color: 0x00ff00,
// radius: 20,

// TODO: add an island index, that when an edge is
// added to the node is re-calculated, to determine if
// the force algorithm should enact forces on the
// specific node

let nodes;

export default nodes = {
  data: [],
  internal_next_id: 0,

  find: (id) => {
    for (var i = 0; i < nodes.data.length; i++) {
      if (nodes.data[i].id == id) {
        return i;
      }
    }
    return null;
  },

  next_id: () => {
    return nodes.internal_next_id++;
  },

  get_xy: (id) => {
    const index = nodes.find(id);

    if (index == null) return null;

    return [nodes.data[index].x, nodes.data[index].y];
  },
};
