(function(scope) {
  "use strict";

  scope.isMain = function() {
    return scope.window;
  };

  scope.tick = function(timestamp) {
    console.log("tick (scrollTop = " + scroller.scrollTop + ", transform = " +
        bg.transform + ")");
    var t = bg.transform;
    t.m42 = Math.round(scroller.scrollTop);
    bg.transform = t;
    var t = bg_parallax.transform;
    t.m42 = 0.8 * scroller.scrollTop;
    bg_parallax.transform = t;
    scope.requestAnimationFrame(tick);
  };

  scope.initWorker = function() {
    console.log("init worker");

    self.onmessage = function(e) {
      console.log("onmessage");

      scope.scroller = e.data[0];
      scope.bg = e.data[1];
      scope.bg_parallax = e.data[2];

      scope.requestAnimationFrame(tick);
    };
  };

  scope.initMain = function() {
    console.log("init main");

    scope.worker = new CompositorWorker("parallax.js");

    scope.scroller = new CompositorProxy(document.getElementById("scroller"), ['scrollTop']);
    scope.bg = new CompositorProxy(document.getElementById("bg"), ['transform']);
    scope.bg_parallax = new CompositorProxy(document.getElementById("bg-parallax"), ['transform']);

    worker.postMessage([scroller, bg, bg_parallax]);
  };

  if (isMain())
    initMain();
  else
    initWorker();
})(self);
