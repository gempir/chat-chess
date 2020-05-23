import * as React from 'react';
import Game from './Game';
import styled from 'styled-components';
import { ChatClient, PrivmsgMessage } from "dank-twitch-irc";
import StartGame from './StartGame';
import GameConfig from './Model/GameConfig';
import Move from './Model/Move';
import Votes from './Model/Votes';
import PopularVote from './Model/Vote';

export default class App extends React.Component<{}, { config: GameConfig, popularVotes: Array<PopularVote>, announcement: string }> {
	chatClient: ChatClient;
	ticker: NodeJS.Timer;
	moveRegex: RegExp;
	votes: Votes;
	moveChat: (votes: Array<PopularVote>) => void;

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
		flex-direction: column;
		align-items: center;
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		justify-content: flex-start;
		padding: 5em;
		color: var(--text);
		background: var(--background);
	`;

	Announcement = styled.div`
		height: 25px;
		font-size: 25px;
		line-height: 25px;
		margin-bottom: 10px;
	`;

	PopularVotes = styled.ol`
		position: absolute;
        right: 20px;
        top: 20px;
		font-size: 2rem;
        bottom: 20px;
        overflow: scroll;
        scrollbar-color: transparent var(--lightBorder);

        &::-webkit-scrollbar {
            width: 10px;
        }
    
        &::-webkit-scrollbar-thumb {
            border-radius: 10px;
            background: var(--lightBorder);
        }

        &::-webkit-scrollbar-corner {
            background: transparent;
        }
	`;

	constructor(props) {
		super(props);

		this.moveRegex = new RegExp(/([a-h])([1-8])-([a-h])([1-8])/);

		this.state = {
			config: null,
			popularVotes: [],
			announcement: null,
		}
	}

	componentDidMount = () => {
		this.setupChat();
	}

	render() {
		return (
			<this.CSSVariables>
				<this.Wrapper>
					<this.PopularVotes>{this.state.popularVotes.map((vote, key) =>
						<li key={key}>{key + 1}. {vote.move.toString()} ({vote.count})</li>)}
					</this.PopularVotes>
					<this.Announcement>{this.state.announcement && this.state.announcement}</this.Announcement>
					{this.state.config && <Game config={this.state.config} onUpdateConfig={this.handleConfigUpdate} onPlayerMove={this.handlePlayerMove} registerOnChatMove={move => this.moveChat = move} />}
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

	handlePlayerMove = (move: Move) => {
		this.setState({
			announcement: `Player moved, chat now voting ${this.state.config.chatResponseTime}s`,
			popularVotes: [],
		});

		this.votes = new Votes();

		let count = 0;
		this.ticker = setInterval(() => {
			count++;

			this.setState({
				announcement: `Player moved, chat now voting ${this.state.config.chatResponseTime - count}s`,
				popularVotes: this.votes.getPopularVotesWithCounts(),
			});

			if (count === this.state.config.chatResponseTime) {
				clearInterval(this.ticker);

				this.setState({
					announcement: `Chat moved`,
				});

				this.moveChat(this.votes.getPopularVotesWithCounts());
			}
		}, 1000);
	}

	handleConfigUpdate = (config: GameConfig) => {
		this.setState({
			config: config,
		});
	}

	handleChatMessage = (data: PrivmsgMessage) => {
		const found = data.messageText.match(this.moveRegex);
		if (found) {
			const move = new Move(found[1] + found[2], found[3] + found[4]);

			this.votes.addVote(data.senderUserID, move);
		}
	}
}