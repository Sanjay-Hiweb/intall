/**
 * Walkthrough Master Controller
 * Orchestrates first-person character movement, pointer lock / drag look,
 * room awareness banners, collision sliding, stairs climb, auto-walk, and guided tour.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughController = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WalkthroughController {
    constructor(options = {}) {
      this.scene = options.scene || null;
      this.camera = options.camera || null;
      this.renderer = options.renderer || null;
      this.orbitControls = options.orbitControls || null;
      this.container = options.container || document.body;

      // Core Submodules
      this.settings = new (window.WalkthroughSettings ? window.WalkthroughSettings.SettingsManager : function() {
        this.get = (k) => ({ mouseSensitivity: 0.0022, invertY: false, fov: 70, jumpInstantly: false, tourHoldDuration: 4.0 }[k]);
        this.set = () => {};
      })();

      this.collision = new (window.WalkthroughCollision ? window.WalkthroughCollision.CollisionSystem : function() {})();
      this.stairs = new (window.WalkthroughStairs ? window.WalkthroughStairs.StairsController : function() {})();
      this.autowalk = new (window.WalkthroughAutoWalk ? window.WalkthroughAutoWalk.AutoWalkController : function() {})();
      this.hud = null;
      this.minimap = null;
      this.tour = null;
      this.graph = null;

      // State
      this.isActive = false;
      this.isPointerLocked = false;
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };

      // Movement & Kinematics (in feet: 1m = 3.28084 ft)
      // Walk speed 1.4 m/s = 4.6 ft/s; Sprint 1.8x = 8.3 ft/s
      this.baseWalkSpeed = 4.6;
      this.sprintMultiplier = 1.8;
      this.currentSpeed = this.baseWalkSpeed;
      this.eyeHeight = 5.25; // 1.6 m eye height

      this.playerPos = { x: 0, y: 0.45, z: 0 };
      this.velocity = { x: 0, y: 0, z: 0 };
      this.yaw = 0;   // Horizontal angle (radians)
      this.pitch = 0; // Vertical angle (radians)

      this.currentFloor = 'ground';
      this.currentRoom = null;
      this.lastRoomId = null;

      // Key Input Map
      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        climbUp: false,
        climbDown: false
      };

      // Door Interaction
      this.activeDoorPrompt = null;
      this.doorAnimations = [];

      // Saved Orbit Camera State for smooth restore on exit
      this.savedOrbitState = null;

      // Performance monitoring
      this.frameCount = 0;
      this.fpsTimer = performance.now();
      this.fpsHistory = [];
      this.averageFPS = 60;
      this.lowFpsDuration = 0;

      // Bound Event Handlers
      this._onKeyDown = this.onKeyDown.bind(this);
      this._onKeyUp = this.onKeyUp.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseDown = this.onMouseDown.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);
      this._onPointerLockChange = this.onPointerLockChange.bind(this);
      this._onPointerLockError = this.onPointerLockError.bind(this);
      this._onCanvasClick = this.onCanvasClick.bind(this);
      this._onVisibilityChange = this.onVisibilityChange.bind(this);
      this._onResize = this.onResize.bind(this);
      this._updateLoop = this.updateLoop.bind(this);

      this.lastTime = performance.now();
      this.animId = null;
    }

    /**
     * Initialize HUD and Minimap overlays
     */
    initOverlays(container = this.container) {
      if (this.hud) return;

      const unit = (window.state && window.state.unit) ? window.state.unit : 'ft';

      if (window.WalkthroughHUD) {
        this.hud = new window.WalkthroughHUD.WalkthroughHUDManager(container, {
          unit: unit,
          graph: this.graph
        });

        // Wire HUD events
        this.hud.on('selectRoom', (roomId) => this.navigateToRoom(roomId));
        this.hud.on('tourAction', (action) => this.handleTourAction(action));
        this.hud.on('toggleDayNight', () => this.toggleDayNight());
        this.hud.on('toggleMinimap', () => this.toggleMinimap());
        this.hud.on('toggleHelp', () => this.toggleHelp());
        this.hud.on('exitWalkthrough', () => this.exit());
        this.hud.on('settingsChanged', (settings) => this.applySettings(settings));
      }

      if (window.WalkthroughMinimap) {
        this.minimap = new window.WalkthroughMinimap.WalkthroughMinimap(container, {
          size: 210
        });

        this.minimap.onRoomClick = (roomId) => this.navigateToRoom(roomId);
      }
    }

    /**
     * Enter Walkthrough Mode
     */
    enter(rooms, plot, facing = 'S') {
      if (this.isActive) return;

      if (!rooms || rooms.length === 0) {
        if (window.showToast) window.showToast('⚠️ No floor plan available to walk through.');
        return;
      }

      // 1. Build or retrieve Room Graph
      if (window.WalkthroughGraph) {
        this.graph = window.WalkthroughGraph.getOrBuildGraph(rooms, plot, facing);
      }

      if (!this.graph || !this.graph.entranceNode) {
        const hasAnyDoor = rooms.some(r => r.doors && r.doors.length > 0);
        if (!hasAnyDoor) {
          if (window.showToast) {
            window.showToast('Add a main door in the plan to start the walkthrough');
          } else {
            alert('Add a main door in the plan to start the walkthrough');
          }
          return;
        }
      }

      this.isActive = true;

      // 2. Initialize HUD & Minimap
      this.initOverlays(this.container);
      if (this.hud) {
        this.hud.setGraph(this.graph);
        this.hud.show();
      }
      if (this.minimap) {
        this.minimap.setGraph(this.graph);
        this.minimap.show();
      }

      // 3. Build Colliders from Scene
      if (this.collision && this.collision.buildFromScene) {
        this.collision.buildFromScene(this.graph, window.threeFurnitureGroup || null, 'ground');
      }

      // 4. Initialize Stairs & Tour Controllers
      if (this.stairs && this.stairs.registerFromGraph) {
        this.stairs.registerFromGraph(this.graph);
        this.stairs.onLevelChange = (newLevel) => {
          this.onLevelTransition(newLevel);
        };
      }

      if (window.WalkthroughTour && this.graph) {
        this.tour = new window.WalkthroughTour.GuidedTourController(this.graph, this.autowalk, {
          holdDuration: this.settings.get('tourHoldDuration') || 4.0
        });

        this.tour.onStopChanged = (stopNode, index, total) => {
          if (this.hud) {
            this.hud.updateTourStatus(true, index, total, stopNode.name, false);
            this.hud.showRoomBanner(stopNode);
          }
        };

        this.tour.onTourFinished = () => {
          if (this.hud) {
            this.hud.updateTourStatus(false, 0, 0, '', false);
            this.hud.showToast('Guided Tour Finished');
          }
        };
      }

      // 5. Save previous OrbitControls state
      if (this.camera && this.orbitControls) {
        this.savedOrbitState = {
          position: this.camera.position.clone(),
          target: this.orbitControls.target.clone(),
          fov: this.camera.fov,
          near: this.camera.near
        };
        this.orbitControls.enabled = false;
      }

      // 6. Spawn Player at Main Entrance Door, looking inward
      const spawnPoint = this.graph.getEntranceSpawn();
      this.playerPos = {
        x: spawnPoint.x,
        y: spawnPoint.y,
        z: spawnPoint.z
      };
      this.yaw = spawnPoint.yaw;
      this.pitch = 0;
      this.currentFloor = 'ground';
      this.velocity = { x: 0, y: 0, z: 0 };

      // Set Camera properties for human scale architectural visualization
      if (this.camera) {
        this.camera.fov = this.settings.get('fov') || 70;
        this.camera.near = 0.15; // 0.05m near plane prevents wall clipping
        this.camera.updateProjectionMatrix();
        this.updateCameraTransform();
      }

      // 7. Fade UI chrome (200ms)
      this.fadeUIChrome(true);

      // 8. Bind Listeners
      this.bindEvents();

      // 9. Show First-Time Controls Modal if not previously dismissed
      const helpDismissed = localStorage.getItem('intall_walk_help_dismissed');
      if (!helpDismissed && this.hud) {
        this.hud.showHelpCard(true);
      }

      // 10. Start Animation Loop
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this._updateLoop);

      // Initial Room Awareness
      this.checkCurrentRoom(true);

      if (window.showToast) {
        window.showToast('Entered Walkthrough. Click to look around (WASD to walk, E for doors).');
      }
    }

    /**
     * Exit Walkthrough Mode and restore OrbitControls
     */
    exit() {
      if (!this.isActive) return;

      this.isActive = false;

      // 1. Cancel ongoing actions
      if (this.autowalk) this.autowalk.cancel();
      if (this.tour) this.tour.stop();
      if (this.animId) cancelAnimationFrame(this.animId);

      // 2. Release Pointer Lock
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }

      // 3. Unbind Events
      this.unbindEvents();

      // 4. Hide HUD & Minimap
      if (this.hud) this.hud.hide();
      if (this.minimap) this.minimap.hide();

      // 5. Restore OrbitControls Camera
      if (this.camera && this.savedOrbitState && this.orbitControls) {
        this.camera.position.copy(this.savedOrbitState.position);
        this.camera.fov = this.savedOrbitState.fov;
        this.camera.near = this.savedOrbitState.near;
        this.camera.updateProjectionMatrix();

        this.orbitControls.target.copy(this.savedOrbitState.target);
        this.orbitControls.enabled = true;
        this.orbitControls.update();
      }

      // 6. Restore UI Chrome
      this.fadeUIChrome(false);

      if (window.showToast) {
        window.showToast('Exited Walkthrough mode.');
      }
    }

    /**
     * Fade out / in standard 2D/3D app UI chrome
     */
    fadeUIChrome(hideForWalkthrough) {
      const elementsToFade = [
        document.getElementById('viewport3DToolbar'),
        document.getElementById('adjustmentDrawer'),
        document.querySelector('.app-header'),
        document.querySelector('.wizard-nav-wrap')
      ];

      elementsToFade.forEach(el => {
        if (!el) return;
        el.style.transition = 'opacity 200ms ease, transform 200ms ease';
        if (hideForWalkthrough) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
        }
      });
    }

    /**
     * Bind DOM, Keyboard, Pointer Lock, and Mouse Events
     */
    bindEvents() {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('resize', this._onResize);
      document.addEventListener('visibilitychange', this._onVisibilityChange);

      const canvas = this.renderer ? this.renderer.domElement : document.getElementById('webgl3DContainer');
      if (canvas) {
        canvas.addEventListener('click', this._onCanvasClick);
        canvas.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
      }

      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      document.addEventListener('pointerlockerror', this._onPointerLockError);
    }

    /**
     * Unbind Events on Exit
     */
    unbindEvents() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('visibilitychange', this._onVisibilityChange);

      const canvas = this.renderer ? this.renderer.domElement : document.getElementById('webgl3DContainer');
      if (canvas) {
        canvas.removeEventListener('click', this._onCanvasClick);
        canvas.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
      }

      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
      document.removeEventListener('pointerlockerror', this._onPointerLockError);
    }

    /**
     * Canvas Click: Request Pointer Lock
     */
    onCanvasClick(e) {
      if (!this.isActive) return;
      const canvas = this.renderer ? this.renderer.domElement : null;
      if (canvas && !document.pointerLockElement) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        if (canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
      }
    }

    onPointerLockChange() {
      const canvas = this.renderer ? this.renderer.domElement : null;
      this.isPointerLocked = (document.pointerLockElement === canvas);
    }

    onPointerLockError() {
      // Graceful fallback to click-and-drag look
      this.isPointerLocked = false;
    }

    /**
     * Drag-to-Look Fallback
     */
    onMouseDown(e) {
      if (!this.isActive || this.isPointerLocked) return;
      if (e.button === 0) { // Left click
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    }

    onMouseUp(e) {
      this.isDragging = false;
    }

    /**
     * Mouse Move Look Handler (Pointer Lock & Drag Fallback)
     */
    onMouseMove(e) {
      if (!this.isActive) return;

      let movementX = 0;
      let movementY = 0;

      if (this.isPointerLocked) {
        movementX = e.movementX || e.mozMovementX || 0;
        movementY = e.movementY || e.mozMovementY || 0;
      } else if (this.isDragging) {
        movementX = e.clientX - this.dragStart.x;
        movementY = e.clientY - this.dragStart.y;
        this.dragStart = { x: e.clientX, y: e.clientY };
      } else {
        return;
      }

      // Any deliberate mouse move cancels auto-walk
      if (Math.abs(movementX) > 2 || Math.abs(movementY) > 2) {
        if (this.autowalk && this.autowalk.isWalking) {
          this.autowalk.cancel();
          if (this.hud) this.hud.showToast('Auto-walk cancelled');
        }
      }

      const sensitivity = this.settings.get('mouseSensitivity') || 0.0022;
      const invertY = this.settings.get('invertY') ? -1 : 1;

      this.yaw -= movementX * sensitivity;
      this.pitch -= movementY * sensitivity * invertY;

      // Clamp vertical pitch to [-85 deg, +85 deg]
      const maxPitch = (85 * Math.PI) / 180;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }

    /**
     * Keyboard Input Handler
     */
    onKeyDown(e) {
      if (!this.isActive) return;

      const code = e.code;

      // Cancel auto-walk on any movement key
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        if (this.autowalk && this.autowalk.isWalking) {
          this.autowalk.cancel();
          if (this.hud) this.hud.showToast('Auto-walk cancelled');
        }
        if (this.tour && this.tour.isActive) {
          this.tour.stop();
          if (this.hud) this.hud.updateTourStatus(false, 0, 0, '', false);
        }
      }

      switch (code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'KeyQ':
          this.keys.climbUp = true;
          break;
        case 'KeyZ':
          this.keys.climbDown = true;
          break;

        case 'KeyE':
          this.interactDoor();
          break;

        case 'KeyM':
          this.toggleMinimap();
          break;

        case 'KeyL':
          if (this.hud) this.hud.toggleRoomDrawer();
          break;

        case 'KeyT':
          this.toggleTour();
          break;

        case 'BracketLeft': // [ -> Previous room
          this.stepTour(-1);
          break;

        case 'BracketRight': // ] -> Next room
          this.stepTour(1);
          break;

        case 'Tab':
          e.preventDefault();
          if (this.hud) this.hud.toggleVisibility();
          break;

        case 'KeyH':
        case 'Slash': // '?' is Shift + Slash
          if (this.hud) this.hud.toggleHelp();
          break;

        case 'KeyP':
          this.exit();
          break;

        case 'Escape':
          // If pointer locked, browser unlocks pointer. If already unlocked, exit walkthrough
          if (!this.isPointerLocked) {
            this.exit();
          }
          break;
      }
    }

    onKeyUp(e) {
      if (!this.isActive) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'KeyQ':
          this.keys.climbUp = false;
          break;
        case 'KeyZ':
          this.keys.climbDown = false;
          break;
      }
    }

    onVisibilityChange() {
      if (document.hidden) {
        // Pause movement and tours when tab is hidden
        this.keys = { forward: false, backward: false, left: false, right: false, sprint: false, climbUp: false, climbDown: false };
        if (this.tour && this.tour.isActive) {
          this.tour.pause();
        }
      }
    }

    onResize() {
      if (this.camera && this.renderer) {
        const container = this.renderer.domElement.parentElement;
        if (container) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(w, h);
        }
      }
    }

    /**
     * Door Interaction: Toggle open/closed state with 450ms smooth swing animation
     */
    interactDoor() {
      if (!this.activeDoorPrompt) return;

      const door = this.activeDoorPrompt;
      door.isOpen = !door.isOpen;

      // Register smooth animation
      const startAngle = door.currentAngle;
      const targetAngle = door.isOpen ? (door.swingAngle || (Math.PI / 4)) : 0;

      this.doorAnimations.push({
        door: door,
        startAngle: startAngle,
        targetAngle: targetAngle,
        startTime: performance.now(),
        duration: 450 // 450 ms ease-in-out
      });

      // Update collision state
      if (this.collision) {
        this.collision.setDoorState(door.id, door.isOpen);
      }

      if (this.hud) {
        this.hud.showToast(door.isOpen ? 'Door Opened' : 'Door Closed');
      }
    }

    /**
     * Check if a door is facing the player within 1.5 m (5.0 ft)
     */
    checkNearbyDoors() {
      if (!this.graph || !this.graph.doors) return;

      const playerX = this.playerPos.x;
      const playerZ = this.playerPos.z;

      // Look direction vector
      const dirX = -Math.sin(this.yaw);
      const dirZ = -Math.cos(this.yaw);

      const interactDist = 5.0; // ~1.5 m
      let closestDoor = null;
      let minDist = interactDist;

      // Check all registered doors in the graph
      for (const door of this.graph.doors.values()) {
        const dX = (door.center ? door.center.x : (door.x !== undefined ? door.x : 0));
        const dZ = (door.center ? door.center.z : (door.z !== undefined ? door.z : 0));
        const dx = dX - playerX;
        const dz = dZ - playerZ;
        const dist = Math.hypot(dx, dz);

        if (dist < minDist) {
          // Dot product check: is player facing the door?
          const toDoorX = dx / dist;
          const toDoorZ = dz / dist;
          const dot = dirX * toDoorX + dirZ * toDoorZ;

          if (dot > 0.25) { // Within ~75 degree cone in front of player
            minDist = dist;
            closestDoor = door;
          }
        }
      }

      this.activeDoorPrompt = closestDoor;

      if (this.hud) {
        if (closestDoor) {
          this.hud.showDoorPrompt(true, closestDoor.isOpen ? 'E  Close door' : 'E  Open door');
        } else {
          this.hud.showDoorPrompt(false);
        }
      }
    }

    /**
     * Update active door opening/closing animations
     */
    updateDoorAnimations(now) {
      if (this.doorAnimations.length === 0) return;

      this.doorAnimations = this.doorAnimations.filter(anim => {
        const elapsed = now - anim.startTime;
        const progress = Math.min(1.0, elapsed / anim.duration);

        // Ease in-out cubic
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentAngle = anim.startAngle + (anim.targetAngle - anim.startAngle) * ease;
        anim.door.currentAngle = currentAngle;

        // Apply rotation to Three.js door group if bound
        if (anim.door.mesh) {
          if (anim.door.isHoriz) {
            anim.door.mesh.rotation.y = currentAngle;
          } else {
            anim.door.mesh.rotation.y = Math.PI / 2 + currentAngle;
          }
        }

        return progress < 1.0;
      });
    }

    /**
     * Check current room containment with hysteresis
     */
    checkCurrentRoom(force = false) {
      if (!this.graph) return;

      const room = this.graph.getRoomAtPoint(
        this.playerPos.x,
        this.playerPos.z,
        this.currentFloor,
        this.lastRoomId,
        0.8 // 0.8 ft ~ 0.25m hysteresis
      );

      if (room && (room.id !== this.lastRoomId || force)) {
        this.currentRoom = room;
        this.lastRoomId = room.id;

        if (this.hud) {
          this.hud.updateCurrentRoom(this.currentFloor, room.name);
          this.hud.showRoomBanner(room);
        }

        if (this.minimap) {
          this.minimap.setCurrentRoom(room.id);
        }
      }
    }

    /**
     * Stair Level Transition: 'ground' <-> 'first'
     */
    onLevelTransition(newLevel) {
      this.currentFloor = newLevel;

      if (this.hud) {
        const title = newLevel === 'first' ? 'First Floor' : 'Ground Floor';
        this.hud.showToast(`Arrived at ${title}`);
        this.hud.updateCurrentRoom(newLevel, this.currentRoom ? this.currentRoom.name : '');
      }

      if (this.minimap) {
        this.minimap.setLevel(newLevel);
      }

      // Rebuild colliders for new active floor
      if (this.collision && this.collision.buildFromScene) {
        this.collision.buildFromScene(this.graph, window.threeFurnitureGroup || null, newLevel);
      }
    }

    /**
     * Auto-Walk to Room by ID
     */
    navigateToRoom(targetRoomId) {
      if (!this.graph || !targetRoomId) return;

      const targetNode = this.graph.nodes.get(targetRoomId);
      if (!targetNode) return;

      if (!targetNode.isReachable) {
        if (this.hud) this.hud.showToast('⚠️ No door connects this room');
        return;
      }

      const instantJump = this.settings.get('jumpInstantly');

      if (instantJump) {
        // Quick 150ms fade-through-black instant jump
        if (this.hud) {
          this.hud.fadeTransition(150).then(() => {
            this.currentFloor = targetNode.floor;
            this.playerPos = { x: targetNode.center.x, y: targetNode.center.y, z: targetNode.center.z };
            if (targetNode.focalLookAt) {
              const dx = targetNode.focalLookAt.x - targetNode.center.x;
              const dz = targetNode.focalLookAt.z - targetNode.center.z;
              this.yaw = Math.atan2(-dx, -dz);
            }
            this.checkCurrentRoom(true);
            if (this.minimap) this.minimap.setLevel(this.currentFloor);
          });
        }
        return;
      }

      const startRoomId = this.currentRoom ? this.currentRoom.id : this.graph.entranceNode.id;
      const pathResult = this.graph.findPath(startRoomId, targetRoomId);

      if (!pathResult || !pathResult.waypoints || pathResult.waypoints.length === 0) {
        if (this.hud) this.hud.showToast('No path found to target room');
        return;
      }

      this.autowalk.startPath(pathResult, {
        targetRoomId: targetRoomId,
        onDoorApproached: (doorId) => {
          // Open doors ahead automatically
          const door = this.graph.doors.get(doorId);
          if (door && !door.isOpen) {
            door.isOpen = true;
            this.doorAnimations.push({
              door: door,
              startAngle: door.currentAngle,
              targetAngle: door.swingAngle || (Math.PI / 4),
              startTime: performance.now(),
              duration: 450
            });
            if (this.collision) this.collision.setDoorState(door.id, true);
          }
        },
        onArrival: (finalPoint, focalPoint) => {
          if (focalPoint) {
            const dx = focalPoint.x - finalPoint.x;
            const dz = focalPoint.z - finalPoint.z;
            this.yaw = Math.atan2(-dx, -dz);
          }
          this.checkCurrentRoom(true);
          if (this.hud) this.hud.showToast(`Arrived in ${targetNode.name}`);
        }
      });

      if (this.hud) this.hud.showToast(`Walking to ${targetNode.name}...`);
    }

    /**
     * Guided Tour Controls
     */
    toggleTour() {
      if (!this.tour) return;
      if (this.tour.isActive) {
        this.tour.stop();
        if (this.hud) this.hud.updateTourStatus(false, 0, 0, '', false);
      } else {
        const stops = this.tour.startTour();
        if (stops.length > 0 && this.hud) {
          this.hud.updateTourStatus(true, 0, stops.length, stops[0].name, false);
          this.hud.showToast('Guided Tour Started');
        }
      }
    }

    handleTourAction(action) {
      if (!this.tour) return;
      if (action === 'pause') {
        const isPaused = this.tour.pause();
        if (this.hud) {
          const btn = document.getElementById('btnTourPause');
          if (btn) btn.textContent = isPaused ? '▶' : '❚❚';
        }
      } else if (action === 'next') {
        this.tour.next();
      } else if (action === 'prev') {
        this.tour.prev();
      } else if (action === 'stop') {
        this.tour.stop();
        if (this.hud) this.hud.updateTourStatus(false, 0, 0, '', false);
      }
    }

    stepTour(dir) {
      if (this.tour && this.tour.isActive) {
        if (dir > 0) this.tour.next();
        else this.tour.prev();
      } else if (this.graph) {
        // Step to next / previous room in logical sequence
        const nodes = Array.from(this.graph.nodes.values()).filter(n => n.isReachable);
        if (nodes.length === 0) return;
        const currentIdx = nodes.findIndex(n => n.id === this.lastRoomId);
        let nextIdx = currentIdx + dir;
        if (nextIdx < 0) nextIdx = nodes.length - 1;
        if (nextIdx >= nodes.length) nextIdx = 0;
        this.navigateToRoom(nodes[nextIdx].id);
      }
    }

    /**
     * Overlay Toggles & Settings
     */
    toggleMinimap() {
      if (!this.minimap) return;
      this.minimap.toggle();
      const isVis = this.minimap.visible;
      const btn = document.getElementById('btnHudMinimap');
      if (btn) btn.classList.toggle('active', isVis);
    }

    toggleHelp() {
      if (this.hud) this.hud.toggleHelp();
    }

    toggleDayNight() {
      if (window.set3DLighting) {
        const nextMode = (window.threeMode && window.threeMode.lighting === 'day') ? 'night' : 'day';
        window.set3DLighting(nextMode);
        if (this.hud) this.hud.showToast(`Lighting: ${nextMode.toUpperCase()}`);
      }
    }

    applySettings(settings) {
      if (this.camera && settings.fov) {
        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();
      }
      if (this.tour && settings.tourHoldDuration) {
        this.tour.holdDuration = settings.tourHoldDuration;
      }
    }

    /**
     * Update Camera Position and Euler Rotation
     */
    updateCameraTransform() {
      if (!this.camera) return;

      this.camera.position.set(
        this.playerPos.x,
        this.playerPos.y + this.eyeHeight,
        this.playerPos.z
      );

      // Pitch-Yaw First-Person Euler Rotation
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = 0;
    }

    /**
     * Main Animation & Physics Update Loop
     */
    updateLoop(now) {
      if (!this.isActive) return;

      const dt = Math.min(0.08, (now - this.lastTime) / 1000.0); // Clamp dt to prevent tunneling
      this.lastTime = now;

      // 1. Update active Auto-Walk or Tour
      if (this.autowalk && this.autowalk.isWalking) {
        const wpUpdate = this.autowalk.update(dt, this.playerPos);
        if (wpUpdate && (wpUpdate.pos || wpUpdate.position)) {
          const p = wpUpdate.pos || wpUpdate.position;
          this.playerPos.x = p.x;
          this.playerPos.y = p.y;
          this.playerPos.z = p.z;
          this.yaw = wpUpdate.yaw !== undefined ? wpUpdate.yaw : (wpUpdate.lookYaw !== undefined ? wpUpdate.lookYaw : this.yaw);
        }
      } else if (this.tour && this.tour.isActive) {
        this.tour.update(dt, this.playerPos);
      } else {
        // 2. Manual Character Kinematics & Acceleration
        const speed = this.keys.sprint ? (this.baseWalkSpeed * this.sprintMultiplier) : this.baseWalkSpeed;

        let moveForward = 0;
        let moveRight = 0;

        if (this.keys.forward) moveForward += 1;
        if (this.keys.backward) moveForward -= 1;
        if (this.keys.right) moveRight += 1;
        if (this.keys.left) moveRight -= 1;

        // Normalize diagonal movement
        const moveLen = Math.hypot(moveForward, moveRight);
        if (moveLen > 0.001) {
          moveForward /= moveLen;
          moveRight /= moveLen;
        }

        // Camera yaw direction vectors
        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);
        const rightX = Math.cos(this.yaw);
        const rightZ = -Math.sin(this.yaw);

        const targetVelX = (forwardX * moveForward + rightX * moveRight) * speed;
        const targetVelZ = (forwardZ * moveForward + rightZ * moveRight) * speed;

        // Smooth acceleration / deceleration
        const accel = (moveLen > 0) ? 14.0 : 18.0;
        this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accel * dt);
        this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accel * dt);

        const deltaMove = {
          x: this.velocity.x * dt,
          y: 0,
          z: this.velocity.z * dt
        };

        // 3. Resolve Collisions with Sub-steps and Sliding Response
        if (this.collision && (Math.abs(deltaMove.x) > 0.0001 || Math.abs(deltaMove.z) > 0.0001)) {
          const resolved = this.collision.resolveMovement(this.playerPos, deltaMove, 3);
          this.playerPos.x = resolved.x;
          this.playerPos.z = resolved.z;
        } else {
          this.playerPos.x += deltaMove.x;
          this.playerPos.z += deltaMove.z;
        }

        // 4. Update Stairs Elevation
        if (this.stairs) {
          const stairY = this.stairs.updateElevation(this.playerPos, dt, this.keys);
          this.playerPos.y = stairY;
        }
      }

      // 5. Update Camera Transform
      this.updateCameraTransform();

      // 6. Update Door Animations and Prompts
      this.updateDoorAnimations(now);
      this.checkNearbyDoors();

      // 7. Check Current Room with Hysteresis
      this.checkCurrentRoom();

      // 8. Update Minimap
      if (this.minimap && this.minimap.visible) {
        this.minimap.updatePlayer(this.playerPos.x, this.playerPos.z, this.yaw);
      }

      // 9. Render Scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      // 10. Frame Rate & Performance Monitoring
      this.frameCount++;
      if (now - this.fpsTimer >= 1000) {
        const currentFps = this.frameCount;
        this.frameCount = 0;
        this.fpsTimer = now;
        this.fpsHistory.push(currentFps);
        if (this.fpsHistory.length > 30) this.fpsHistory.shift();

        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        this.averageFPS = Math.round(sum / this.fpsHistory.length);

        // Adaptive Quality: if FPS stays below 40 for > 2 seconds, reduce shadow map resolution
        if (currentFps < 40) {
          this.lowFpsDuration += 1;
          if (this.lowFpsDuration >= 2 && this.renderer && this.renderer.shadowMap.enabled) {
            this.renderer.shadowMap.enabled = false;
            if (this.hud) this.hud.showToast('Adjusted rendering quality for optimal 60 FPS');
          }
        } else {
          this.lowFpsDuration = 0;
        }
      }

      this.animId = requestAnimationFrame(this._updateLoop);
    }
  }

  return {
    WalkthroughController
  };
}));
