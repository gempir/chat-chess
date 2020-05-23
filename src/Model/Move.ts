export default class Move {
    from: string;
    to: string;
    promotion: string;

    constructor(from: string, to: string, promotion: string = "q") {
        this.from = from;
        this.to = to;
        this.promotion = promotion;
    }
}