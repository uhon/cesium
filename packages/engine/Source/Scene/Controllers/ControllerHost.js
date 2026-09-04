/**
 * Collects an array of Controller objects that can be registered with the scene to handle input events, camera animations, and other interactions.
 * @class
 * @see {@link Controller}
 * @see {@link Scene#controllerHost}
 */
class ControllerHost {
  /**
   * Creates an instance of a <code>ControllerHost</code>. Typically, a <code>ControllerHost</code> is created by the Scene constructor and accessed via {@link Scene#controllerHost}.
   * @see {@link Scene#controllerHost}
   */
  constructor() {
    /**
     * @type {Controller[]}
     * @private
     */
    this._controllers = [];
    this._needsUpdate = new Set();
    this._enabled = true;
  }

  /**
   * The number of controllers registered to this host.
   * @type {number}
   * @readonly
   */
  get controllerCount() {
    return this._controllers.length;
  }

  /**
   * Determines if the registered controllers are updated each frame. When <code>false</code>, no registered controller is updated, regardless of its own {@link Controller#enabled} value. This is used to suspend user input for the duration of a camera flight, and is the {@link ControllerHost} equivalent of {@link ScreenSpaceCameraController#enableInputs}.
   * <p>
   * Input received while the host is disabled is discarded rather than replayed: when the host is re-enabled, every registered controller is sent {@link Controller#firstUpdate} again before its next {@link Controller#update}, so that any input accumulated while suspended does not produce a sudden camera jump.
   * </p>
   * @type {boolean}
   * @default true
   */
  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    if (this._enabled === value) {
      return;
    }

    this._enabled = value;

    if (value) {
      for (const controller of this._controllers) {
        this._needsUpdate.add(controller);
      }
    }
  }

  /**
   * Registers a controller implementation with this host.
   * @param {Controller} controller An implementation of the Controller interface to register with this host.
   * @param {HTMLElement} element The DOM element containing the Cesium scene.
   * @param {number} [priority=0] An index, less than or equal to the current count of registed controllers, that defines the precedence of the new controller relative to those previously registered. A priority of <code>0</code> would mean the new controller would apply its updates before any other controller. As subsequent controllers are updated, their effects are applied on top of any previous update effects. If omitted, the new controller becomes the highest priority, i.e., its updates are applied after all other controllers.
   */
  registerController(controller, element, priority) {
    const index = priority ?? this.controllerCount;
    this._controllers.splice(index, 0, controller);
    this._needsUpdate.add(controller);
    controller.connectedCallback(element);
  }

  /**
   * Unregisters a controller implementation from this host.
   * @param {Controller} controller An implementation of the Controller interface to unregister from this host.
   * @param {HTMLElement} element The DOM element containing the Cesium scene.
   */
  unregisterController(controller, element) {
    const controllers = this._controllers;
    const index = controllers.indexOf(controller);
    if (index !== -1) {
      controllers.splice(index, 1);
      controller.disconnectedCallback(element);
    }
  }

  /**
   * Invoked once per frame by the host scene. Updates all registered controllers in order of their priority. Does nothing when {@link ControllerHost#enabled} is <code>false</code>.
   * @param {Scene} scene The host scene.
   * @param {JulianDate} time The current simulation time.
   */
  update(scene, time) {
    if (!this._enabled) {
      return;
    }

    for (const controller of this._controllers) {
      if (!controller.enabled) {
        continue;
      }

      if (this._needsUpdate.has(controller)) {
        controller.firstUpdate(scene, time);
        this._needsUpdate.delete(controller);
      }

      controller.update(scene, time);
    }
  }
}

export default ControllerHost;
