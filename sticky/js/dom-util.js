function getViewportRect(target) {
  // Q: What's the correct way to get the scroller bounds (if the scroller is the document)?
  if (target == document.scrollingElement) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
  }
  return target.getBoundingClientRect();
}

function getContainingBlockElement(node) {
  if (node.style.position == 'absolute') {
    do {
      node = node.parentNode;
    } while (['absolute', 'fixed', 'relative', 'sticky'].indexOf(getComputedStyle(node).position) == -1);
    return node || document;
  }
    do {
      node = node.parentNode;
    } while (['block', 'inline-block', 'list-item', 'run-in', 'table', 'table-cell'].indexOf(getComputedStyle(node).display) == -1);
    return node || document;
}

function isScrollable(element) {
  // Q: Why is scrollHeight > clientHeight on body when document is scrollable node?
  return getComputedStyle(element).overflow != 'visible' && element.scrollHeight > element.clientHeight || element == document.scrollingElement;
}

function getContainingScrollingElement(element) {
  do {
    element = getContainingBlockElement(element);
  } while (element && !isScrollable(element));
  return element;
}
