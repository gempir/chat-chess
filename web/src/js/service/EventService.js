export default class EventService {
    constructor(apiBaseUrl, callback) {

        this.connect = () => {
            this.ws = new WebSocket(`${apiBaseUrl.replace("https://", "wss://").replace("http://", "ws://")}/api/ws`);
            
            this.ws.onmessage = (event) => {
                callback(JSON.parse(event.data));
            };

            this.ws.onclose = e => {
                console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
                setTimeout(this.connect, 1000);
            };

            this.ws.onerror = err => {
                console.error('Socket encountered error: ', err, 'Closing socket');
                this.ws.close();
            };
        }

        this.connect();
    }

    send(message) {
        this.ws.send(JSON.stringify(message));
    }
}

