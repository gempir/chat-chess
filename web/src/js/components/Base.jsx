import React from "react";
import EventService from "../service/EventService";
import Game from "./Game";

export default class Base extends React.Component {

    state = {
        game: null,
        actions: [],
        votes: [],
    }

    componentDidMount() {
        // reconnect logic here later

        this.eventService = new EventService(process.env.apiBaseUrl, this.handleMessage);
    }

    render() {
        return (
            <div className="gameWrapper">
                {!this.state.game && <form action="" onSubmit={this.handleSubmit}>
                    <label htmlFor="channel">Type your channel name to start</label>
                    <input type="text" name="channel" placeholder="channel" autoComplete="off" />
                    &nbsp;
                    <input type="submit" value="start game" />
                </form>}
                <ul className="actions">
                    {this.state.actions.sort(this.sortActions).map(action =>
                        <li key={action.ID}>{this.formatTime(action.Time)} <strong>{action.Message}</strong></li>
                    )}
                </ul>
                <ol className="votes">
                    {this.state.votes.map((vote, key) =>
                        <li key={key}><strong>{vote.Move}</strong> {vote.Votes}</li>
                    )}
                </ol>
                {this.state.game && <div>
                    <div className="topMessage">playing against #{this.state.game.Channel}</div>
                    <Game fen={this.state.game.GameFen} eventService={this.eventService} />
                </div>}
            </div>
        );
    }

    sortActions = (a, b) => {
        if (a.Time < b.Time) {
            return 1;
        }
        if (a.Time > b.Time) {
            return -1;
        }
        return 0;
    }

    formatTime = (unixTime) => {
        const date = new Date(unixTime * 1000);

        return date.toLocaleTimeString("en-US", { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        this.eventService.send({ type: "start", value: data.get("channel") });
    }

    handleMessage = (data) => {
        switch (data.type) {
            case "game":
                this.setState({
                    game: data.value,
                });
                break;
            case "action":
                this.setState({
                    actions: [...this.state.actions, data.value],
                });
                break;
            case "votes":
                this.setState({
                    votes: data.value.Votes,
                });
                break;
        }
    }
}
