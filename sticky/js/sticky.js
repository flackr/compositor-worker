(function(scope) {
  "use strict";
  function getStickyElements(nodelist, node) {
    nodelist = nodelist || [];
    node = node || document.body;
    if (node.classList.contains('sticky'))
      nodelist.push(node);
    // Q: How do we support this position property?
    // if (getComputedStyle(node).position == 'sticky')
    //   nodelist.append(node);

    // Q: How do we just do work on sticky elements rather than entire DOM?
    for (var i = 0; i < node.children.length; ++i) {
      getStickyElements(nodelist, node.children[i]);
    }
    return nodelist;
  }

  function installStickyHandler(scroller, element, sticky_info) {
    var main_info = {
      'sticky': new WrapElement(element),
      'scroller': new WrapElement(scroller),
      'limits': sticky_info.limits,
    };

    // Install a viewport observer to update position on the main thread.
    var observer = new ViewportObserver(updateStickyPosition.bind(null, main_info));
    observer.observe(scroller);
    // TODO: Install compositor worker to update on compositor thread.
  }

  function updateStickyPosition(info) {
    // Find sticky position
    // Note: top and left take priority over bottom and right as per spec:
    var offsetX, offsetY;
    if (info.limits.y.attachment == 'top')
      offsetY = Math.min(Math.max(info.limits.y.min, info.scroller.scrollTop() - info.limits.y.top), info.limits.y.max);
    if (info.limits.y.attachment == 'bottom')
      offsetY = Math.max(Math.min(info.limits.y.max, info.scroller.scrollTop() + info.limits.y.bottom), info.limits.y.min);
    if (info.limits.x.attachment == 'left')
      offsetX = Math.min(Math.max(info.limits.x.min, info.scroller.scrollLeft() - info.limits.x.left), info.limits.x.max);
    if (info.limits.x.attachment == 'right')
      offsetX = Math.max(Math.min(info.limits.x.max, info.scroller.scrollLeft() + info.limits.x.right), info.limits.x.min);

    // Q: How should we really move the element around? This is overloading the top / left properties which has a specific meaning for sticky.
    // A: Probably hidden position attributes (e.g. used left, used top), but how do we want to expose these?
    info.sticky.setTransform(offsetX || 0, offsetY || 0, info.limits.id);
  }

  function gatherStickyInfo() {
    var nodes = getStickyElements();
    scope.sticky_info = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var cb = getContainingBlockElement(node);
      var s = getContainingScrollingElement(node);

      // Q: Need to be notified when sticky node is removed / moved - Mutation Observer?
      var info = {
        sticky: scope.CompositorProxy ? new CompositorProxy(node, ['transform']) : undefined,
        scroller: scope.CompositorProxy ? new CompositorProxy(s, ['scrollTop', 'scrollLeft']) : undefined,
        limits: scope.getStickyOffsetLimits(node, cb, s, getStickyOffsets(node)),
      }
      scope.sticky_info.push(info);
      installStickyHandler(s, node, info);
    }
    if (scope.CompositorWorker) {
      scope.worker = new CompositorWorker('js/sticky.js');
      scope.worker.postMessage(scope.sticky_info);
    }
  }

  scope.getStickyOffsetLimits = function(sticky, containing, scroller, clamp) {
    var c = containing.getBoundingClientRect();
    var s = sticky.getBoundingClientRect();
    var v = getViewportRect(scroller);

    var limits = {
    id: sticky.id,
    x: {
      left: s.left + scroller.scrollLeft - (clamp.left || 0),
      right: v.right - s.right - scroller.scrollLeft - (clamp.right || 0),
      min: c.left - s.left + (clamp.left || 0),
      max: c.right - s.right - (clamp.right || 0),
    },
    y: {
      top: s.top + scroller.scrollTop - (clamp.top || 0),
      bottom: v.bottom - s.bottom - scroller.scrollTop - (clamp.bottom || 0),
      min: c.top - s.top + (clamp.top || 0),
      max: c.bottom - s.bottom - (clamp.bottom || 0),
    }};
    if (clamp.bottom)
      limits.y.attachment = 'bottom';
    if (clamp.top)
      limits.y.attachment = 'top';
    if (clamp.right)
      limits.x.attachment = 'right';
    if (clamp.left)
      limits.x.attachment = 'left';
    return limits;
  }

  function getStickyOffsets(node) {
    var style = getComputedStyle(node);
    // Note: this assumes top/left/right/bottom will be set in 'px'.
    // TODO: Support percentage?
    var info = {
      'top': style.top == 'auto' ? undefined : parseFloat(style.top),
      'left': style.left == 'auto' ? undefined : parseFloat(style.left),
      'right': style.right == 'auto' ? undefined : parseFloat(style.right),
      'bottom': style.bottom == 'auto' ? undefined : parseFloat(style.bottom),
    };
    node.style.top = node.style.left = node.style.right = node.style.bottom = 'auto';
    return info;
  }

  scope.compositorUpdate = function() {
    for (var i = 0; i < scope.sticky_info.length; i++) {
      updateStickyPosition(scope.sticky_info[i]);
    }
    scope.requestAnimationFrame(scope.compositorUpdate);
  }

  scope.WrapElement = function(element) {
    this.element_ = element;
  }
  scope.WrapElement.prototype.scrollTop = function() { return this.element_.scrollTop; };
  scope.WrapElement.prototype.scrollLeft = function() { return this.element_.scrollLeft; };
  scope.WrapElement.prototype.setTransform = function(x, y, id, extra) {
    this.element_.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  };

  scope.WrapCompositorProxy = function(proxy) {
    this.proxy_ = proxy;
  }
  scope.WrapCompositorProxy.prototype.scrollTop = function() { return this.proxy_.scrollTop; };
  scope.WrapCompositorProxy.prototype.scrollLeft = function() { return this.proxy_.scrollLeft; };
  scope.WrapCompositorProxy.prototype.setTransform = function(x, y, id, extra) {
    var t = this.proxy_.transform;
    t.m41 = x;
    t.m42 = y;
    this.proxy_.transform = t;
  };


  function initCompositorWorker() {
    console.log('Init on compoositor worker');
    self.onmessage = function(e) {
      scope.sticky_info = e.data;
      // Wrap all of the compositor proxies to match expectations.
      for (var i = 0; i < sticky_info.length; i++) {
        sticky_info[i].sticky = new scope.WrapCompositorProxy(sticky_info[i].sticky);
        sticky_info[i].scroller = new scope.WrapCompositorProxy(sticky_info[i].scroller);
      }
      scope.requestAnimationFrame(scope.compositorUpdate);
      console.log('onmessage on compositor');
    };
  }


  if (scope.window) {
    scope.document.addEventListener('DOMContentLoaded', gatherStickyInfo);
  } else {
    scope.sticky_info = [];
    initCompositorWorker();
  }
})(self);
