(function(scope) {
  "use strict";

  scope.isMain = function() {
    return scope.window;
  };

  scope.tick = function(timestamp) {
    var t = bg.transform;
    t.m42 = Math.round(scroller.scrollTop*0.8);
    bg.transform = t;
    var t2 = bg2.transform;
    t2.m42 = Math.round(scroller.scrollTop*0.6);
    bg2.transform = t2;
    scope.requestAnimationFrame(tick);
  };

  scope.initWorker = function() {
    console.log("init worker");

    self.onmessage = function(e) {
      console.log("onmessage");

      scope.scroller = e.data[0];
      scope.bg = e.data[1];
      scope.bg2 = e.data[2];

      scope.requestAnimationFrame(tick);
    };
  };

  scope.initMain = function() {
    console.log("init main");

    scope.worker = new CompositorWorker("parallax.js");

    scope.scroller = new CompositorProxy(document.scrollingElement, ['scrollTop']);
    scope.bg = new CompositorProxy(document.getElementById("bg"), ['transform']);
    scope.bg2 = new CompositorProxy(document.getElementById("bg2"), ['transform']);

    worker.postMessage([scroller, bg, bg2]);
  };

  if (isMain())
    initMain();
  else
    initWorker();
})(self);
