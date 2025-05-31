import React, { useRef, useEffect, useState } from 'react';
import AnnotationCanvas from './AnnotationCanvas';
import Toolbar from './Toolbar';
import { useAnnotations } from '../context/AnnotationContext';
import {
  fetchAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation
} from '../api';

import './VideoPlayer.css';

const VIDEO_SOURCE = '/assets/sample.mp4'; // or any publicURL

function VideoPlayer() {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedTool, setSelectedTool] = useState('select');
  const { state, dispatch } = useAnnotations();
  const [isPaused, setIsPaused] = useState(true);

  // Load annotations from backend once
  useEffect(() => {
    async function load() {
      // if video ID is fixed e.g. "default" or pass a prop
      const annos = await fetchAnnotations('default');
      dispatch({ type: 'SET_ANNOTATIONS', payload: annos });
    }
    load();
  }, []);

  // Update current time periodically
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const timeUpdate = () => setCurrentTime(v.currentTime);
    const loadedMeta = () => setDuration(v.duration);

    v.addEventListener('timeupdate', timeUpdate);
    v.addEventListener('loadedmetadata', loadedMeta);

    return () => {
      v.removeEventListener('timeupdate', timeUpdate);
      v.removeEventListener('loadedmetadata', loadedMeta);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (v.paused) v.play();
          else v.pause();
          break;
        case 'ArrowRight':
          v.currentTime = Math.min(v.currentTime + 5, v.duration);
          break;
        case 'ArrowLeft':
          v.currentTime = Math.max(v.currentTime - 5, 0);
          break;
        case 'KeyC':
          setSelectedTool('circle');
          break;
        case 'KeyR':
          setSelectedTool('rectangle');
          break;
        case 'KeyL':
          setSelectedTool('line');
          break;
        case 'KeyT':
          setSelectedTool('text');
          break;
        case 'Escape':
          setSelectedTool('select');
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    setIsPaused(v.paused);
  };

  const changeSpeed = (rate) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const seekTo = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    v.currentTime = newTime;
  };

  return (
    <div className="video-player-container">
      <video
        src={VIDEO_SOURCE}
        ref={videoRef}
        className="main-video"
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
      />

      {/* Overlay for drawing annotations */}
      <AnnotationCanvas
        videoRef={videoRef}
        currentTime={currentTime}
        isPaused={isPaused}
        selectedTool={selectedTool}
      />

      {/* Controls */}
      <div className="controls-container">
        <button onClick={togglePlay}>
          {isPaused ? 'Play' : 'Pause'}
        </button>

        <div className="progress-bar-wrapper" onClick={seekTo}>
          <div
            className="progress-bar"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <div>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <button onClick={() => frameByFrame(-1)}>◀️</button>
        <button onClick={() => frameByFrame(1)}>▶️</button>
        <select
          value={playbackRate}
          onChange={(e) => changeSpeed(Number(e.target.value))}
        >
          {[0.5, 1, 1.25, 1.5, 2].map((r) => (
            <option key={r} value={r}>
              {r}x
            </option>
          ))}
        </select>
        <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      </div>
    </div>
  );

  function formatTime(time) {
    if (isNaN(time)) return '00:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  function frameByFrame(direction) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    const fps = 25; // assume 25 fps
    v.currentTime = Math.max(
      0,
      Math.min(v.duration, v.currentTime + direction * (1 / fps))
    );
    setIsPaused(true);
  }
}

export default VideoPlayer; 