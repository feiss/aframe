/* global THREE */
var registerComponent = require('../core/component').registerComponent;
var utils = require('../utils/');

registerComponent('pad-controls', {
  schema: {
    hand: {default: 'right'}
  },

  init: function () {
    var config = this.config;
    var data = this.data;
    var el = this.el;
    var self = this;
    var padEl = this.padEl = document.createElement('a-entity');
    var touchEl = this.touchEl = document.createElement('a-entity');
    var wrapperTouchEl = this.wrapperTouchEl = document.createElement('a-entity');
    var wrapperPadEl = this.wrapperPadEl = document.createElement('a-entity');
    var cursorEl = this.cursorEl = document.createElement('a-entity');
    var cursorWrapperEl = this.cursorWrapperEl = document.createElement('a-entity');

    this.euler = new THREE.Euler();

    this.shows = 0;

    cursorEl.setAttribute('geometry', {primitive: 'ring', radiusInner: 0.05, radiusOuter: 0.08});
    cursorEl.setAttribute('material', {shader: 'flat', color: 'red', side: 'double'});
    cursorEl.setAttribute('visible', false);
    cursorWrapperEl.appendChild(cursorEl);
    this.el.sceneEl.appendChild(cursorWrapperEl);

    touchEl.id = 'touchpad';
    touchEl.setAttribute('position', '0 -2.5 -3');
    touchEl.setAttribute('geometry', {primitive: 'plane', width: 2.0, height: 1.5});
    touchEl.setAttribute('material', {shader: 'flat', color: 'pink', side: 'double'});

    touchEl.setAttribute('visible', false);
    wrapperTouchEl.appendChild(touchEl);
    this.el.sceneEl.appendChild(wrapperTouchEl);

    padEl.setAttribute('position', '0 1.0 -3');
    padEl.setAttribute('geometry', {primitive: 'plane', width: 2.0, height: 1.5});
    padEl.setAttribute('material', {shader: 'flat', color: 'pink', side: 'double'});

    padEl.setAttribute('visible', false);
    wrapperPadEl.appendChild(padEl);
    this.el.sceneEl.appendChild(wrapperPadEl);

    this.showPad = this.showPad.bind(this);
    this.hidePad = this.hidePad.bind(this);
    this.onIntersection = this.onIntersection.bind(this);
    el.addEventListener('buttondown', this.showPad);
    el.addEventListener('buttonup', this.hidePad);
    touchEl.addEventListener('raycaster-intersected', this.onIntersection);
    touchEl.addEventListener('raycaster-intersected-cleared', this.onIntersectionCleared);

    // Set all controller models.
    el.setAttribute('oculus-touch-controls', {hand: data.hand});
    el.setAttribute('vive-controls', {hand: data.hand});
    el.setAttribute('windows-motion-controls', {hand: data.hand});

    // Wait for controller to connect, or have a valid pointing pose, before creating ray
    el.addEventListener('controllerconnected', createRay);
    el.addEventListener('controllerdisconnected', hideRay);
    el.addEventListener('controllermodelready', function (evt) {
      createRay(evt);
      self.modelReady = true;
    });

    function createRay (evt) {
      var controllerConfig = config[evt.detail.name];

      if (!controllerConfig) { return; }

      // Show the line unless a particular config opts to hide it, until a controllermodelready
      // event comes through.
      var raycasterConfig = utils.extend({
        showLine: false
      }, controllerConfig.raycaster || {});

      // The controllermodelready event contains a rayOrigin that takes into account
      // offsets specific to the loaded model.
      if (evt.detail.rayOrigin) {
        raycasterConfig.origin = evt.detail.rayOrigin.origin;
        raycasterConfig.direction = evt.detail.rayOrigin.direction;
        raycasterConfig.showLine = false;
      }

      raycasterConfig.objects = '#touchpad';

      // Only apply a default raycaster if it does not yet exist. This prevents it overwriting
      // config applied from a controllermodelready event.
      if (evt.detail.rayOrigin || !self.modelReady) {
        el.setAttribute('raycaster', raycasterConfig);
      } else {
        el.setAttribute('raycaster', 'showLine', true);
      }
    }

    function hideRay () {
      el.setAttribute('raycaster', 'showLine', false);
    }
  },

  showPad: function () {
    var camera = this.el.sceneEl.camera;
    // var touchEl = this.touchEl;
    var euler = this.euler;
    this.shows++;
    euler.setFromRotationMatrix(camera.matrixWorld, 'YXZ');
    this.wrapperPadEl.object3D.rotation.y = this.headRotation = euler.y;
    // this.wrapperPadEl.object3D.quaternion.copy(camera.quaternion);
    this.padEl.setAttribute('visible', true);

    this.wrapperTouchEl.object3D.quaternion.copy(this.el.object3D.quaternion);
    this.wrapperTouchEl.object3D.position.copy(this.el.object3D.position);
    // touchEl.setAttribute('visible', true);

    this.cursorEl.setAttribute('visible', true);
  },

  hidePad: function () {
    this.shows--;
    if (this.shows !== 0) { return; }
    this.padEl.setAttribute('visible', false);
    this.cursorEl.setAttribute('visible', false);
  },

  onIntersection: function (evt) {
    this.evt = evt;
  },

  onIntersectionCleared: function () {
    this.evt = undefined;
  },

  updateCursor: function () {
    var evt = this.evt;
    var offset;
    if (!evt) { return; }
    var intersection = evt.detail.getIntersection(evt.target);
    if (!intersection) { return; }
    console.log(this.headRotation);
    offset = this.headRotation < Math.PI / 2.0 && this.headRotation > -Math.PI / 2.0 ? 0.01 : -0.01;
    this.touchEl.object3D.worldToLocal(intersection.point);
    this.padEl.object3D.localToWorld(intersection.point);
    this.cursorWrapperEl.object3D.position.copy(intersection.point);
    this.cursorWrapperEl.object3D.position.z += offset;
    this.cursorEl.object3D.quaternion.copy(this.wrapperPadEl.object3D.quaternion);
  },

  tick: function () {
    this.updateCursor();
  },

  config: {
    'daydream-controls': {
      cursor: {downEvents: ['trackpaddown'], upEvents: ['trackpadup']}
    },

    'gearvr-controls': {
      cursor: {downEvents: ['trackpaddown', 'triggerdown'], upEvents: ['trackpadup', 'triggerup']},
      raycaster: {origin: {x: 0, y: 0.0005, z: 0}}
    },

    'oculus-go-controls': {
      cursor: {downEvents: ['trackpaddown', 'triggerdown'], upEvents: ['trackpadup', 'triggerup']},
      raycaster: {origin: {x: 0, y: 0.0005, z: 0}}
    },

    'oculus-touch-controls': {
      cursor: {downEvents: ['triggerdown'], upEvents: ['triggerup']},
      raycaster: {origin: {x: 0, y: 0, z: 0}}
    },

    'vive-controls': {
      cursor: {downEvents: ['triggerdown'], upEvents: ['triggerup']}
    },

    'windows-motion-controls': {
      cursor: {downEvents: ['triggerdown'], upEvents: ['triggerup']},
      raycaster: {showLine: false}
    }
  }
});
