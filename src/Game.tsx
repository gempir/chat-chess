import Chessboard from "chessboardjsx";
import * as React from "react";
import { Chess } from "chess.js";
import GameConfig from "./Model/GameConfig";
import Move from "./Model/Move";
import styled from "styled-components";

type props = {
    config: GameConfig,
    onUpdateConfig: (config: GameConfig) => void,
}

type state = {
    dropSquareStyle: object,
    squareStyles: object, 
    pieceSquare: string, 
    square: string, 
    history: Array<string>, 
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
        list-style-type: none;
        width: 200px;
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
    }

    render() {
        return <div className="game">
            <this.History>{this.state.history.map((item, key) => <li key={key}>{item.color} {item.from} -> {item.to}</li>)}</this.History>
            <Chessboard
                calcWidth={this.calcWidth}
                position={this.props.config.fen} onDrop={this.handleDrop} />
        </div>
    }

    handleDrop = ({ sourceSquare, targetSquare }) => {
        const moveObj = new Move(sourceSquare, targetSquare);
        const move = this.game.move(moveObj);

        // illegal move
        if (move === null) return;

        this.props.onUpdateConfig({...this.props.config, fen: this.game.fen()});
        this.setState(({ history, pieceSquare }) => ({
            history: this.game.history({ verbose: true }),
            squareStyles: this.squareStyling({ pieceSquare, history })
        }));

        console.log(this.state.history);

        // this.props.eventService.send({ type: "move", value: `${sourceSquare}-${targetSquare}` });
    };

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