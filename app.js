const express = require('express');
const fs = require('fs');
const app = express();

const availabilityData = (JSON.parse(fs.readFileSync('./availability.json', 'utf8'))).availabilityTimings;

function isTimeInRange(givenTime, startTime, stopTime) {
    return givenTime >= startTime && givenTime <= stopTime;
}

function isSlotAvailable(availableSlots, givenTime) {
    for (var i = 0; i < availableSlots.length; i++) {
        var entry = availableSlots[i];
        var startTime = entry.startTime;
        var stopTime = entry.stopTime;

        if (isTimeInRange(givenTime, startTime, stopTime)) {
            return true;
        }
    }
    return false;
}

function getMinTimeDifference(time1, refTime) {
    const date1 = new Date(`2024-04-24T${time1}`);
    // const date2 = new Date(`2024-04-24T${time2}`);
    const date3 = new Date(`2024-04-24T${refTime}`);
    const timeDiff = Math.abs(date1 - date3);
    const minutes = Math.floor(timeDiff / 60000); // 1 minute = 60000 milliseconds
    return minutes;
}

function getNextDayMinTimeDifference(time1, refTime) {
    const date1 = new Date(`2024-04-25T${time1}`);
    // const date2 = new Date(`2024-04-24T${time2}`);
    const date3 = new Date(`2024-04-24T${refTime}`);
    const timeDiff = Math.abs(date1 - date3);
    print(timeDiff)
    const minutes = Math.floor(timeDiff / 60000); // 1 minute = 60000 milliseconds
    return minutes;
}

function getNextAvailableSlot(availableSlots, date, givenTime, nextDayFirstSlot) {
    var closestSlot = -1;
    var minTime = Infinity;

    for (var i = 0; i < availableSlots.length; i++) {
        var entry = availableSlots[i];
        var startTime = entry.startTime;
        // var stopTime = entry.stopTime;

        var slotMinTime = getMinTimeDifference(startTime, givenTime);
        console.log(slotMinTime)
        if(slotMinTime<minTime){
            closestSlot = i;
            minTime = slotMinTime;
        }
    }

    console.log("closest slot: ", closestSlot);
    console.log({ date: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }), time: availableSlots[closestSlot].start });

    if( (nextDayFirstSlot==null) || (getNextDayMinTimeDifference(nextDayFirstSlot.startTime, givenTime)>minTime) )
        return { date: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }), time: availableSlots[closestSlot].start };
    else
    {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        return { date: nextDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }), time: nextDayFirstSlot.start };
    }
}

app.get('/doctor-availability', (req, res) => {
    const { date, time } = req.query;
    console.log(req.query)
    if (!date || !time) {
        return res.status(400).json({ error: 'Both date and time parameters are required.' });
    }

    const inputDateTime = new Date(`${date} ${time}`);
    const dayOfWeek = inputDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const nextDay = new Date(inputDateTime);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayOfWeek = nextDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    console.log(dayOfWeek, nextDayOfWeek);
    // console.log(availabilityData);
    console.log("Present day : ", availabilityData[dayOfWeek]);
    console.log("Next day : ", availabilityData[nextDayOfWeek]);
    
    const slotsForTheDay = availabilityData[dayOfWeek];
    const nextDayFirstSlot = availabilityData[nextDayOfWeek][0];
    console.log(slotsForTheDay);
    console.log(slotsForTheDay[0]);

    if(slotsForTheDay){
        console.log("PRINTING OUTPUT NOW:")
        if (isSlotAvailable(slotsForTheDay, time)) {
            return res.json({ isAvailable: true });
        }
            return getNextAvailableSlot(slotsForTheDay, inputDateTime, time, nextDayFirstSlot);
    }
    else{
        const nextDate = new Date(inputDateTime);
        nextDate.setDate(nextDate.getDate() + 1);
        return { date: nextDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }), time: nextDayFirstSlot.start };
    }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});