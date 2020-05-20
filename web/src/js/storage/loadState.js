export default function () {
    try {
        const serializedState = localStorage.getItem('state');
        if (serializedState === null) {
            return {};
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return {};
    }
}; 