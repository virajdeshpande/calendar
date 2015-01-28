function Calendar() {
  this.timeslots = [
    {time: "9:00", ampm: "am"},
    {time: "9:30"},
    {time: "10:00", ampm: "am"},
    {time: "10:30"},
    {time: "11:00", ampm: "am"},
    {time: "11:30"},
    {time: "12:00", ampm: "am"},
    {time: "12:30"},
    {time: "1:00", ampm: "pm"},
    {time: "1:30"},
    {time: "2:00", ampm: "pm"},
    {time: "2:30"},
    {time: "3:00", ampm: "pm"},
    {time: "3:30"},
    {time: "4:00", ampm: "pm"},
    {time: "4:30"},
    {time: "5:00", ampm: "pm"},
    {time: "5:30"},
    {time: "6:00", ampm: "pm"},
    {time: "6:30"},
    {time: "7:00", ampm: "pm"},
    {time: "7:30"},
    {time: "8:00", ampm: "pm"},
    {time: "8:30"},
    {time: "9:00", ampm: "pm"}
  ]
  /*

  // We can compute the array as well but hardcoding is efficient since we know the facts
  // 12 Hrs starting at 9 am with 30 min difference

  var someDate = new Date(2015,1,1,9,0); // Jan 1st 2010, 9
  var hoursInCalendar = 12;
  var minTimeInMiliSec = 30 * 60 * 1000;
  var halfTime = false;

  this.timeslots = [];

  for(var i = 0; i < 24; i++) {
    var newTime = new Date(someDate.getTime() + (i * minTimeInMiliSec));
    var timeSlotObj = {halfTime: halfTime};
    var newHour = newTime.getHours();
    var newMinute = newTime.getMinutes();
    timeSlotObj.hour = (newHour > 12 ? newHour - 12 : newHour) + ":" + (newMinute == 0 ? "00" : newMinute);
    if(!halfTime) {
      timeSlotObj.ampmString = newHour > 12 ? "pm" : "am";
    }    
    this.timeslots.push(timeSlotObj);
    halfTime = !halfTime;
  }

  console.log(this.timeslots);
  */

}

Calendar.prototype.renderTimeslots = function(timeslotContainer, templateId) {
  var timeslotTemplate = $(templateId).html();
  Mustache.parse(timeslotTemplate);
  var outputHtml = Mustache.render(timeslotTemplate, {"timeslots": this.timeslots});
  $(timeslotContainer).html(outputHtml);
}

