import * as React from "react";
import styled from "styled-components";
import GameConfig from "./Model/GameConfig";
import GitHubButton from "react-github-btn";

type props = {
    onGameStart: (config: GameConfig) => void,
}

type state = {

}

export default class StartGame extends React.Component<props, state> {

    Form = styled.form`
		display: flex;
		flex-direction: column;

        input[type=text], input[type=number], select {
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

        h1 {
            display: flex;

            span {
                padding-top: 3px;
                padding-left: 3px;
            }
        }
    `;

    Rules = styled.ul`
        list-style-type: disc;
        padding-left: 20px;

        li {
            margin-top: 10px;
        }
    `;


    render() {
        // @ts-ignore
        const button = <GitHubButton href="https://github.com/gempir/chat-chess" data-color-scheme="no-preference: dark; light: dark; dark: dark;" data-size="large" data-show-count="true" aria-label="Star gempir/chat-chess on GitHub">Star</GitHubButton>;

        return <this.Form action="" onSubmit={this.handleSubmit}>
            <h1>Chat-Chess {button}</h1>
            <h3>made by <a href="https://twitch.tv/gempir">twitch.tv/gempir</a></h3>
            <label htmlFor="channel">Your twitch channel</label>
            <input type="text" name="channel" minLength={2} placeholder="channel" autoComplete="off" required />
            <label htmlFor="chat-response-time">Seconds your chat has time to vote</label>
            <input type="number" name="chat-response-time" defaultValue="30" />
            <label htmlFor="sub-only">Subscriber vote multiplier</label>
            <input type="number" name="sub-multiplier" defaultValue="1" />
            <label htmlFor="sub-only">Your side</label>
            <select id="side" name="side">
                <option value="white">White</option>
                <option value="black">Black</option>
            </select>
            <input type="submit" value="start game" />
            <br />
            <h2>How it works</h2>
            <this.Rules>
                <li>Streamer will play as white and chat will play as black</li>
                <li>Streamer has unlimited time to move</li>
                <li>After Streamer moved chat has configured amount of time to vote on a move</li>
                <li>Vote in chat with a notation like "<strong>e5-e7</strong>" anywhere in the message, but only 1 vote per user</li>
                <li>Votes will be shown on the right</li>
                <li>If nobody voted, a random move will be executed</li>
                <li>Reset or start new game on the bottom left</li>
            </this.Rules>
        </this.Form>
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        // simple tracking, to follow who is using the site (will only log the configured channel)
        fetch("https://enztord6gs0za.x.pipedream.net/?channel=" + encodeURIComponent(String(data.get("channel"))), { mode: 'no-cors' });

        this.props.onGameStart({
            fen: "start",
            channel: String(data.get("channel")),
            chatResponseTime: Number(data.get("chat-response-time")),
            history: [],
            side: (data.get("side") as "white" | "black"),
            turn: data.get("side")[0],
            subMultiplier: Number(data.get("sub-multiplier"))
        });
    }
}