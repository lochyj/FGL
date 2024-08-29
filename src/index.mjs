"use strict";

// Pixi.js imports
import { Application, Container, Graphics } from "./libs/pixi.min.mjs";
import * as PIXI from "./libs/pixi.min.mjs";

// Utility / Helper imports
import Force from "./src/force/force.mjs";
import Zoom from "./src/zoom.mjs";
import { randPos, load_defaults, nothing } from "./src/utilities.mjs";
import parse_settings from "./src/settings.mjs";

// Data imports
import nodes from "/src/data/nodes.mjs";
import edges from "/src/data/edges.mjs";

export default class FGLApp {
  // The constructor function here will essentially just initialise and validate
  // all the values we might need in future initialisation steps.
  constructor(settings) {
    // Validate and add default settings to the user provided settings object.
    FGLApp.settings = parse_settings(settings);

    // Validate that the provided id for the DOM canvas container is valid
    const container = document.getElementById(settings.container);

    if (!(container instanceof Element)) {
      throw Error(`The id "${settings.container}" is an invalid dom element.`);
    }

    FGLApp.domContainer = container;

    // Setup all of the pixi.js stuff

    FGLApp.app = new Application();
    FGLApp.container = new Container();

    FGLApp.nodes_container = new Container();
    FGLApp.edges_container = new Container();
    FGLApp.labels_container = new Container();

    // Set sane default values for the pixi.js items

    // Center the main container on the screen and zoom out a little bit
    FGLApp.container.x = FGLApp.domContainer.clientWidth / 2;
    FGLApp.container.y = FGLApp.domContainer.clientHeight / 2;
    FGLApp.container.scale.set(0.75);

    // Variables used when the user tries to drag a node.
    FGLApp.dragTarget = null;
    FGLApp.Drag_Offset_X = 0;
    FGLApp.Drag_Offset_Y = 0;

    // Now call the async init function to initialise the
    // PIXI environment.
    FGLApp.init();

    return; // There is nothing more that needs to be done, return to the user.
  }

  static async update() {
    // On each update cycle, we need to update the position of the nodes, edges and the labels.
    // We dont change force values here as that is handled by the Force class.
    FGLApp.update_nodes();
    FGLApp.update_edges();
  }

  static async init() {
    // All of the things here are required to run in an async function as they
    // depend on FGLApp.app and could not be dont in the constructor.

    // Pixi.js initialisation with sane default values.
    await FGLApp.app.init({
      resolution: 2,
      autoDensity: true,
      antialias: true,
      clearBeforeRender: true,
      preserveDrawingBuffer: true,
      autoResize: true,
    });

    // Add the pixi.js canvas to the user provided DOM element.
    FGLApp.domContainer.appendChild(FGLApp.app.canvas);

    // Create an event listener to resize the pixi.js canvas to prevent weird stretching.
    window.addEventListener("resize", () => {
      const parent = FGLApp.app.view.parentNode;

      FGLApp.app.renderer.resize(parent.clientWidth, parent.clientHeight);
    });

    // Resize the pixi.js canvas to prevent weird stretching.
    const parent = FGLApp.app.view.parentNode;
    FGLApp.app.renderer.resize(parent.clientWidth, parent.clientHeight);

    // Initialise the zoom class to handle panning and zooming from user interaction on the canvas.
    FGLApp.Zoom = new Zoom(FGLApp.container, FGLApp.app);

    // Add the pixi.js containers to the main container.
    FGLApp.container.addChild(FGLApp.edges_container);
    FGLApp.container.addChild(FGLApp.nodes_container);
    FGLApp.container.addChild(FGLApp.labels_container);

    // Add the main container to the canvas.
    FGLApp.app.stage.addChild(FGLApp.container);

    // Set proper values that allow for the user to interact with nodes properly.
    FGLApp.app.stage.eventMode = "static";
    FGLApp.app.stage.hitArea = FGLApp.app.screen;
    FGLApp.app.stage.on("pointerup", FGLApp.onDragEnd);
    FGLApp.app.stage.on("pointerupoutside", FGLApp.onDragEnd);

    FGLApp.edges_container.interactiveChildren = false;
    FGLApp.edges_container.eventMode = "none";

    FGLApp.labels_container.interactiveChildren = false;
    FGLApp.labels_container.eventMode = "none";

    // Setup the force algorithm handler.
    // It will call FGLApp.update() each time its finished updating values.
    FGLApp.force = new Force(FGLApp.update);

    return; // Return to the user now :).
  }

