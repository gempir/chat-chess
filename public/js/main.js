var game = new Chess();

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
    board.position(game.fen());
};


var onDrop = function(source, target, piece) {
    if (piece.startsWith("b")) {
        return "snapback";
    }

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    $.ajax({
        method: "PUT",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/move/" + getCookie("gameId"),
        data: JSON.stringify({from: source, to: target})
    });

    setTimeout(setEnemyMove, 30000);
};


function setEnemyMove() {
    $.ajax({
        method: "GET",
        url: "/move/" + getCookie("gameId")
    }).done(function(msg){
        game.move({ from: msg.from, to: msg.to });
        board.move(msg.from + "-" + msg.to);
    });
    $('.startGameBox').html('<h4 class="listenChannel"> </h4>');
}

var board = ChessBoard('board', {
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
});
board.start();


// Start game
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

    joinAndStart(channel)
});


function joinAndStart(channel) {
    $.ajax({
        method: "PUT",
        url: "/game",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({channel: channel})
    })
    .done(function(msg) {
        setCookie("gameId", msg.id, 1);
        $('.startGameBox').html('<h4 class="listenChannel">Game has started</h4>');
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