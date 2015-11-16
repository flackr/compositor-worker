function StyleObserverController() {
  this.observerCount = 0;
  this.observers = {};
  this.raf = 0;
}

StyleObserverController.prototype = {
  registerObserver: function(styleObserver) {
    if (this.observers[styleObserver.id])
      return;
    this.observerCount++;
    this.observers[styleObserver.id] = styleObserver;
    if (!this.raf)
      this.raf = setTimeout(this.update.bind(this), 500);
  },

  unregisterObserver: function(styleObserver) {
    if (!this.observers[styleObserver.id])
      return;
    this.observerCount--;
    delete this.observers[styleObserver.id];
  },

  update: function() {
    this.raf = 0;
    for (var id in this.observers) {
      this.observers[id].checkNow();
    }
    if (this.observerCount)
      this.raf = setTimeout(this.update.bind(this), 500);
  },
};

var styleObserverController = new StyleObserverController();

var nextStyleObserverId = 0;
function StyleObserver(callback) {
  this.callback = callback;
  this.observed = [];
  this.id = nextStyleObserverId++;
}

StyleObserver.prototype = {
  observe: function(target, properties) {
    styleObserverController.registerObserver(this);
    var cs = getComputedStyle(target);
    var current = {};
    for (var j = 0; j < properties.length; j++) {
      current[properties[j]] = cs[properties[j]];
    }

    this.observed.push({'target': target, 'properties': properties, 'current': current});
  },

  disconnect: function() {
    styleObserverController.unregisterObserver(this);
    this.observed = [];
  },

  checkNow: function() {
    var changed = false;
    var changedElements = [];
    for (var i = 0; i < this.observed.length; i++) {
      var obj = this.observed[i];
      var cs = getComputedStyle(obj.target);
      for (var j = 0; j < obj.properties.length; j++) {
        var p = obj.properties[j];
        if (cs[p] != obj.current[p]) {
          changed = true;
          obj.current[p] = cs[p];
          changedElements.push(obj.target);
        }
      }
    }
    if (changed)
      this.callback(changedElements);
  },
};
