export default class Move {
    from: string;
    to: string;
    promotion: string;

    constructor(from: string, to: string, promotion: string = "q") {
        this.from = from.toLowerCase();
        this.to = to.toLowerCase();
        this.promotion = promotion.toLowerCase();
    }

    toString() {
        return `${this.from}-${this.to}`;
    }
}