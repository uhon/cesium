import { ControllerHost } from "../../../index.js";

describe("Scene/Controllers/ControllerHost", function () {
  let element;

  function createMockController(enabled) {
    return {
      enabled: enabled ?? true,
      connectedCallback: jasmine.createSpy("connectedCallback"),
      disconnectedCallback: jasmine.createSpy("disconnectedCallback"),
      firstUpdate: jasmine.createSpy("firstUpdate"),
      update: jasmine.createSpy("update"),
    };
  }

  beforeEach(function () {
    element = document.createElement("div");
  });

  it("is enabled by default", function () {
    const host = new ControllerHost();
    expect(host.enabled).toBe(true);
  });

  it("does not update any controller while disabled", function () {
    const host = new ControllerHost();
    const controller = createMockController();
    host.registerController(controller, element);

    host.enabled = false;
    host.update({}, undefined);

    expect(controller.firstUpdate).not.toHaveBeenCalled();
    expect(controller.update).not.toHaveBeenCalled();
  });

  it("does not update a controller while disabled even if the controller is enabled", function () {
    const host = new ControllerHost();
    const controller = createMockController(true);
    host.registerController(controller, element);

    host.enabled = false;
    host.update({}, undefined);

    expect(controller.update).not.toHaveBeenCalled();

    host.enabled = true;
    host.update({}, undefined);

    expect(controller.update).toHaveBeenCalled();
  });

  it("invokes firstUpdate again when re-enabled, so input accumulated while suspended is discarded", function () {
    const host = new ControllerHost();
    const controller = createMockController();
    host.registerController(controller, element);

    host.update({}, undefined);
    expect(controller.firstUpdate.calls.count()).toBe(1);

    host.update({}, undefined);
    expect(controller.firstUpdate.calls.count()).toBe(1);

    host.enabled = false;
    host.enabled = true;
    host.update({}, undefined);

    expect(controller.firstUpdate.calls.count()).toBe(2);
    expect(controller.update.calls.count()).toBe(3);
  });

  it("does not re-arm firstUpdate when enabled is set to its current value", function () {
    const host = new ControllerHost();
    const controller = createMockController();
    host.registerController(controller, element);

    host.update({}, undefined);
    expect(controller.firstUpdate.calls.count()).toBe(1);

    host.enabled = true;
    host.update({}, undefined);

    expect(controller.firstUpdate.calls.count()).toBe(1);
  });

  it("re-arms firstUpdate for every registered controller", function () {
    const host = new ControllerHost();
    const first = createMockController();
    const second = createMockController();
    host.registerController(first, element);
    host.registerController(second, element);

    host.update({}, undefined);
    expect(first.firstUpdate.calls.count()).toBe(1);
    expect(second.firstUpdate.calls.count()).toBe(1);

    host.enabled = false;
    host.enabled = true;
    host.update({}, undefined);

    expect(first.firstUpdate.calls.count()).toBe(2);
    expect(second.firstUpdate.calls.count()).toBe(2);
  });

  it("skips controllers that are individually disabled", function () {
    const host = new ControllerHost();
    const controller = createMockController(false);
    host.registerController(controller, element);

    host.update({}, undefined);

    expect(controller.update).not.toHaveBeenCalled();
  });

  it("updates controllers in priority order", function () {
    const host = new ControllerHost();
    const order = [];
    const first = createMockController();
    const second = createMockController();
    first.update = jasmine.createSpy("update").and.callFake(function () {
      order.push("first");
    });
    second.update = jasmine.createSpy("update").and.callFake(function () {
      order.push("second");
    });

    host.registerController(first, element);
    host.registerController(second, element, 0);

    host.update({}, undefined);

    expect(order).toEqual(["second", "first"]);
  });

  it("tracks the number of registered controllers", function () {
    const host = new ControllerHost();
    const controller = createMockController();

    expect(host.controllerCount).toBe(0);

    host.registerController(controller, element);
    expect(host.controllerCount).toBe(1);
    expect(controller.connectedCallback).toHaveBeenCalledWith(element);

    host.unregisterController(controller, element);
    expect(host.controllerCount).toBe(0);
    expect(controller.disconnectedCallback).toHaveBeenCalledWith(element);
  });
});
