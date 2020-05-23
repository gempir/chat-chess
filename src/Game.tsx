import Chessboard from "chessboardjsx";
import * as React from "react";
import { Chess } from "chess.js";
import GameConfig from "./Model/GameConfig";
import Move from "./Model/Move";
import styled from "styled-components";
import PopularVote from "./Model/Vote";

type props = {
    config: GameConfig,
    onUpdateConfig: (config: GameConfig) => void,
    onPlayerMove: (move: Move) => void,
    registerOnChatMove: any,
}

type state = {
    dropSquareStyle: object,
    squareStyles: object,
    pieceSquare: string,
    square: string
}

export default class Game extends React.Component<props, state> {
    game: any;

    state = {
        dropSquareStyle: {},
        squareStyles: {},
        pieceSquare: "",
        square: "",
        history: [],
    }

    History = styled.ul`
        position: absolute;
        left: 20px;
        top: 20px;
        bottom: 20px;
        overflow: scroll;
        font-size: 2rem;
        list-style-type: none;
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

    componentDidMount() {
        this.game = new Chess();
        this.loadConfig(this.props.config);
        this.props.registerOnChatMove(this.chatMove);
    }

    loadConfig = (config: GameConfig) => {
        this.game.load(config.fen);
    }

    render() {
        return <div className="game">
            <this.History>{this.props.config.history.map((item, key) => <li key={key}>{item.color} {item.from} -> {item.to}</li>)}</this.History>
            <Chessboard
                calcWidth={this.calcWidth}
                position={this.props.config.fen} onDrop={this.handleDrop} />
        </div>
    }

    handleDrop = ({ sourceSquare, targetSquare, piece }) => {
        if (piece.startsWith("b")) return;

        const moveObj = new Move(sourceSquare, targetSquare);
        const move = this.game.move(moveObj);

        // illegal move
        if (move === null) return;

        const history = this.game.history({ verbose: true });

        this.props.onUpdateConfig({ ...this.props.config, fen: this.game.fen(), history, turn: this.game.turn() });
        this.setState(({ pieceSquare }) => ({
            squareStyles: this.squareStyling({ pieceSquare, history })
        }));

        this.props.onPlayerMove(move);
    };

    chatMove = (votes: Array<PopularVote>) => {
        for (const moveObj of votes) {
            const move = this.game.move(moveObj.move);

            // illegal move
            if (move === null) continue;
            const history = this.game.history({ verbose: true });

            this.props.onUpdateConfig({ ...this.props.config, fen: this.game.fen(), history, turn: this.game.turn() });
            this.setState(({ pieceSquare }) => ({
                squareStyles: this.squareStyling({ pieceSquare, history })
            }));

            return;
        }

        const validMoves = this.game.moves();
        const autoMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const move = this.game.move(autoMove);

        const history = this.game.history({ verbose: true });

        this.props.onUpdateConfig({ ...this.props.config, fen: this.game.fen(), history, turn: this.game.turn() });
        this.setState(({ pieceSquare }) => ({
            squareStyles: this.squareStyling({ pieceSquare, history })
        }));

        return;
    }

    calcWidth = ({ screenWidth, screenHeight }) => {
        return screenHeight - 200;
    }

    squareStyling = ({ pieceSquare, history }) => {
        const sourceSquare = history.length && history[history.length - 1].from;
        const targetSquare = history.length && history[history.length - 1].to;

        return {
            [pieceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
            ...(history.length && {
                [sourceSquare]: {
                    backgroundColor: "rgba(255, 255, 0, 0.4)"
                }
            }),
            ...(history.length && {
                [targetSquare]: {
                    backgroundColor: "rgba(255, 255, 0, 0.4)"
                }
            })
        };
    };
}