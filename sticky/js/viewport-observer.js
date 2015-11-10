// Incomplete / Naive implementation of ViewportObserver based on spec at:
// https://docs.google.com/document/d/14y3ReQo_TU8N81V1okwmfT5LtRxj-20UiNJ3ddU9vsI/edit?pli=1#heading=h.epew5hgbndxp
window.ViewportObserver = function() {

  function ViewportObserver(callback) {
    this.callback_ = callback;
    this.targets_ = [];
    this.changedRecords_ = [];
    this.notifyNow_ = this.notify_.bind(this);
  }

  ViewportObserver.prototype.observe = function(target) {
    if (this.targets_.indexOf(target) != -1)
      return;
    var listenOn = target == document.scrollingElement ? document : target;
    listenOn.addEventListener('scroll', this.onScroll_.bind(this, target));
    this.targets_.push(target);
    this.onScroll_(target);
  };

  ViewportObserver.prototype.onScroll_ = function(target) {
    this.changedRecords_.push({
      time: performance.now(),
      viewport: getViewportRect(target),
      element: target
    });
    this.notify_();
  };

  ViewportObserver.prototype.scheduleNotify_ = function() {
    if (!this.timeoutId_)
      this.timeoutId_ = setTimeout(this.notifyNow_, 0);
  };

  ViewportObserver.prototype.notify_ = function() {
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = undefined;
    this.callback_(this.changedRecords_);
    this.changedRecords_.length = 0;
  };

  return ViewportObserver;
}();
