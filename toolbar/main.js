function createAnimatedScroller(toolbar) {
  var versions = toolbar.children;
  if (versions.length != 2)
    console.error('Expect exactly two versions of toolbar, found ' + versions.length);
  if (versions[0].children.length != versions[1].children.length)
    console.error('Expect each version of toolbar to have the same number of children');

  var url = 'cw.js';
  var worker = new CompositorWorker(url);
  var message = {
    scroller: new CompositorProxy(document.scrollingElement, ['scrollTop']),
    bar: new CompositorProxy(toolbar, ['transform']),
    shortHeight: 28,
    tallHeight: versions[1].getBoundingClientRect().height,
    toolbars: [[], []],
  };
  var shift = (message.tallHeight - message.shortHeight);
  versions[0].style.transform = 'translate(0, ' + shift + 'px)';
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < versions[0].children.length; j++) {
      var elem = versions[i].children[j];
      var b = elem.getBoundingClientRect();
      message.toolbars[i].push({proxy: new CompositorProxy(elem, ['opacity', 'transform']), bounds: {top: b.top, left: b.left, width: b.width, height:b.height}});
    }
  }
  console.log(message);
  worker.postMessage(message);
}

function generateContent() {
  var p = document.getElementsByClassName('paragraph')[0];
  for (var i = 0; i < 20; i++)
    p.parentNode.appendChild(p.cloneNode(true));
}

document.addEventListener('DOMContentLoaded', function() {
  generateContent();
  createAnimatedScroller(document.getElementsByClassName('toolbar')[0]);
});
