export default interface GameConfig {
    channel: string,
    chatResponseTime: number,
    fen: string,
    turn: string,
    history: Array<HistoryItem>,
}

interface HistoryItem {
    from: string;
    to: string;
    piece: string;
    color: string;
}