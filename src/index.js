import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Basic CSS Reset
const style = document.createElement('style');
style.textContent = `
  body { margin: 0; padding: 0; background: #121212; }
  * { box-sizing: border-box; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);