import * as React from "react";
import styled from "styled-components";
import GameConfig from "./Model/GameConfig";

type props = {
    onGameStart: (config: GameConfig) => void,
}

type state = {

}

export default class StartGame extends React.Component<props, state> {

    Form = styled.form`
		display: flex;
		flex-direction: column;

        input[type=text], input[type=number] {
            background: var(--lightBackground);
            border: 1px solid var(--lightBorder);
            padding: 10px;
            color: white;
            border-radius: 3px;
            outline: none;
            margin: 10px 0;

            &:focus {
                border-color: var(--highlight);
            }
        }

        label {
            display: block;
            margin-top: 20px;
            color: var(--text);
        }

        input[type=submit] {
            background: var(--lightBackground);
            border: 1px solid var(--lightBorder);
            padding: 10px;
            color: white;
            border-radius: 3px;
            margin-top: 20px;
            cursor: pointer;       

            &:hover {
                background: var(--lighterBackground);
            }
        }
	`;


    render() {
        return <this.Form action="" onSubmit={this.handleSubmit}>
            <label htmlFor="channel">Your twitch channel</label>
            <input type="text" name="channel" placeholder="channel" autoComplete="off" />
            <label htmlFor="chat-response-time">Seconds your chat has time to move</label>
            <input type="number" name="chat-response-time" defaultValue="30" />
            <input type="submit" value="start game" />
        </this.Form>
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        this.props.onGameStart({
            fen: "start",
            channel: String(data.get("channel")),
            chatResponseTime: Number(data.get("chat-response-time")),
            history: [],
            turn: "w"
        });
    }
}