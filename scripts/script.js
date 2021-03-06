// Variables

// Get URL parameter user
var user = getURLParameter('user');
var apiToken = getURLParameter('token');
var userId;

switch (user) {
    case "timo":
        userId = 1499152;
        var workHours = 8;
        var workMinutes = 24;
        break;
    case "tobi":
        userId = 1453319;
        var workHours = 8;
        var workMinutes = 0;
        break;
    case "katha":
        userId = 1453320;
        var workHours = 8;
        var workMinutes = 24;
        break;
    case "thomas":
        userId = 1453321;
        var workHours = 8;
        var workMinutes = 24;
        break;
    case "jochen":
        userId = 1452905;
        var workHours = 8;
        var workMinutes = 24;
        break;
}

// Other toggl variables
var workspaceIdCodeatelier = 737047;
var encodedApiToken = btoa(apiToken + ":api_token");

// Daily time to work
var dailyWorktimeMilli = ((workHours * 60 * 60 * 1000) + (workMinutes * 60 * 1000));

// Date range
// Get start date
var startDay = new Date(2015,8, 1); // Months starts at 0 = January

// Get end date = yesterday
var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(23, 59, 59);

// Convert to string for toggl request
var endMonth = yesterday.getUTCMonth() + 1; //months from 1-12
var endDay = yesterday.getUTCDate();
var endYear = yesterday.getUTCFullYear();
var endDateString = endYear + "-" + endMonth + "-" + endDay;

console.log("Von: " + startDay);
console.log('Bis: ' + yesterday);

// Holiday that have to be extracted from business days
var holidaysBW = [
    // '10/03/2015',
    // '11/01/2015',
    '12/24/2015',
    '12/25/2015',
    '12/26/2015'
];

var url = 'https://toggl.com/reports/api/v2/summary?user_agent=codeatelier&workspace_id=' +
    workspaceIdCodeatelier +
    '&since=2015-09-01&until=' +
    endDateString +
    '&user_ids=' +
    userId;

var method = 'GET';

// HTML elements
var overtimeTag = document.getElementById('overtime');
var reloadBtn = document.getElementById('reloadBtn');


// -----------------------------------------------------------------------------
// Event listener

window.addEventListener('load', insertOvertime, false);
reloadBtn.addEventListener('click', reload, false);


// -----------------------------------------------------------------------------
//Functions

function getURLParameter(name) {
  return decodeURIComponent(
        (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)')
            .exec(location.search)||[,""])[1]
            .replace(/\+/g, '%20')
        ) ||
        null;
}

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
        // Most browsers.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // IE8 & IE9
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }

    return xhr;
}

function getWorkingDays(startDate, endDate){
    var workingDays = 0;

    var currentDate = startDate;
    while (currentDate <= endDate)  {

        var weekDay = currentDate.getDay();
        if(weekDay !== 0 && weekDay != 6)
            workingDays++;

         currentDate.setDate(currentDate.getDate()+1);
    }

    return workingDays;
}

function getpastHolidays(holidaysBW){
    var pastHolidays = 0;

    for (i = 0; i < holidaysBW.length; ++i) {
        holiday = new Date(holidaysBW[i]);
        holidayDate = holiday.getTime();
        if(holidayDate < yesterday ){
            pastHolidays ++;
        }
    }

    console.log("Vergangene Feiertage: " + pastHolidays);

    return pastHolidays;
}

function getOvertime(timeWorkedMilli){
    var holidays = getpastHolidays(holidaysBW);
    var workingDays = getWorkingDays(startDay, yesterday) - holidays;
    var timeToWorkMilli = dailyWorktimeMilli * workingDays;
    var overtimeMilli = timeWorkedMilli - (dailyWorktimeMilli * workingDays);

    console.log('Zu arbeitende Tage: ' + workingDays);
    console.log('Zu arbeitende Zeit: ' + timeToWorkMilli);

    return overtimeMilli;
}

function millisecondsToString(timeInMilliseconds){
    var ms = timeInMilliseconds;
    var hoursWithDecimal = ms / 1000 / 60 /60;
    var hours = parseInt(hoursWithDecimal);
    var decimals = hoursWithDecimal - hours;
    var minutes = 60 * decimals;
    minutes = parseInt(minutes);
    var overtimeString = "Du hast " + hours + " Stunden und " + minutes + " Minuten zu viel gearbeitet.";

    console.log("Nichtgerundete Überstunden: " + (ms / 1000 / 60 /60));

    return overtimeString;
}

function insertOvertime(){
    var xhr = createCORSRequest(method, url);
    xhr.setRequestHeader('Authorization', 'Basic ' + encodedApiToken);
    xhr.send();

    xhr.onload = function() {
        // Success code goes here.
        var responseParsed = JSON.parse(xhr.response);
        var timeWorkedMilli = responseParsed.total_grand;
        var overtimeMilli = getOvertime(timeWorkedMilli);
        var overtimeString = millisecondsToString(overtimeMilli);

        console.log("Gearbeitete Zeit: " + timeWorkedMilli);

        overtimeTag.innerHTML = overtimeString;
    };

    xhr.onerror = function() {
        // Error code goes here.
        alert("Request didn't work. Please reload site.");
    };
}

function reload(){
    document.location.reload(true);
}
