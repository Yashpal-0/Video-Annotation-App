import React from 'react';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <div className="video-section">
        <VideoPlayer />
      </div>
      <div className="sidebar-section">
        <Sidebar />
      </div>
    </div>
  );
}

export default App; 