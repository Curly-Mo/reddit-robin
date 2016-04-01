// ==UserScript==
// @name         Colin Fahy
// @namespace    http://tampermonkey.net/
// @author       Colin Fahy
// @include      https://www.reddit.com/robin
// @grant        none
// ==/UserScript==

function getUsers(){
  var user_elems = $(".robin-room-participant > .robin--username");
  var users = [];
  for(var i=0;i<user_elems.length;i++){
      users.push(user_elems[i].innerHTML);
  }
  return users;
}

function getRoomName(){
  return $(".robin-chat--room-name").text();
}

function saveStats(){
  var room = getRoomName();
  var stats = localStorage.getItem('robin_stats', {});
  stats[room] = {};
  stats[room]['users'] = getUsers();
  localStorage.setItem("robin_stats", stats);
  return stats
}

function postStats(){
    var message = "Here is an update on the current state of affairs: " +
      ", Grows: "+$(".robin-room-participant.robin--vote-class--increase").length +
      ", Stays: "+$(".robin-room-participant.robin--vote-class--continue").length +
      ", Abandons: "+$(".robin-room-participant.robin--vote-class--abandon").length +
      ", Keypaws: Never forget" +
      ", Time remaining: " + howLongLeft() + " minutes.";
    $(".text-counter-input").val(message).submit();
}

function addMins(date,mins) {
    var newDateObj = new Date(date.getTime() + mins*60000);
    return newDateObj;
}

function howLongLeft() { // mostly from /u/Yantrio
    var remainingMessageContainer = $(".robin--user-class--system:contains('approx')");
    var message = $(".robin-message--message", remainingMessageContainer).text();
    var time = new Date($(".robin--user-class--system:contains('approx') .robin-message--timestamp").attr("datetime"));
    try {
        endTime = addMins(time,message.match(/\d+/)[0]);
    } catch(e){}
    return Math.floor((endTime - new Date())/60/1000*10)/10;

    //grab the timestamp from the first post and then calc the difference using the estimate it gives you on boot
}

(function() {
    'use strict';


    $(".robin-chat--sidebar").prepend("<div class='addon' style='font-size:15pt;display:block;'><div class='grows'></div><div class='stays'></div><div class='abandons'></div><div class='timeleft'></div></div>");
    var timeStarted = new Date();
    function update() {
        console.log('auto growing');
        $(".timeleft").text(howLongLeft()+" minutes remaining");
        $(".addon .grows").text("Grows: "+$(".robin-room-participant.robin--vote-class--increase").length);
        $(".addon .abandons").text("Abandons: "+$(".robin-room-participant.robin--vote-class--abandon").length);
        $(".addon .stays").text("Stays: "+$(".robin-room-participant.robin--vote-class--continue").length);

        var lastChatString = $(".robin-message--timestamp").last().attr("datetime");
        var timeSinceLastChat = new Date() - (new Date(lastChatString));
        var now = new Date();
        if(timeSinceLastChat !== undefined && (timeSinceLastChat > 60000 && now-timeStarted > 60000)) {
            window.location.reload(); // reload if we haven't seen any activity in a minute.
        }
        if($(".robin-message--message:contains('that is already your vote')").length === 0) {
            $("#robinSendMessage > input[type='submit']").click();
            $(".text-counter-input").val("/vote grow").submit();
        }

        // Try to join if not currently in a chat
        if ($("#joinRobinContainer").length) {
            $("#joinRobinContainer").click();
            setTimeout(function(){
                $("#joinRobin").click();
            }, 1000);
            return;
        }


    }
//update();


setInterval(update, 1000);

})();
