/* Code originally from
 * https://embed.plnkr.co/II6lgj511fsQ7l0QCoRi/
 * Modified to fit the needs of this project
 * */

// TODO: Refactor to make less convoluted.

// TODO: Fix issue when the user navigates
// to another page using a click handler and
// then returns again, the drag event isnt
// de-registerd or something and its very annoying.

"use strict";
export default class Zoom {
  // Global vars to cache event state
  static evCache = new Array();
  static prevDiff = -1;

  constructor(container, app) {
    this.Container = container;
    this.app = app;

    // This is required...
    this.handler = this.handler.bind(this);
    this.Zoom = this.Zoom.bind(this);

    this.handler();

    this.pan = true;
  }

  handler() {
    this.lastPos = null;

    const canvas = this.app.view;

    canvas.onwheel = (event) => {
      if (event.deltaY > 0) {
        this.Zoom(event, 0.9);
      } else {
        this.Zoom(event, 1.1);
      }
    };

    canvas.onpointerdown = (event) => {
      this.lastPos = { x: event.offsetX, y: event.offsetY };
      Zoom.evCache.push(event);
    };

    canvas.onpointerup = (event) => {
      this.lastPos = null;
      Zoom.remove_event(event);
    };

    canvas.onpointerleave = (event) => {
      this.lastPos = null;
      Zoom.remove_event(event);
    };

    canvas.onpointermove = (event) => {
      // Find this event in the cache and update its record with this event
      for (var i = 0; i < Zoom.evCache.length; i++) {
        if (event.pointerId == Zoom.evCache[i].pointerId) {
          Zoom.evCache[i] = event;
          break;
        }
      }

      // If two pointers are down, check for pinch gestures
      if (Zoom.evCache.length == 2) {
        // Calculate the distance between the two pointers
        var curDiff = Math.sqrt(
          Math.pow(Zoom.evCache[1].clientX - Zoom.evCache[0].clientX, 2) +
            Math.pow(Zoom.evCache[1].clientY - Zoom.evCache[0].clientY, 2),
        );

        if (Zoom.prevDiff > 0) {
          if (curDiff > Zoom.prevDiff) {
            // The distance between the two pointers has increased
            this.Zoom(event, 1.02);
          }
          if (curDiff < Zoom.prevDiff) {
            // The distance between the two pointers has decreased
            this.Zoom(event, 0.98);
          }
        }

        // Cache the distance for the next move event
        Zoom.prevDiff = curDiff;
      }

      // If not two pointer gesture, more like normal
      else {
        if (this.lastPos && this.pan) {
          this.Container.x += event.offsetX - this.lastPos.x;
          this.Container.y += event.offsetY - this.lastPos.y;
          this.lastPos = { x: event.offsetX, y: event.offsetY };
        }
      }
    };
  }

  Zoom(e, sens) {
    e.preventDefault(); // Prevents window from scrolling when Zooming in UNLE

    const acccanvas = 0.8;
    const event = window.event;

    const x = event.offsetX;
    const y = event.offsetY;
    const stage = this.Container;
    const s = sens ** acccanvas;
    var worldPos = {
      x: (x - stage.x) / stage.scale.x,
      y: (y - stage.y) / stage.scale.y,
    };
    // Limit minimum and maximum size
    const minSize = 8;
    const maxSize = 0.02;
    var newScale = {
      x: Math.max(Math.min(stage.scale.x * s, minSize), maxSize),
      y: Math.max(Math.min(stage.scale.y * s, minSize), maxSize),
    };

    var newScreenPos = {
      x: worldPos.x * newScale.x + stage.x,
      y: worldPos.y * newScale.y + stage.y,
    };

    stage.x -= newScreenPos.x - x;
    stage.y -= newScreenPos.y - y;
    stage.scale.x = newScale.x;
    stage.scale.y = newScale.y;
  }

  enable_pan() {
    this.pan = true;
  }

  disable_pan() {
    this.pan = false;
  }

  static remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < Zoom.evCache.length; i++) {
      if (Zoom.evCache[i].pointerId == ev.pointerId) {
        Zoom.evCache.splice(i, 1);
        break;
      }
    }
  }
}
