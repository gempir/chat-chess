import * as React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

declare global {
    interface Window { gtag: any; }
}

ReactDOM.render(<App />, document.getElementById('root'));