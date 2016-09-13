(function(scope) {
  "use strict";

  scope.isMain = function() {
    return scope.window;
  };

  scope.tick = function(timestamp) {
    if (!scroller.initialized || !bg.initialized || !bg2.initialized || !bg3.initialized) {
      scope.requestAnimationFrame(tick);
      return;
    }
    var t = bg.transform;
    t.m42 = Math.round(scroller.scrollTop*0.8);
    bg.transform = t;
    var t2 = bg2.transform;
    t2.m42 = Math.round(scroller.scrollTop*0.6);
    bg2.transform = t2;
    
    var t3 = bg3.transform;
    t3.m42 = Math.round(scroller.scrollTop);
    bg3.transform = t3;
    scope.requestAnimationFrame(tick);
  };

  scope.initWorker = function() {
    console.log('Init on worker');
    self.postMessage('worker is alive');

    self.onmessage = function(e) {
      scope.scroller = e.data[0];
      scope.bg = e.data[1];
      scope.bg2 = e.data[2];
      scope.bg3 = e.data[3];
      self.postMessage('proxies received');

      scope.requestAnimationFrame(tick);
    };
  };

  scope.initMain = function() {
    console.log("init main");

    scope.worker = new CompositorWorker("parallax.js");

    scope.scroller = new CompositorProxy(document.getElementById("scroller"), ['scrollTop']);
    scope.bg = new CompositorProxy(document.getElementById("bg"), ['transform']);
    scope.bg2 = new CompositorProxy(document.getElementById("bg2"), ['transform']);
    scope.bg3 = new CompositorProxy(document.getElementById("stuck"), ['transform']);
    
    worker.postMessage([scroller, bg, bg2, bg3]);
    worker.onmessage = function(e) {
      console.log('Worker said: ' + e.data);
    }
  };

  if (isMain())
    initMain();
  else
    initWorker();
})(self);
