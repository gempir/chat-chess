var ws = null;

function initWS() {
    var protocol = "ws";
    if (location.protocol === 'https:') {
        protocol = "wss"
    }
    ws = new WebSocket(protocol +"://" + location.host + "/ws");

    ws.onopen = function () {
        ws.send("gameId=" + getCookie("gameId"));
    };

    ws.onerror = function (error) {
        console.log('WebSocket Error ' + error);
    };

    ws.onmessage = function (e) {
        if (e.data.startsWith("move=")) {
            var split1 = e.data.split("=");
            var split2 = split1[1].split("-");

            game.move({ from: split2[0], to: split2[1] });
            board.move(split1[1]);
            chatMoved(split1[1]);
        }
        if (e.data == "valid") {
            $startGameInput.fadeOut();
            $startGameButton.fadeOut();
            $('#board').css('display','block');
            resetApp();
        }
    };
}

function sendWS(message) {
    ws.send(message);
}