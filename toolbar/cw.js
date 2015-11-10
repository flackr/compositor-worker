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

  function setPosition(delta) {
    height = Math.max(desc.shortHeight,
             Math.min(desc.tallHeight,
                      height - delta));
    var p = 1.0 - (height - desc.shortHeight) /
                  (desc.tallHeight - desc.shortHeight);
    console.log(delta, height, p);
    var t = desc.bar.transform;
    t.m42 = desc.scroller.scrollTop + (desc.shortHeight - desc.tallHeight) * p;
    desc.bar.transform = t;
    for (var i = 0; i < 2; i++) {
      var pos = p;
      if (i == 0) pos = 1.0 - pos;
      for (var j = 0; j < toolbars[i].length; j++) {
        toolbars[i][j].opacity = 1.0 - pos;
      }
    }
  }
 
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
    setPosition(curScroll);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

})(self);
