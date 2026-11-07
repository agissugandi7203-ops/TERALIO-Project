import React from 'react';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import './styles/App.css';

export function App() {
  return (
    <div className="app-container">
      <Header />
      <HomePage />
      <footer className="footer">
        <p>Teralio Fullstack Platform &bull; Vite + Express + Supabase + OpenAI &bull; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
