import Chessboard from "chessboardjsx";
import React from "react";
import Chess from "chess.js";

export default class Game extends React.Component {
    state = {
        // square styles for active drop square
        dropSquareStyle: {},
        // custom square styles
        squareStyles: {},
        // square with the currently clicked piece
        pieceSquare: "",
        // currently clicked square
        square: "",
        // array of past game moves
        history: [],
        // game state, will be overriden by server a lot
        fen: this.props.fen,
    }

    componentDidUpdate(prevProps) {
        if (prevProps.fen != this.props.fen) {
            this.setState({
                fen: this.props.fen,
            });

            this.game.load(this.props.fen);
        }
    }

    componentDidMount() {
        this.game = new Chess();
    }

    render() {
        return <div className="game">
            <Chessboard
                calcWidth={this.calcWidth}
                position={this.state.fen} onDrop={this.handleDrop} />
        </div>
    }

    handleDrop = ({ sourceSquare, targetSquare }) => {
        // see if the move is legal
        let move = this.game.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q" // always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null) return;
        this.setState(({ history, pieceSquare }) => ({
            fen: this.game.fen(),
            history: this.game.history({ verbose: true }),
            squareStyles: this.squareStyling({ pieceSquare, history })
        }));

        this.props.eventService.send({ type: "move", value: `${sourceSquare}-${targetSquare}` });
    };

    calcWidth = ({screenWidth, screenHeight}) => {
        return screenHeight - 100;
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