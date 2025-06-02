import logo from './logo.svg';
import './App.css';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';

function App() {
  const videoSrc = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  return (
    <div className="App">
      <header className="App-header">
        <h2>Custom Video Player</h2>
        <VideoPlayer src={videoSrc} />
      </header>
    </div>
  );
}

export default App;