  // -------------------------------------
  // Handlers for user -> node interaction
  // -------------------------------------
  //

  static node_clicked() {
    const node = nodes.data[nodes.find(this.id)];

    const functions = node.functions;

    for (var i = 0; i < functions.length; i++) {
      if (!(functions[i] instanceof Function)) continue;
      const value = functions[i](node.data);

      // If the function doesnt want anything else to happen, return.
      if (value === false) {
        return;
      }

      // Else, continue executing all of the handlers.
    }

    // Now call the drag handler
    FGLApp.onDragStart(this);
  }

  static onDragMove(event) {
    if (!FGLApp.dragTarget) {
      // This may occur because we have the zoom handler which handles
      // drag events, but cannot remove the event from the queue.
      // Therefore, we need to filter out drag events that dont involve moving a node.
      return;
    }

    // Identify the node that is being dragged.
    const node = nodes.data[nodes.find(FGLApp.dragTarget.id)];

    // Set the node to the position of the cursor.
    // The drag offset makes the position of the cursor constant
    // relative to the cursor, meaning the node doesnt center itself
    // suddenly to the cursor and the position on the node that
    // was dragged stays centered on the cursor itself.
    node.x = FGLApp.container.toLocal(event).x - FGLApp.Drag_Offset_X;
    node.y = FGLApp.container.toLocal(event).y - FGLApp.Drag_Offset_Y;

    // Update the positions of everything on the screen for continutity.
    FGLApp.update();
  }

  static onDragStart(context) {
    // Set the drag target to the node being dragged.
    FGLApp.dragTarget = context;

    // Set the drag handler.
    FGLApp.app.stage.on("pointermove", FGLApp.onDragMove);

    // Set the node to the position of the cursor.
    // The drag offset makes the position of the cursor constant
    // relative to the cursor, meaning the node doesnt center itself
    // suddenly to the cursor and the position on the node that
    // was dragged stays centered on the cursor itself.
    FGLApp.Drag_Offset_X = FGLApp.container.toLocal(event).x - context.x;
    FGLApp.Drag_Offset_Y = FGLApp.container.toLocal(event).y - context.y;

    // Disable panning as we dont want to move the screen at the same
    // time as we are moving the node.
    FGLApp.Zoom.disable_pan();
  }

  static onDragEnd() {
    if (FGLApp.dragTarget) {
      // Reset the drag handler.
      FGLApp.app.stage.off("pointermove", FGLApp.onDragMove);

      // Re-enable panning as we now want to be able to move the screen around.
      FGLApp.Zoom.enable_pan();

      // Reset the drag target to prevent the target from being locked even after the drag finishes.
      FGLApp.dragTarget = undefined;
    }
  }

  // --------------
  // Update methods
  // --------------

  // These methods are a little messy and have quite a lot of unexplained math.
  // This will likely stay the same for the near future so dont expect it to get much better.

  static update_edges() {
    for (var i = 0; i < edges.data.length; i++) {
      const edge = edges.data[i];
      const child = edge.child;
      const node_a = nodes.data[nodes.find(edge.node_a)];
      const node_b = nodes.data[nodes.find(edge.node_b)];

      const x1 = node_a.x;
      const y1 = node_a.y;
      const x2 = node_b.x;
      const y2 = node_b.y;

      const dx = x2 - x1;
      const dy = y2 - y1;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = -((Math.atan2(dx, dy) * 180) / Math.PI) - 180;

      child.x = x2;
      child.y = y2;
      child.height = distance;
      child.width = edge.width;
      child.angle = angle;

      if (edge.labelChild != null) {
        edge.labelChild.x = (x1 + x2) / 2 - edge.labelChild.width / 2;
        edge.labelChild.y = (y1 + y2) / 2 - edge.labelChild.height;
      }

      if (edge.arrow != null) {
        const angleRad = (angle * Math.PI) / 180;
        const distance_offset = distance - node_b.radius;

        const normalised_dx = dx / distance;
        const normalised_dy = dy / distance;

        const offsetX = -(edge.arrow.width / 2) * -normalised_dy;
        const offsetY = -(edge.arrow.width / 2) * normalised_dx;

        edge.arrow.x = offsetX + x1 + distance_offset * Math.sin(angleRad);
        edge.arrow.y = offsetY + y1 - distance_offset * Math.cos(angleRad);
        edge.arrow.angle = angle;
      }
    }
  }

