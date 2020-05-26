export default interface GameConfig {
    channel: string,
    chatResponseTime: number,
    fen: string,
    turn: string,
    history: Array<HistoryItem>,
    side: "white" | "black";
    subMultiplier: number,
}

interface HistoryItem {
    from: string;
    to: string;
    piece: string;
    color: string;
}