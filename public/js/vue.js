var app = new Vue({
    el: '.messageBox',
    data: {
        message: 'Twitch-Chess',
        timer: ''
    }
});

function startChatTimer() {
    app.message = "Chat is voting... ";
    var timer = null;
    app.timer = 29;

    timer = setInterval(function() {
        if(app.timer == 0) {
            app.message = 'Chat moved, your turn.';
            app.timer = '';
            return clearInterval(timer)
        }
        app.timer -= 1
    }, 1000)
}