  static update_nodes() {
    for (var i = 0; i < nodes.data.length; i++) {
      const node = nodes.data[i];
      const child = node.child;

      if (node.locked) {
        node.dx = 0;
        node.dy = 0;

        continue;
      }

      if (FGLApp.dragTarget != null && i == nodes.find(FGLApp.dragTarget.id)) {
        node.dx = 0;
        node.dy = 0;
      }

      node.x += node.dx;
      node.y += node.dy;

      node.dx = 0;
      node.dy = 0;

      child.x = node.x;
      child.y = node.y;

      if (node.labelChild != null) {
        const xOffset = Math.round(node.labelChild.width / 2);
        node.labelChild.x = node.x - xOffset;
        node.labelChild.y =
          node.y - (Math.round(node.radius) + 5) - node.labelChild.height; // 5 for text box offset from node.
      }
    }
  }

  // ----------------
  // Creation methods
  // ----------------

  static add_label(text, backgroundColor) {
    const labelContainer = new PIXI.Container();
    const padding = 6;
    const borderRadius = 7;

    const textStyle = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#FFFFFF", // Text color
      align: "center",
    });
    const labelText = new PIXI.Text(text, textStyle);

    const background = new PIXI.Graphics();
    background.beginFill(backgroundColor);
    background.drawRoundedRect(
      0,
      0,
      labelText.width + padding * 2,
      labelText.height + padding * 2,
      borderRadius,
    );
    background.endFill();

    labelContainer.addChild(background);
    labelContainer.addChild(labelText);

    labelText.x = padding;
    labelText.y = padding;

    const child = FGLApp.labels_container.addChild(labelContainer);

    return child;
  }

  add_node(id, config) {
    var defaults = {
      label: "",
      radius: 20,
      color: 0x448ee4,
      mass: 10,
      click_handler: nothing,
      locked: false, // Determines if the node should be locked in place
      position: randPos(), // Sets the position of the node. [x, y].
      data: undefined,
    };

    defaults = load_defaults(config, defaults);

    const x = defaults.position[0];
    const y = defaults.position[1];

    const graphics = new Graphics();
    graphics.beginFill(defaults.color);

    graphics.drawCircle(0, 0, defaults.radius);
    graphics.endFill();

    graphics.x = x;
    graphics.y = y;

    graphics.eventMode = "static";
    graphics.on("pointerdown", FGLApp.node_clicked, graphics);

    graphics.id = id;

    const child = FGLApp.nodes_container.addChild(graphics);
    let labelChild = null;

    if (defaults.label != "") {
      labelChild = FGLApp.add_label(defaults.label, 0x3f3f3f);
    }

    // Add the data for the node to the nodes object.
    nodes.data.push({
      id: id,
      x: x,
      y: y,
      radius: defaults.radius,
      color: defaults.color,
      label: defaults.label,
      mass: defaults.mass,
      child: child,
      functions: [defaults.click_handler], // TODO: decide if this should be a list.
      locked: defaults.locked,
      data: defaults.data,
      dx: 0,
      dy: 0,
      labelChild: labelChild,
      incoming: [],
      outgoing: [],
    });
  }

  add_edge(node_a, node_b, config) {
    var defaults = {
      directed: false,
      label: "",
      color: 0x606060,
      width: 15,
    };

    defaults = load_defaults(config, defaults);

    const line = new Graphics();
    line.beginFill(defaults.color);
    line.drawRect(0, 0, 1, 1);
    line.endFill();

    line.pivot.set(0.5, 0);

    const a = nodes.data[nodes.find(node_a)];
    const b = nodes.data[nodes.find(node_b)];

    const x1 = a.x;
    const y1 = a.y;
    const x2 = b.x;
    const y2 = b.y;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = -((Math.atan2(dx, dy) * 180) / Math.PI) - 180;

    line.x = x2;
    line.y = y2;
    line.height = distance;
    line.width = defaults.width;
    line.angle = angle;

    const child = FGLApp.edges_container.addChild(line);

    var arrow_id = null;
    if (defaults.directed) {
      const arrow = new Graphics();
      arrow.beginFill(0x7f7f7f);
      arrow.moveTo(0, 10);
      arrow.lineTo(5, 8);
      arrow.lineTo(10, 10);
      arrow.lineTo(5, 0);
      arrow.lineTo(0, 10);
      arrow.endFill();

      arrow.scale.set(3);

      arrow_id = FGLApp.edges_container.addChild(arrow);
    }

    const edge_id = edges.data.length;

    a.outgoing.push(edge_id);
    b.incoming.push(edge_id);

    let labelChild;
    if (defaults.label != "") {
      labelChild = FGLApp.add_label(defaults.label, 0x7f7f7f);
    }

    edges.data.push({
      id: edge_id,
      node_a: node_a,
      node_b: node_b,
      width: defaults.width,
      color: defaults.color,
      directed: defaults.directed,
      child: child,
      arrow: arrow_id,
      labelChild: labelChild,
    });
  }

  // ----------------
  // Deletion methods
  // ----------------

  reset() {
    nodes.data = [];
    edges.data = [];

    // Remove all elements from their containers.
    while (FGLApp.nodes_container.children[0]) {
      FGLApp.nodes_container.removeChild(FGLApp.nodes_container.children[0]);
    }

    while (FGLApp.edges_container.children[0]) {
      FGLApp.edges_container.removeChild(FGLApp.edges_container.children[0]);
    }

    while (FGLApp.labels_container.children[0]) {
      FGLApp.labels_container.removeChild(FGLApp.labels_container.children[0]);
    }
  }

  static remove_edge_internal(id) {
    const edge = edges.data[edges.find(id)];
    const node_a = nodes.data[nodes.find(edge.node_a)];
    const node_b = nodes.data[nodes.find(edge.node_b)];

    // Remove all instances of the edge from the connected nodes.
    for (var i = 0; i < node_a.outgoing.length; i++) {
      if (node_a.outgoing[i] == id) {
        node_a.outgoing.splice(i, 1);
        i--;
        continue;
      }
    }

    for (var i = 0; i < node_b.incoming.length; i++) {
      if (node_b.incoming[i] == id) {
        node_b.incoming.splice(i, 1);
        i--;
        continue;
      }
    }

    // Remove all dependent objects from existence.
    edge.child.parent.removeChild(edge.child);

    if (edge.arrow) {
      edge.arrow.parent.removeChild(edge.arrow);
    }

    if (edge.labelChild) {
      edge.labelChild.parent.removeChild(edge.labelChild);
    }

    // Now remove the edge from the edges object.
    edges.data.splice(edges.find(id), 1);
  }

  remove_node(id) {
    const node = nodes.data[nodes.find(id)];

    // Remove the incoming and outgoing edges connected to the node.
    for (var i = 0; i < node.incoming.length; i++) {
      FGLApp.remove_edge_internal(node.incoming[i]);
    }

    for (var i = 0; i < node.outgoing.length; i++) {
      FGLApp.remove_edge_internal(node.outgoing[i]);
    }

    // Remove the node from the canvas.
    node.child.parent.removeChild(node.child);

    // And remove the label from the canvas.
    if (node.labelChild) {
      node.labelChild.parent.removeChild(node.labelChild);
    }

    // Now remove the node from the nodes object.
    nodes.data.splice(nodes.find(id), 1);
  }

  remove_edge(node_a, node_b) {
    for (var i = 0; i < edges.data.length; i++) {
      const edge = edges.data[i];

      if (edge.node_a == node_a && edge.node_b == node_b) {
        FGLApp.remove_edge_internal(edge.id);
        return;
      }
    }
  }

  edit_node(id) {
    // TODO
  }

  edit_edge(node_a, node_b) {
    // TODO
  }

  // --------------
  // Helper methods
  // --------------

  // Generates a random graph with the number of specified nodes.
  random(num_nodes, labeled = false, directed = false) {
    for (let i = 0; i < num_nodes; i++) {
      if (labeled) this.add_node(i, `${i}`);
      else this.add_node(i);
    }

    const edges = new Set();

    for (let i = 0; i < num_nodes; i++) {
      for (let j = i + 1; j < num_nodes; j++) {
        if (Math.random() < 0.15) {
          if (!edges.has(`${i}-${j}`) && !edges.has(`${j}-${i}`)) {
            this.add_edge(i, j, directed);
            edges.add(`${i}-${j}`);
          }
        }
      }
    }
  }
}
