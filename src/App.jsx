import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuickPlay from './pages/QuickPlay';
import Header from './components/frames/Header';
import './App.css';

function App() {
  return (
    <div>
      <div className="app-container">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quickplay" element={<QuickPlay />} />
      </Routes>
    </div>
    </div>
  );
}

export default App;
