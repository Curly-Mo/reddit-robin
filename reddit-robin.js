// ==UserScript==
// @name         Colin Fahy
// @namespace    http://github.com/Curly-Mo
// @version      1.0
// @author       Colin Fahy
// @include      https://www.reddit.com/robin*
// @grant        unsafeWindow
// ==/UserScript==
function getRoomName(){
  return $(".robin-chat--room-name").text();
}

function resetStats(){
    localStorage.setItem("robin_stats", JSON.stringify({}));
}

function saveStats(user_list){
    var room = getRoomName();
    var stats = JSON.parse(localStorage.getItem('robin_stats', JSON.stringify({})));
    if(stats.timeStarted === undefined){
        stats.timeStarted = timeStarted;
        localStorage.setItem("robin_stats", JSON.stringify(stats));
    }
    //set colors
    for(var i=0;i<user_list.length;i++){
        user_list[i].color = colorFromName(user_list[i].name);
    }
    if(room !== ""){
        if(stats[room] === undefined){
            stats[room] = {};
            stats[room].users = user_list;
            if(stats.roomOrder === undefined){
                stats.roomOrder = [];
            }
            stats.roomOrder.push(room);
        }else{
            if(stats[room].users.length < user_list.length){
                return stats;
            }
        }
        stats[room].users = addUsers(stats[room].users, user_list);
        localStorage.setItem("robin_stats", JSON.stringify(stats));
    }
    return stats;
}

function addUsers(list, user_list) {
  for(var i=0; i<user_list.length;i++){
      var found = false;
      for(var k=0; k<list.length;k++){
          if(list[k].name == user_list[i].name){
              list[k] = user_list[i];
              found = true;
          }
      }
      if(!found){
          list.push(user_list[i]);
      }
  }
  return list;
}

function post(message){
    if(message.length > 140){
        var end = message.substring(0, 140).lastIndexOf(' ');
        $(".text-counter-input").val(message.substring(0,end)).submit();
        post(message.substring(end));
    }else{
        $(".text-counter-input").val(message).submit();
    }
}

function postStats(){
    var grows = $(".robin-room-participant.robin--vote-class--increase").length;
    var stays = $(".robin-room-participant.robin--vote-class--continue").length;
    var abandons = $(".robin-room-participant.robin--vote-class--abandon").length;
    var no_votes = $(".robin-room-participant.robin--vote-class--novote").length;
    var total = stays + grows + abandons + no_votes;
    var result = 'GG';
    if(grows / total > 0.5){
        result = 'Growing';
    }
    if(stays / total > 0.5){
        result = 'Staying';
    }
    var message = "Room status!   " +
      "Grows: "+ grows +
      " | Stays: "+ stays +
      " | Abandons: "+ abandons +
      " | No-votes: "+ no_votes +
      " | RESULT: " + result +
      " | Time remaining: " + timeRemaining() + " minutes.";
    post(message);
}

function postSizeHistory(){
    var stats = JSON.parse(localStorage.getItem('robin_stats', JSON.stringify({})));
    var message = "Room size history: ";
    for(var i=0; i<stats.roomOrder.length; i++){
        var room = stats.roomOrder[i];
        var size = stats[room].users.length;
        message += size + ' ';
    }
    post(message);
}

function postUserHistory(username){
    var stats = JSON.parse(localStorage.getItem('robin_stats', JSON.stringify({})));
    var count = 0;
    for(var i=0; i<stats.roomOrder.length; i++){
        var room = stats.roomOrder[i];
        if(stats[room].users.filter(function(user) { return user.name == username; }).length > 0){
            count++;
        }
    }
    if(count === 0){
        return;
    }
    var message = username + " has been in the past " + count + " rooms with me.";
    post(message);
}


function colorFromName(username) {
    var parent = $('.robin-message--from.robin--username:contains('+username+')').parent();
    if(parent.hasClass('robin--flair-class--flair-0')){
        return 'red';
    }
    if(parent.hasClass('robin--flair-class--flair-1')){
        return 'orange';
    }
    if(parent.hasClass('robin--flair-class--flair-2')){
        return 'yellow';
    }
    if(parent.hasClass('robin--flair-class--flair-3')){
        return 'green';
    }
    if(parent.hasClass('robin--flair-class--flair-4')){
        return 'blue';
    }
    if(parent.hasClass('robin--flair-class--flair-5')){
        return 'purple';
    }
    return 'unknown';
}


function addMins(date,mins) {
    var newDateObj = new Date(date.getTime() + mins*60000);
    return newDateObj;
}

function timeRemaining() {
    var remainingMessageContainer = $(".robin--user-class--system:contains('approx')");
    var message = $(".robin-message--message", remainingMessageContainer).text();
    var time = new Date($(".robin--user-class--system:contains('approx') .robin-message--timestamp").attr("datetime"));
    try {
        var endTime = addMins(time,message.match(/\d+/)[0]);
        return Math.floor((endTime - new Date())/60/1000*10)/10;
    } catch(e){
        return 0;
    }
}


$("#robinVoteWidget").prepend("<div class='addon'><div class='timeleft robin-chat--vote' style='font-weight:bold;'></div></div>");
$('.robin-chat--buttons').prepend("<div class='robin-chat--vote robin--vote-class--novote'><span class='robin--icon'></span><div class='robin-chat--vote-label'></div></div>");
$('#robinVoteWidget .robin-chat--vote').css('padding', '5px');

