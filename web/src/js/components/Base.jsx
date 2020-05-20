import React from "react";
import EventService from "../service/EventService";

export default class Base extends React.Component {

    componentDidMount() {
        this.eventService = new EventService(process.env.apiBaseUrl, this.handleMessage);
    }

    render() {
        return (
            <div>
                <form action="" onSubmit={this.handleSubmit}>
                <input type="text" name="channel" placeholder="channel"></input>
                </form>
            </div>
        );
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        this.eventService.sendMessage({type: "start", value: data.get("channel")});
    }

    handleMessage = (e) => {
        if (e.data.startsWith("move=")) {
            var split1 = e.data.split("=");
            var split2 = split1[1].split("-");

            game.move({ from: split2[0], to: split2[1] });
            board.move(split1[1]);
            chatMoved(split1[1]);
        }
        if (e.data == "valid") {
            console.log("valid!");
        }
    }
}
