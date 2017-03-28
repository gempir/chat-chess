var app = new Vue({
    el: '.messageBox',
    data: {
        message: 'Twitch-Chess',
        timer: ''
    }
});

function resetApp() {
    app.message = "Twitch-Chess";
    app.timer = '';
}

function startChatTimer() {
    app.message = "Chat is voting... ";
    var timer = null;
    app.timer = 29;

    timer = setInterval(function() {
        if(app.timer == 0) {
            app.timer = '';
            return clearInterval(timer)
        }
        app.timer -= 1
    }, 1000)
}

function chatMoved(move) {
    app.message = 'Chat moved ' + move + ', your turn.';
    app.timer = '';
}

function validateOwner() {
    app.message = 'Type "chess" into your own chat for the game to start';
}