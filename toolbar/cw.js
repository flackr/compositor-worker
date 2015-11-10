(function(scope) {

scope.onmessage = function(event) {
  console.log('CW received event');
  var desc = event.data;
  var toolbars = desc.toolbars;
  var position = 0;
  var lastPos = desc.scroller.scrollTop;
  var lastScroll = 0;
  var scrollChanged = 0;
  var height = desc.tallHeight;

  function setTransformBetween(elem, b1, b2, p, offset) {
    var t = elem.transform;
    t.m41 = (b2.left - b1.left - 0.5 * (b1.width - b2.width)) * p;
    t.m42 = (b2.top - b1.top - 0.5 * (b1.height - b2.height)) * p;
    t.m11 = (b2.width / b1.width - 1) * p + 1;
    t.m22 = (b2.height / b1.height - 1) * p + 1;
    elem.transform = t;
  }

  function setPosition(delta) {
    height = Math.max(desc.shortHeight,
             Math.min(desc.tallHeight,
                      height - delta));
    var p = 1.0 - (height - desc.shortHeight) /
                  (desc.tallHeight - desc.shortHeight);
    console.log(delta, height, p);
    var t = desc.bar.transform;
    var offset = (desc.shortHeight - desc.tallHeight) * p;
    t.m42 = desc.scroller.scrollTop + offset;
    desc.bar.transform = t;
    for (var i = 0; i < 2; i++) {
      var pos = p;
      if (i == 0) pos = 1.0 - pos;
      var other = 1 - i;
      for (var j = 0; j < toolbars[i].length; j++) {
        toolbars[i][j].proxy.opacity = 1.0 - pos;
        setTransformBetween(toolbars[i][j].proxy,
            toolbars[i][j].bounds,
            toolbars[other][j].bounds,
            pos, i == 0 ? 0 : (desc.tallHeight - desc.shortHeight));
      }
    }
  }
  var lastScrollTime;
  var v = 0;
 
  function raf(ts) {
    var curScroll = desc.scroller.scrollTop - lastPos;
    if (curScroll > 0 && lastScroll <= 0) {
      lastScroll = 1;
      scrollChanged = lastPos;
    } else if (curScroll < 0 && lastScroll >= 0) {
      lastScroll = -1;
      scrollChanged = lastPos;
    }
    lastPos = desc.scroller.scrollTop;
    if (curScroll != 0) {
      lastScrollTime = ts;
      v = 2;
      setPosition(curScroll);
    } else if (lastScroll != 0 && ts > lastScrollTime + 0.5) {
      setPosition(v * lastScroll);
      v += 0.3;
      v = Math.min(100, v);
    }
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

})(self);
