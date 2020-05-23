import * as React from 'react';
import Game from './Game';
import styled from 'styled-components';
import { ChatClient } from "dank-twitch-irc";
import StartGame from './StartGame';
import GameConfig from './Model/GameConfig';

export default class App extends React.Component<{}, { config: GameConfig }> {
	chatClient: ChatClient;

	CSSVariables = styled.div`
		--weakText: rgb(200, 200, 200);
		--text: rgb(250, 250, 250);
		--lighterBackground: #616161;
		--lightBackground: #18181B;
		--background: #0E0E10;
		--lightBorder: rgba(255,255,255, 0.1);
		--highlight: #3498db;
		--positive: #2ecc71;
	`;

	Wrapper = styled.div`
		font-family: Helvetica, Verdana, Arial, sans-serif;
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		justify-content: center;
		padding: 5em;
		color: var(--text);
		background: var(--background);
	`;

	constructor(props) {
		super(props);

		this.state = {
			config: null,
		}
	}

	componentDidMount = () => {
		this.setupChat();
	}

	render() {
		return (
			<this.CSSVariables>
				<this.Wrapper>
					{this.state.config && <Game config={this.state.config} />}
					{!this.state.config && <StartGame onGameStart={this.handleGameStart} />}
				</this.Wrapper>
			</this.CSSVariables>
		);
	}

	handleGameStart = (config: GameConfig) => {
		this.setState({
			config: config,
		});
		this.chatClient.join(config.channel);
	}

	setupChat = () => {
		this.chatClient = new ChatClient({ connection: { type: "websocket", secure: true } });

		this.chatClient.connect()
		this.chatClient.on("error", (err) => {
			console.log(err);
			this.setupChat();
		});
		this.chatClient.on("PRIVMSG", this.handleChatMessage);
	}

	handleChatMessage = (data: object) => {
		console.log(data);
	}
}