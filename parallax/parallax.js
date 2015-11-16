(function(scope) {
  "use strict";

  // This is a mapping of id to
  // {
  //   'scroller': scrollProxy,
  //   'parallaxer': parallaxProxy,
  //   'parallaxRate': rate,
  // };
  scope.parallaxMap = {};

  // This index is ussed to map DOM elements to entries in the parallaxMap.
  scope.parallaxId = 1;


  scope.isScrollAncestor = function(descendant, ancestor) {
    if (ancestor == document.scrollingElement)
      return true;
    return isContainingBlock(descendant, ancestor) &&
        getComputedStyle(ancestor).overflow != 'visible';
  }

  scope.findAncestorScroller = function(element) {
    var ancestor = element.parentNode;
    while (!scope.isScrollAncestor(element, ancestor)) {
      ancestor = ancestor.parentNode;
    }
    return ancestor;
  }

  scope.isMain = function() {
    return scope.window;
  };

  scope.tick = function(timestamp) {
    for (var i : scope.parallaxMap.keys()) {
      var record = scope.parallaxMap[i];
      var transform = record.parallaxer.transform;
      transform.translateSelf(0, record.scroller.scrollTop * record.parallaxRate);
      record.parallaxer.transform = transform;
    }
    scope.requestAnimationFrame(tick);
  };

  scope.initWorker = function() {
    console.log("init worker");

    self.onmessage = function(e) {
      console.log("onmessage");
      scope.parallaxMap = e.data;
    };

    scope.requestAnimationFrame(tick);
  };

  function addParallaxElement(element) {
    if (!element.parallaxId)
      element.parallaxId = scope.parallaxId++;

    scope.parallaxMap[element.parallaxId] = {
      'scroller': new CompositorProxy(scope.findAncestorScroller(element), ['scrollTop']),
      'parallaxer': new CompositorProxy(element, ['transform']),
      'parallaxRate': element.styleMap.get('--parallax-rate').value,
    };
  };

  scope.updateParallaxElement = function(element) {
    if (!element.styleMap.get('--parallax-rate')) {
      delete scope.parallaxMap[element.id];
    } else {
      addParallaxElement(element);
    }
    worker.postMessage(scope.parallaxMap);
  };

  scope.initMain = function() {
    console.log("init main");
    scope.worker = new CompositorWorker("parallax.js");
  };

  if (isMain())
    initMain();
  else
    initWorker();
})(self);
