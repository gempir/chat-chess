import * as React from 'react';
import Game from './Game';
import styled from 'styled-components';
import { ChatClient, PrivmsgMessage } from "dank-twitch-irc";
import StartGame from './StartGame';
import GameConfig from './Model/GameConfig';
import Move from './Model/Move';
import Votes from './Model/Votes';
import PopularVote from './Model/Vote';

export default class App extends React.Component<{}, { config: GameConfig, popularVotes: Array<PopularVote>, announcement: string, timeLeft: number }> {
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
		padding: 5rem;
		padding-top: 2rem;
		color: var(--text);
		background: var(--background);

		strong {
			color: var(--highlight);
		}

		a {
			text-decoration: none;
			color: var(--highlight);
		}
	`;

	Announcement = styled.div`
		height: 25px;
		font-size: 25px;
		line-height: 25px;
		margin-bottom: 10px;
	`;

	TimeLeft = styled.div`
		height: 25px;
		font-size: 25px;
		line-height: 25px;
		margin-bottom: 10px;
	`;

	PopularVotes = styled.table`
		tbody {
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

			em {
				font-style: normal;
				color: var(--lighterBackground);
			}
		}       
	`;

	Reset = styled.div`
		position: absolute;
		bottom: 0;
		left: 20px;
		font-size: 2rem;
		user-select: none;
		bottom: 20px;
		cursor: pointer;

		&:hover {
			transform: scale(1.1);
		}
	`;

	constructor(props) {
		super(props);

		this.moveRegex = new RegExp(/([a-h]) ?([1-8]) ?[-,_]? ?([a-h]) ?([1-8])/);

		this.votes = new Votes();
		this.state = this.createInitialState();
	}

	createInitialState = () => {
		return {
			config: null,
			popularVotes: [],
			announcement: null,
			...JSON.parse(window.localStorage.getItem("state"))
		}
	}

	componentDidMount = () => {
		this.setupChat();

		if (this.state.config && this.state.config.turn === "b") {
			this.startChatVoteCollection();
		}
	}

	componentDidUpdate = (prevProps, prevState) => {
		if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
			this.persistState();
		}
	}

	render() {
		return (
			<this.CSSVariables>
				<this.Wrapper>
					{this.state.config && <this.PopularVotes><tbody>{this.state.popularVotes.map((vote, key) =>
						<tr key={key}><td>{vote.move.from}</td><td>-</td><td>{vote.move.to}</td><td><em>({vote.count})</em></td></tr>)}
					</tbody></this.PopularVotes>}
					<this.Announcement>{this.state.announcement && <span dangerouslySetInnerHTML={{ __html: this.state.announcement }} />}</this.Announcement>
					<this.TimeLeft>{this.state.timeLeft > 0 && `${this.state.timeLeft}s`}&nbsp;</this.TimeLeft>
					{this.state.config && <Game config={this.state.config} onUpdateConfig={this.handleConfigUpdate} onPlayerMove={this.handlePlayerMove} registerOnChatMove={move => this.moveChat = move} onGameOver={this.handleGameOver} />}
					{!this.state.config && <StartGame onGameStart={this.handleGameStart} />}
					<this.Reset onClick={this.clearState}>🗑️</this.Reset>
				</this.Wrapper>
			</this.CSSVariables>
		);
	}

	handleGameOver = () => {
		this.setState({
			announcement: "Game over!"
		});
	}

	handleGameStart = (config: GameConfig) => {
		this.setState({
			config: config,
		}, () => {
			this.persistState();
			this.track();
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

		if (this.state.config) {
			this.chatClient.join(this.state.config.channel);
			this.track();
		}
	}

	track() {
		if (window.ga && this.state.config) {
			window.ga('send', {
				hitType: 'event',
				eventCategory: 'game',
				eventAction: 'channel_join',
				eventLabel: this.state.config.channel
			});
		}
	}

	handlePlayerMove = (move: Move) => {
		this.startChatVoteCollection();
	}

	startChatVoteCollection = () => {
		this.setState({
			announcement: "Vote now, like this: <strong>e7-e5</strong>",
			timeLeft: this.state.config.chatResponseTime,
			popularVotes: [],
		});

		this.votes = new Votes();

		this.ticker = setInterval(() => {
			const timeLeft = this.state.timeLeft - 1;
			this.setState({
				announcement: "Vote now, like this: <strong>e7-e5</strong></>",
				timeLeft: timeLeft,
				popularVotes: this.votes.getPopularVotesWithCounts(),
			});

			if (timeLeft === 0 || timeLeft < 0) {
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

	persistState = () => {
		window.localStorage.setItem("state", JSON.stringify({ ...this.state, popularVotes: [] }));
	}

	clearState = () => {
		window.localStorage.removeItem("state");
		this.setState({
			...this.createInitialState(),
		})
	}

	handleChatMessage = (data: PrivmsgMessage) => {
		const found = data.messageText.toLowerCase().match(this.moveRegex);
		if (found) {
			const move = new Move(found[1] + found[2], found[3] + found[4]);

			this.votes.addVote(data.senderUserID, move);
			this.votes.addVote(data.senderUserID + "1", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "3", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "2", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "3", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "4", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "5", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "6", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "7", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "8", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "9", new Move("f1", "f4"));
			this.votes.addVote(data.senderUserID + "10", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "11", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "13", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "14", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "15", new Move("f2", "f4"));
			this.votes.addVote(data.senderUserID + "16", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "17", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "18", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "19", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "20", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "21", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "22", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "23", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "24", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "25", new Move("f3", "f4"));
			this.votes.addVote(data.senderUserID + "26", new Move("f3", "f4"));
		}
	}
}