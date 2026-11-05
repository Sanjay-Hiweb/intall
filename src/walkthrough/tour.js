/**
 * Architectural Guided Tour Controller
 * Sequences natural walkthrough visit order across rooms and levels,
 * manages stop hold duration, pause/play, next/previous, and progress reporting.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughTour = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class GuidedTourController {
    constructor(roomGraph, autowalk, options = {}) {
      this.graph = roomGraph;
      this.autowalk = autowalk;
      this.holdDuration = options.holdDuration || 4.0; // 4 seconds hold per room
      this.stops = [];
      this.currentStopIndex = -1;
      this.isActive = false;
      this.isPaused = false;
      this.state = 'idle'; // 'walking' | 'holding' | 'paused'
      this.timer = 0;
      this.onStopChanged = null; // (stopInfo, index, total) => void
      this.onTourFinished = null; // () => void
    }

    /**
     * Compute natural architectural visit sequence from graph
     */
    buildTourSequence() {
      if (!this.graph) return [];

      const reachableNodes = Array.from(this.graph.nodes.values()).filter(n => n.isReachable);
      const groundRooms = reachableNodes.filter(n => n.floor === 'ground');
      const firstRooms = reachableNodes.filter(n => n.floor === 'first');

      const typeOrder = ['hall', 'living', 'dining', 'kitchen', 'pooja', 'study', 'bedroom', 'bathroom', 'utility', 'parking', 'stairs', 'balcony'];

      function sortFloorRooms(list) {
        return list.slice().sort((a, b) => {
          let idxA = typeOrder.indexOf(a.type);
          let idxB = typeOrder.indexOf(b.type);
          if (idxA === -1) idxA = 99;
          if (idxB === -1) idxB = 99;
          if (idxA !== idxB) return idxA - idxB;
          return a.name.localeCompare(b.name);
        });
      }

      const sortedGround = sortFloorRooms(groundRooms);
      const sortedFirst = sortFloorRooms(firstRooms);

      this.stops = [...sortedGround, ...sortedFirst];
      return this.stops;
    }

    startTour() {
      this.start();
      return this.stops;
    }

    start() {
      this.buildTourSequence();
      if (this.stops.length === 0) return false;

      this.isActive = true;
      this.isPaused = false;
      this.currentStopIndex = 0;
      this.moveToCurrentStop();
      return true;
    }

    stop() {
      if (!this.isActive) return;
      this.isActive = false;
      this.isPaused = false;
      this.state = 'idle';
      this.autowalk.cancel();
      if (this.onTourFinished) this.onTourFinished();
    }

    pause() {
      if (!this.isActive) return false;
      this.isPaused = !this.isPaused;
      this.state = this.isPaused ? 'paused' : 'holding';
      return this.isPaused;
    }

    resume() {
      if (!this.isActive) return;
      this.isPaused = false;
      this.state = 'holding';
    }

    togglePause() {
      return this.pause();
    }

    next() {
      if (!this.isActive || this.stops.length === 0) return;
      if (this.currentStopIndex < this.stops.length - 1) {
        this.currentStopIndex++;
        this.moveToCurrentStop();
      } else {
        this.stop();
      }
    }

    prev() {
      return this.previous();
    }

    previous() {
      if (!this.isActive || this.stops.length === 0) return;
      if (this.currentStopIndex > 0) {
        this.currentStopIndex--;
        this.moveToCurrentStop();
      }
    }

    moveToCurrentStop() {
      const stopNode = this.stops[this.currentStopIndex];
      if (!stopNode) return;

      this.state = 'walking';
      this.timer = 0;

      if (this.onStopChanged) {
        this.onStopChanged(stopNode, this.currentStopIndex, this.stops.length);
      }

      // Query path from current player position to target stop
      // Handled via controller integration
    }

    onArrivedAtStop() {
      this.state = 'holding';
      this.timer = this.holdDuration;
    }

    update(delta = 0.016) {
      if (!this.isActive || this.isPaused) return;

      if (this.state === 'holding') {
        this.timer -= delta;
        if (this.timer <= 0) {
          this.next();
        }
      }
    }
  }

  return {
    GuidedTourController
  };
}));
