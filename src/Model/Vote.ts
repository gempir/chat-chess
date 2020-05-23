import Move from "./Move";

export default class PopularVote {
    move: Move;
    count: number;

    constructor(move: Move, count: number) {
        this.move = move;
        this.count = count;
    }
}