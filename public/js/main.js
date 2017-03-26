var board = ChessBoard('board', {
    draggable: true,
    dropOffBoard: 'trash'
});

board.start();

var $startGameButton = $(".startGameButton");

$startGameButton.click(function () {
    var $channelName = $(".channelName");

    var channel = $channelName.val();
    if (channel == "") {
        $channelName.css("border-color", "red");
        return
    }
    $channelName.fadeOut();
    $startGameButton.fadeOut();
    $('.startGameBox').html('<div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>');


    joinAndStart(channel)
});


function joinAndStart(channel) {
    $.ajax({
        method: "POST",
        url: "/new/" + channel,
        data: {}
    })
    .done(function(msg) {
        setCookie("gameId", msg.id, 1);
        $('.startGameBox').html('<h4 class="listenChannel">Channel: ' + msg.channel + '</h4>');
    });
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}