Calendar.prototype.layoutEvents = function(events, eventsContainer, eventTemplateId) {
	if(!events) {
		console.log('events list is null or empty');
	}

  // empty the calendar. 
  $(eventsContainer).empty();

  var eventTemplate = $(eventTemplateId).html();
  Mustache.parse(eventTemplate);

	var calendarEvents = [];

	events.forEach(function(current, index){
	    var updatedEvent = new Event(current.start, current.end);
	    calendarEvents.push(updatedEvent);
	})

	calendarEvents.sort(Calendar.eventComparare);

  var conflictingEventCount = 0;
  var resetIndex = 0;
  var maxColumnsForIteration = 1;
  var currentIndex = 1;

  while(currentIndex < calendarEvents.length) {
      //debugger;
      conflictingEventCount = 0;
      
      // find how many events are conflicting between resetIndex and currentIndex
      var currentEvent = calendarEvents[currentIndex];
      for(var i = resetIndex; i < currentIndex; i++) {
          var iteratingEvent = calendarEvents[i];
          if(iteratingEvent.conflictsWith(currentEvent)) {
              currentEvent.priorConflictingEvents.push(iteratingEvent);
              conflictingEventCount++;
          }
      }
      
      // if there is nothing conflicting then they are good to take full space so move to next set
      if(conflictingEventCount == 0) {
          resetIndex = currentIndex;
          currentIndex = resetIndex + 1;
          maxColumnsForIteration = 1;
          continue;
      }
      
      var columnIndex = 0;
      // if there are all events that are conflicting then increase the width factor by 1 for 
      // each event as they will be sharing the space equally
      if(conflictingEventCount == currentIndex - resetIndex) {
          for(var i = resetIndex; i <= currentIndex; i++) {
              iteratingEvent = calendarEvents[i];
              iteratingEvent.columnIndex = columnIndex++;
              iteratingEvent.totalColumnsInConflictingGraph = conflictingEventCount + 1;
          }
          maxColumnsForIteration = conflictingEventCount + 1;
      } 
      else if (conflictingEventCount >= maxColumnsForIteration) {
          for(var i = resetIndex; i <= currentIndex; i++) {
              iteratingEvent = calendarEvents[i];
              if(i == currentIndex) {
                iteratingEvent.columnIndex = maxColumnsForIteration;
              }
              iteratingEvent.totalColumnsInConflictingGraph = conflictingEventCount + 1;
          }
          maxColumnsForIteration++;
      }
      // if not then find which column does this event belongs to...
      else {
          iteratingEvent = calendarEvents[currentIndex];
          iteratingEvent.totalColumnsInConflictingGraph = maxColumnsForIteration;
          iteratingEvent.columnIndex = Calendar.findFirstAvailableColumn(iteratingEvent, maxColumnsForIteration);
      }
      currentIndex++;
  }

  // find for multi column overlap
  var totalEvents = calendarEvents.length;
  for(i = 0 ; i < totalEvents; i++) {
    iteratingEvent = calendarEvents[i];
    var columnSpan = iteratingEvent.totalColumnsInConflictingGraph - iteratingEvent.columnIndex;
    var nextEvent = calendarEvents[i+1];

    /*
      1. If i have more than 2 columns layout in graph - AND
      2. columnIndex is less than last column index - AND
      3. either there is no event after me OR next event begins after the end of me
    */
    if( iteratingEvent.totalColumnsInConflictingGraph > 2 &&
        iteratingEvent.columnIndex < iteratingEvent.totalColumnsInConflictingGraph - 1 && 
        (!nextEvent || (nextEvent.start >= iteratingEvent.end))) {
      iteratingEvent.columnSpan = Calendar.nearestConflictingEventColumnIndex(iteratingEvent) - iteratingEvent.columnIndex;
    }
  }

  //console.log(calendarEvents);

  var outputHtml = Mustache.render(eventTemplate, {"events": calendarEvents});
  $(eventsContainer).html(outputHtml);
}

Calendar.nearestConflictingEventColumnIndex = function(eventObj) {
  var totalEvents = eventObj.priorConflictingEvents.length;
  var nearestColumn = eventObj.totalColumnsInConflictingGraph - 1; // set it to last index as default

  for(var i = 0; i < totalEvents; i++) {
    var iteratingEvent = eventObj.priorConflictingEvents[i];
    var iteratingEventColumnIndex = iteratingEvent.columnIndex;
    if(eventObj.columnIndex  < iteratingEventColumnIndex && iteratingEventColumnIndex < nearestColumn) {
      nearestColumn = iteratingEventColumnIndex;
    }
  }
  return nearestColumn;
}

Calendar.findFirstAvailableColumn = function(eventObj, maxColumns) {
  var eventFreeColumn = new Array(maxColumns);
  for(var i = 0; i < maxColumns; i++) {
    eventFreeColumn[i] = true;
  }

  var conflictingEvents = eventObj.priorConflictingEvents.length;
  for(i = 0; i<conflictingEvents; i++) {
    eventFreeColumn[eventObj.priorConflictingEvents[i].columnIndex] = false;
  }

  for(i = 0; i < maxColumns; i++){
    if(eventFreeColumn[i]) {
      return i;
    }
  }
  return 0;
}
	
Calendar.eventComparare = function(ev1, ev2) {
  if(ev1.start > ev2.start) {
      return 1;
  }
  if(ev1.start < ev2.start) {
      return -1;
  }
  if(ev1.duration > ev2.duration) {
      return -1;
  }
  if(ev1.duration < ev2.duration) {
      return 1;
  }
  return 0;
}