// The force class descibes the forces of the particle based graph layout algorithm.
// This wasnt well thought out or reasearched but rather created through testing and tweaking.

import edges from "/src/data/edges.mjs";
import nodes from "/src/data/nodes.mjs";

export default class Force {
  constructor(update_method) {
    Force.update = update_method;

    Force.apply_forces();
  }

  // Force main loop which also handles any other loops
  // through the update method specified during the
  // initiation of the force class
  static apply_forces() {
    requestAnimationFrame(Force.apply_forces);

    Force.force_nodes();
    Force.force_edges();

    Force.update(); // handle any other update methods not related to the force class. Such as drawing nodes and edges or animations.
  }

  static force_nodes() {
    // Gravitational force towards the center of the viewing plane.
    // This makes sure the nodes stay centered and dont fly off in the the ether.
    const gravity = 15;

    for (var i = 0; i < nodes.data.length; i++) {
      const node = nodes.data[i];

      const distance = Math.sqrt(node.x * node.x + node.y * node.y);

      if (distance <= 100) {
        // 100 was chosen as it stops any vibrations of nodes at the center of the view plane.
        node.x = 0;
        node.y = 0;
        continue;
      }

      const normalizedX = node.x / distance;
      const normalizedY = node.y / distance;

      const forceX = normalizedX * gravity;
      const forceY = normalizedY * gravity;

      node.dx -= forceX;
      node.dy -= forceY;
    }

    // Coulombs constant which describes the repusive force of our
    // 'similarly charged' nodes repel each other
    const k = 8.99e9;

    // Calculate repulsive forces between nodes.
    // This could be paralellised by splitting a number of range of nodes
    // into calculation groups, e.g: nodes 1-10, 11-20, 21-30, etc...,
    // and running the outer loop below for those nodes specifically.
    // Of course the inner loop would still need to operate though all nodes respectviely.
    // This then could be passed to the GPU for processing or to web workers.
    for (var i = 0; i < nodes.data.length; i++) {
      const node_a = nodes.data[i];

      for (var j = 0; j < nodes.data.length; j++) {
        if (i == j) continue;
        const node_b = nodes.data[j];

        const x1 = node_a.x;
        const y1 = node_a.y;
        const x2 = node_b.x;
        const y2 = node_b.y;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        var forceMagnitude =
          (k * Math.abs(0.01 * 0.01)) / (distance * distance);

        if (forceMagnitude >= 500) forceMagnitude = 499;

        const forceX = (dx / distance) * forceMagnitude;
        const forceY = (dy / distance) * forceMagnitude;

        node_a.dx -= forceX;
        node_a.dy -= forceY;
        node_b.dx += forceX;
        node_b.dy += forceY;
      }
    }
  }

  static force_edges() {
    const dist = 8;
    const num_edges = edges.data.length;

    for (var i = 0; i < edges.data.length; i++) {
      const edge = edges.data[i];

      const node_a = nodes.data[nodes.find(edge.node_a)];
      const node_b = nodes.data[nodes.find(edge.node_b)];

      const x1 = node_a.x;
      const y1 = node_a.y;
      const x2 = node_b.x;
      const y2 = node_b.y;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(currentDistance - dist) <= 1) {
        continue;
      }

      const directionX = dx / currentDistance;
      const directionY = dy / currentDistance;

      const moveX = directionX * (30 / Math.sqrt(num_edges));
      const moveY = directionY * (30 / Math.sqrt(num_edges));

      node_a.dx += moveX;
      node_a.dy += moveY;
      node_b.dx -= moveX;
      node_b.dy -= moveY;
    }
  }
}
