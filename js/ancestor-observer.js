function AncestorObserver(name, pred, selfProperties, ancestorProperties) {

  function isContainingBlock(element) {
    // TODO: proper containing block detection.
    return getComputedStyle(element).position != 'static';
  }

  function findAncestorAndObserve(observer, target) {
    observer.disconnect();
    var element = target.parentNode;
    while (element) {
      observer.observe(element, ancestorProperties);
      if (pred(target, element))
        break;
      element = element.parentNode;
    }
    return element;
  }

  function AncestorObserver(callback) {
    this.callback = callback;
  }

  AncestorObserver.prototype = {
    observe: function(target) {

      var observer = target[name + 'Observer'] = new StyleObserver(this.styleChanged.bind(this, target));
      target[name] = findAncestorAndObserve(observer, target);
      observer.observe(target, selfProperties);
    },

    styleChanged: function(target) {
      var previousAncestor = target[name];
      target[name] = findAncestorAndObserve(target[name + 'Observer'], target);
      if (target[name] != previousAncestor)
        this.callback(target);
    },
  };

  return AncestorObserver;
}

function isContainingBlock(descendant, ancestor) {
  if (!ancestor.parentNode)
    return true;

  var descendantStyle = getComputedStyle(descendant);
  var ancestorStyle = getComputedStyle(ancestor);
  if (ancestorStyle.perspective != 'none' || ancestorStyle.transform != 'none')
    return true;
  if (descendantStyle.position == 'fixed')
    return false;

  if (descendantStyle.position == 'absolute') {
    return ['absolute', 'fixed', 'relative', 'sticky'].indexOf(
        ancestorStyle.position) != -1;
  } else {
    // in flow
    return ['block', 'inline-block', 'list-item', 'run-in', 'table', 'table-cell'].indexOf(
        ancestorStyle.display) != -1;
  }
}

ContainingBlockObserver = AncestorObserver('containingBlock', isContainingBlock, ['position'], ['display', 'perspective', 'position', 'transform']);

ScrollAncestorObserver = AncestorObserver('scrollAncestor', function(descendant, ancestor) {
  if (ancestor == document.scrollingElement)
    return true;
  return isContainingBlock(descendant, ancestor) &&
      getComputedStyle(ancestor).overflow != 'visible';
}, ['position'], ['display', 'perspective', 'overflow', 'position', 'transform']);
