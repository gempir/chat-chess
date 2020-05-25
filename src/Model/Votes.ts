import Move from "./Move";
import PopularVote from "./Vote";

export default class Votes {
    moves: object;
    movesArray: Array<Move>

    constructor() {
        this.moves = {};
        this.movesArray = [];
    }

    addVote(userid: string, move: Move, multiplier: number) {
        if (this.moves.hasOwnProperty(userid)) return;

        this.moves[userid] = move;

        for (let i = 0; i < multiplier; i++) {
            this.movesArray.push(move);
        }
    }

    getPopularVotesWithCounts(): Array<PopularVote> {
        const moves: { [key: string]: PopularVote } = {};

        for (const value of this.movesArray) {
            if (moves.hasOwnProperty(value.toString())) {
                moves[value.toString()].count++;
            } else {
                moves[value.toString()] = new PopularVote(value, 1);
            }
        }

        return Object.values(moves).sort((a: any, b: any): number => {
            if (a.count == b.count) return 0;
            if (a.count > b.count) return -1;
            if (a.count < b.count) return 1;
        });
    }
}