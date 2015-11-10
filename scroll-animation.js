(function(scope) {
  "use strict";

  scope.isMain = function() {
    return scope.window;
  };

  scope.tick = function(timestamp) {
    var newOffset = (Math.sin(timestamp ) + 1) * 500;
    scroller.scrollTop = newOffset;
    scope.requestAnimationFrame(tick);
  };

  scope.initWorker = function() {
    console.log("init worker");
    self.onmessage = function(e) {
      console.log("onmessage");
      scope.scroller = e.data[0];
      scope.requestAnimationFrame(tick);
    };
  };

  scope.initMain = function() {
    console.log("init main");

    scope.worker = new CompositorWorker("scroll-animation.js");
    var scrollElement = document.getElementById("scroller");
    scope.scroller = new CompositorProxy(scrollElement, ['scrollTop']);
    scrollElement.addEventListener("scroll", function(e) {
      this.style.top = (910 - e.target.scrollTop) + "px";
      var start = new Date();
      while (true) {
        var now = new Date();
        if (now.getTime() - start.getTime() > 200)
          break;
      }
    }.bind(document.getElementById("thingy")));
    worker.postMessage([scroller]);
  };

  if (isMain())
    initMain();
  else
    initWorker();
})(self);
