import React from 'react';
import App from './App';
import Admin from './Admin';

export default function AppRouter() {
    const path = window.location.pathname;

    if (path === '/admin') {
        return <Admin />;
    }

    return <App />;
}