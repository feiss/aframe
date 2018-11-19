var registerSystem = require('../core/system').registerSystem;

/**
 * Tracked controls system.
 * Maintain list with available tracked controllers.
 */
module.exports.System = registerSystem('tracked-controls-webxr', {
  init: function () {
    var sceneEl = this.el;
    var xrSession = sceneEl.xrSession;
    this.onEnterVR = this.onEnterVR.bind(this);
    this.onInputSourcesChange = this.onInputSourcesChange.bind(this);
    if (xrSession) { xrSession.addEventListener('inputsourceschange', this.onInputSourcesChange); }
    sceneEl.addEventListener('enter-vr', this.onEnterVR);
  },

  onEnterVR: function () {
    var sceneEl = this.el;
    if (!sceneEl.xrSession) { return; }
    sceneEl.xrSession.addEventListener('inputsourceschange', this.onInputSourcesChange);
  },

  onInputSourcesChange: function () {
    this.controllers = this.el.xrSession.getInputSources();
    this.el.emit('controllersupdated', undefined, false);
  }
});