$(".addon").prepend("<div id='post_stats' class='stats robin-chat--vote' style='font-weight:bold;'>Post Stats</div>");
$(".addon").prepend("<div id='post_size_history' class='stats robin-chat--vote' style='font-weight:bold;'>Post Size History</div>");
$(".addon").prepend("<div>Post User History:<form id='user_stats_form'><input type='text'></form></div>");


$('#post_stats').on('click', postStats);
$('#post_size_history').on('click', postSizeHistory);
$('#user_stats_form').on('submit', function(e){
    e.preventDefault();
    postUserHistory(e.target.firstElementChild.value);
    return false;
});

var timeStarted = new Date();
var list = {};

function update() {
    $(".timeleft").text(timeRemaining()+" minutes remaining");

    $.get("/robin/",function(a){
        var start = "{"+a.substring(a.indexOf("\"robin_user_list\": ["));
        var end = start.substring(0,start.indexOf("}]")+2)+"}";
        list = JSON.parse(end).robin_user_list;
        var increaseCount = list.filter(function(voter){return voter.vote === "INCREASE";}).length;
        var abandonCount = list.filter(function(voter){return voter.vote === "ABANDON";}).length;
        var novoteCount = list.filter(function(voter){return voter.vote === "NOVOTE";}).length;
        var continueCount = list.filter(function(voter){return voter.vote === "CONTINUE";}).length;
        $('#robinVoteWidget .robin--vote-class--increase .robin-chat--vote-label').html('grow<br>('+increaseCount+')');
        $('#robinVoteWidget .robin--vote-class--abandon .robin-chat--vote-label').html('abandon<br>('+abandonCount+')');
        $('#robinVoteWidget .robin--vote-class--novote .robin-chat--vote-label').html('no vote<br>('+novoteCount+')');
        $('#robinVoteWidget .robin--vote-class--continue .robin-chat--vote-label').html('stay<br>('+continueCount+')');
        saveStats(list);
    });
    var lastChatString = $(".robin-message--timestamp").last().attr("datetime");
    var timeSinceLastChat = new Date() - (new Date(lastChatString));
    var now = new Date();
    if(timeSinceLastChat !== undefined && (timeSinceLastChat > 60*1000*3 && now-timeStarted > 60*1000*3)) {
        window.location.reload(); // reload if we haven't seen any activity in a minute.
    }
    if($(".robin-message--message:contains('that is already your vote')").length === 0) {
        $(".text-counter-input").val("/vote grow").submit();
    }

    // Try to join if not currently in a chat
    if ($("#joinRobinContainer").length) {
        $("#joinRobinContainer").click();
        setTimeout(function(){
            $("#joinRobin").click();
            resetStats();
        }, 1000);
    }
}

console.log('auto grow is running');
setInterval(update, 1000);




















// Mute user and spam stuff

    // Individual mute button /u/verox-
    var mutedList = [];
    $('body').on('click', ".robin--username", function() {
        var username = $(this).text();
        var clickedUser = mutedList.indexOf(username);

        if (clickedUser == -1) {
            // Mute our user.
            mutedList.push(username);
            this.style.textDecoration = "line-through";
            listMutedUsers();
        } else {
            // Unmute our user.
            this.style.textDecoration = "none";
            mutedList.splice(clickedUser, 1);
            listMutedUsers();
        }
    });

    $(".addon").append("<span style='font-size:12px;text-align:center;'>Muted Users</label>");

    $(".addon").append("<div id='blockedUserList' class='robin-chat--sidebar-widget robin-chat--user-list-widget'></div>");

    function listMutedUsers() {

        $("#blockedUserList").remove();

        $(".addon").append("<div id='blockedUserList' class='robin-chat--sidebar-widget robin-chat--user-list-widget'></div>");

        $.each(mutedList, function(index, value){

            var mutedHere = "present";

            var userInArray = $.grep(list, function(e) {
                return e.name === value;
            });

            if (userInArray[0].present === true) {
                mutedHere = "present";
            } else {
                mutedHere = "away";
            }

            $("#blockedUserList").append("<div class='robin-room-participant robin--user-class--user robin--presence-class--" + mutedHere + " robin--vote-class--" + userInArray[0].vote.toLowerCase() + "'></div>");
            $("#blockedUserList>.robin-room-participant").last().append("<span class='robin--icon'></span>");
            $("#blockedUserList>.robin-room-participant").last().append("<span class='robin--username' style='color:" + colorFromName(value) + "'>" + value + "</span>");

        });
    }



    var myObserver = new MutationObserver(mutationHandler);
    //--- Add a target node to the observer. Can only add one node at a time.
    // XXX Shou: we should only need to watch childList, more can slow it down.
    $("#robinChatMessageList").each(function() {
        myObserver.observe(this, { childList: true });
    });
    function mutationHandler(mutationRecords) {
        mutationRecords.forEach(function(mutation) {
            var jq = $(mutation.addedNodes);
            // There are nodes added
            if (jq.length > 0) {
                // cool we have a message.
                var thisUser = $(jq[0].children && jq[0].children[1]).text();
                var $message = $(jq[0].children && jq[0].children[2]);
                var messageText = $message.text();

                var remove_message =
                    (mutedList.indexOf(thisUser) >= 0);


                if(nextIsRepeat && jq.hasClass('robin--user-class--system')) {
                }
                var nextIsRepeat = jq.hasClass('robin--user-class--system') && messageText.indexOf("try again") >= 0;
                if(nextIsRepeat) {
                    $(".text-counter-input").val(jq.next().find(".robin-message--message").text());
                }

                remove_message = remove_message && !jq.hasClass("robin--user-class--system");
                if (remove_message) {
                    $message = null;
                    $(jq[0]).remove();
                }
            }
        });
    }
