var controllerUtils = require('../utils/tracked-controls');
var registerComponent = require('../core/component').registerComponent;

module.exports.Component = registerComponent('tracked-controls-webxr', {
  schema: {
    hand: {type: 'string', default: ''}
  },

  init: function () {
    this.controller = controllerUtils.findMatchingControllerWebXR(
      this.system.controllers,
      this.data.hand
    );
    // Legacy handle to the controller for old components.
    this.el.components['tracked-controls'].controller = this.controller;
  },

  tick: function () {
    var pose;
    var sceneEl = this.el.sceneEl;
    var object3D = this.el.object3D;
    if (!this.controller) { return; }
    pose = sceneEl.frame.getInputPose(this.controller, sceneEl.frameOfReference);
    object3D.matrix.elements = pose.targetRay.transformMatrix;
    object3D.matrix.decompose(object3D.position, object3D.rotation, object3D.scale);
  }
});
