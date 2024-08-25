import edges from "/src/data/edges.mjs";
import nodes from "/src/data/nodes.mjs";

export default class Force {
  constructor(update_method) {
    Force.update = update_method;

    Force.apply_forces();
  }

  static apply_forces() {
    requestAnimationFrame(Force.apply_forces);

    Force.force_nodes();
    Force.force_edges();

    Force.update();
  }
  // possible future addition:
  // Gravity force that attracts smaller masses to larger masses but repels similar sized masses.
  static force_nodes() {
    // Gravitational force
    const gravity = 15;
    for (var i = 0; i < nodes.data.length; i++) {
      const node = nodes.data[i];

      const distance = Math.sqrt(node.x * node.x + node.y * node.y);

      if (distance <= 20) {
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

    const k = 8.99e9;

    // Repulsive forces
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

        const forceMagnitude =
          (k * Math.abs(0.01 * 0.01)) / (distance * distance);

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

      if (Math.abs(currentDistance - dist) < 0) {
        continue;
      }

      const directionX = dx / currentDistance;
      const directionY = dy / currentDistance;

      const moveX = directionX * 30;
      const moveY = directionY * 30;

      node_a.dx += moveX;
      node_a.dy += moveY;
      node_b.dx -= moveX;
      node_b.dy -= moveY;
    }
  }
}
