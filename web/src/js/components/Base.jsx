import React from "react";
import EventService from "../service/EventService";
import Chessboard from "chessboardjsx";

export default class Base extends React.Component {

    state = {
        game: null,
    }

    componentDidMount() {
        // reconnect logic here later

        this.eventService = new EventService(process.env.apiBaseUrl, this.handleMessage);
    }

    render() {
        return (
            <div className="game">
                {!this.state.game && <form action="" onSubmit={this.handleSubmit}>
                    <label htmlFor="channel">Type your channel name to start</label>
                    <input type="text" name="channel" placeholder="channel" autoComplete="off" />
                    &nbsp;
                    <input type="submit" value="start game" />
                </form>}
                {this.state.game && <div>
                    <div className="topMessage">playing against #{this.state.game.Channel}</div>   
                    <Chessboard position={this.state.game.GameFen}/> 
                </div>}
            </div>
        );
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        this.eventService.sendMessage({ type: "start", value: data.get("channel") });
    }

    handleMessage = (data) => {
        console.log(data);

        switch(data.type) {
            case "game":
                this.setState({
                    game: data.value,
                });
                break;
            case "move":
                const split2 = data.value.split("-");
                game.move({ from: split2[0], to: split2[1] });
                board.move(split1[1]);                    
                break;
        }
    }
}
