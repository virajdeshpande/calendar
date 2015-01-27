function Event(start, end) {
	this.start = start;
  this.end = end;
  this.columnIndex = 0;
  this.totalColumnsInConflictingGraph = 1;
  this.duration = end - start;
  this.title = "Sample Item";
  this.location = "Sample Location";
  this.priorConflictingEvents = []; // after we sort the events we want to store only those conflicting events that starts before this event
}

Event.prototype.conflictsWith = function(anotherEvent) {
  if(this.start >= anotherEvent.end || this.end <= anotherEvent.start) {
      return false;
  }
  return true;
}

Event.prototype.toString = function() {
  return "Event Starting at: " + this.start + ", for duration of: " + this.duration;
}

Object.defineProperties(Event.prototype, {
  "left": {
    get: function() {
      return this.columnIndex * 100 / this.totalColumnsInConflictingGraph;
    }
  },
  "width": {
    get: function() {
      return 100 / this.totalColumnsInConflictingGraph; // in percentage
    }
  },
  "height": {
    get: function() {
      return this.end - this.start;
    }
  },
  "top": {
    get: function() {
      return this.start;
    }
  },
});