import React from 'react';
import './Controls.css'; // We will create this CSS file next
import {
  PlayIcon, PauseIcon,
  FullscreenEnterIcon, FullscreenExitIcon,
  PreviousFrameIcon, NextFrameIcon,
  UndoIcon, RedoIcon // Import new icons
} from './icons'; // Import icons

const Controls = ({
  isPlaying,
  onPlayPause,
  progress,
  onSeek,
  currentTime,
  duration,
  onToggleFullScreen,
  isFullScreen,
  buffered,
  playbackRate,
  onChangePlaybackRate,
  onStepFrame,
  onSelectTool, // Add tool selection handler
  currentTool, // Add current tool for styling active button
  videoTotalDuration, // New prop for raw total duration
  annotations, // New prop for annotation data
  onUndo, // New prop
  onRedo, // New prop
  canUndo, // New prop
  canRedo  // New prop
}) => {
  const playbackSpeedOptions = [0.5, 1, 1.25, 1.5, 2];
  const annotationTools = [
    { name: 'Circle', type: 'circle' },
    { name: 'Rectangle', type: 'rectangle' },
    { name: 'Line', type: 'line' },
    { name: 'Text', type: 'text' },
  ];

  const handlePlaybackSpeedChange = () => {
    const currentIndex = playbackSpeedOptions.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackSpeedOptions.length;
    onChangePlaybackRate(playbackSpeedOptions[nextIndex]);
  };

  // Helper to format time, assuming it might be useful here too or importable
  // For simplicity, duplicating a basic version if not already available via props
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === undefined) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="controls-container">
      <button onClick={onUndo} className="control-button undo-redo-button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo}>
        <UndoIcon className="control-icon smaller-icon" />
      </button>
      <button onClick={onRedo} className="control-button undo-redo-button" aria-label="Redo" title="Redo (Ctrl+Y)" disabled={!canRedo}>
        <RedoIcon className="control-icon smaller-icon" />
      </button>
      <button onClick={() => onStepFrame(-1)} className="control-button frame-step-button" aria-label="Previous Frame">
        <PreviousFrameIcon className="control-icon" />
      </button>
      <button onClick={onPlayPause} className="control-button play-pause-button" aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <PauseIcon className="control-icon" /> : <PlayIcon className="control-icon" />}
      </button>
      <button onClick={() => onStepFrame(1)} className="control-button frame-step-button" aria-label="Next Frame">
        <NextFrameIcon className="control-icon" />
      </button>
      <div className="progress-bar-container">
        <div className="progress-bar-buffered" style={{ width: `${buffered}%` }}></div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={onSeek}
          className="progress-bar"
        />
        {/* Annotation Markers */} 
        {videoTotalDuration > 0 && annotations && annotations.map(ann => {
          if (ann.timestamp === undefined) return null;
          const markerPosition = (ann.timestamp / videoTotalDuration) * 100;
          // Ensure marker is within bounds and only if timestamp is valid
          if (markerPosition >= 0 && markerPosition <= 100) {
            return (
              <div
                key={`marker-${ann.id}`}
                className="annotation-marker"
                style={{ left: `${markerPosition}%` }}
                title={`Annotation at ${formatTime(ann.timestamp)}`}
              ></div>
            );
          }
          return null;
        })}
      </div>
      <div className="time-display">
        <span>{currentTime}</span> / <span>{duration}</span>
      </div>

      {/* Annotation Tools */} 
      <div className="annotation-tools-group">
        {annotationTools.map(tool => (
          <button
            key={tool.type}
            onClick={() => onSelectTool(tool.type)}
            className={`control-button annotation-tool-button ${currentTool === tool.type ? 'active' : ''}`}
            aria-label={`Select ${tool.name} tool`}
            title={`${tool.name} Tool`}
          >
            {/* Placeholder - replace with icons later */}
            {tool.name.substring(0,1)}
          </button>
        ))}
        {currentTool && (
            <button
                onClick={() => onSelectTool(null)} // Deselect tool
                className="control-button annotation-tool-button deselect-button"
                aria-label="Deselect Tool"
                title="Deselect Tool (Cursor)"
            >
                X {/* Placeholder for a cursor icon or clear icon */}
            </button>
        )}
      </div>

      <button onClick={handlePlaybackSpeedChange} className="control-button playback-speed-button" aria-label={`Playback speed ${playbackRate}x`}>
        {playbackRate}x
      </button>
      <button onClick={onToggleFullScreen} className="control-button fullscreen-button" aria-label={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
        {isFullScreen ? <FullscreenExitIcon className="control-icon" /> : <FullscreenEnterIcon className="control-icon" />}
      </button>
    </div>
  );
};

export default Controls; 