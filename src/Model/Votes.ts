import Move from "./Move";
import PopularVote from "./Vote";

export default class Votes {
    moves: object;

    constructor(moves: object = {}) {
        this.moves = moves;
    }

    addVote(userid: string, move: Move) {
        this.moves[userid] = move;
    }

    getPopularVotesWithCounts(): Array<PopularVote> {
        const moves: { [key: string]: PopularVote } = {};

        for (const [key, value] of Object.entries(this.moves)) {
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