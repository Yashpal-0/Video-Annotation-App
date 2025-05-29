import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings,
  FastForward, Rewind, Circle, Rectangle, Type, Spline, Trash2, Undo, Redo
} from 'lucide-react';

const VIDEO_ANNOTATIONS_KEY = 'video-annotations';
const SELECTION_PADDING = 10; // Padding around shapes for easier selection
const DEFAULT_ANNOTATION_DURATION = 3; // seconds

const VideoPlayer = ({
  src,
  annotations, // from App state
  onCreateAnnotation, // Changed from setAnnotations
  onUpdateAnnotation, // New prop for updates from dragging/properties
  selectedAnnotation,
  setSelectedAnnotation,
  onTimeUpdate, // callback to inform App of time changes
  videoRefPassed, // Renamed from videoRef to avoid conflict with local useRef
  onUndo,
  onRedo,
  currentHistoryIndex,
  annotationHistoryLength,
  deleteAnnotationHandler // Prop for deleting
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTimeLocal] = useState(0); // Local current time for player UI
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const [annotationHistory, setAnnotationHistory] = useState([[]]); // Start with initial empty state
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const [selectedTool, setSelectedToolLocal] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentDrawingAnnotation, setCurrentDrawingAnnotation] = useState(null); // Renamed from currentAnnotation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState(null);

  const localVideoRef = useRef(null); // Use local ref for direct video manipulations
  const playerRef = useRef(null);
  const canvasRef = useRef(null);

  let controlsTimeout;

  // Assign the passed ref to the local video element ref
  useEffect(() => {
    if (videoRefPassed) {
      videoRefPassed.current = {
        videoEl: localVideoRef.current, // Expose the video element itself
        // You can add other methods here if App needs to call them, e.g.,
        // getCurrentTime: () => localVideoRef.current?.currentTime,
      };
    }
  }, [videoRefPassed]);

  // Propagate currentTime changes to App component
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime);
    }
  }, [currentTime, onTimeUpdate]);

  // Effect for video events (timeupdate, loadedmetadata, ended)
  useEffect(() => {
    const video = localVideoRef.current;
    if (video) {
      const updateLocalProgress = () => setCurrentTimeLocal(video.currentTime);
      const setVideoDuration = () => setDuration(video.duration);
      video.addEventListener('timeupdate', updateLocalProgress);
      video.addEventListener('loadedmetadata', setVideoDuration);
      video.addEventListener('ended', () => setIsPlaying(false));
      const setCanvasDimensions = () => {
        if (canvasRef.current && video.videoWidth > 0) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
        }
      };
      if (video.readyState >= 1) { // Check if metadata is already loaded
        setCanvasDimensions();
      }
      video.addEventListener('loadedmetadata', setCanvasDimensions);
      return () => {
        video.removeEventListener('timeupdate', updateLocalProgress);
        video.removeEventListener('loadedmetadata', setVideoDuration);
        video.removeEventListener('ended', () => setIsPlaying(false));
        video.removeEventListener('loadedmetadata', setCanvasDimensions);
      };
    }
  }, []); // Removed videoRefPassed from dependency array as localVideoRef is stable

  useEffect(() => {
    const video = localVideoRef.current;
    if (video) video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Keyboard shortcuts - Undo/Redo are handled by App, delete needs selectedAnnotation from App
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { onRedo && onRedo(); }
        else { onUndo && onUndo(); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo && onRedo();
        return;
      }
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); handleSeek(currentTime - 5); break;
        case 'ArrowRight': e.preventDefault(); handleSeek(currentTime + 5); break;
        case 'Delete':
        case 'Backspace':
          if (selectedAnnotation) { // selectedAnnotation from App props
            e.preventDefault();
            deleteAnnotationHandler(selectedAnnotation.id);
          }
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, isPlaying, selectedAnnotation, onUndo, onRedo, deleteAnnotationHandler]); // Removed setAnnotations

  // Drawing logic uses 'annotations' from props
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = localVideoRef.current;
    if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext('2d');
    const annotationsToDraw = annotations || []; // Use annotations from props

    const drawAnnotations = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sortedAnnotations = [...annotationsToDraw].sort((a, b) => a.timestamp - b.timestamp);

      sortedAnnotations.forEach((ann, index) => {
        const annDuration = ann.duration || DEFAULT_ANNOTATION_DURATION;
        let actualDisplayEnd;
        const nextAnnotation = sortedAnnotations[index + 1];
        if (nextAnnotation && nextAnnotation.timestamp < ann.timestamp + annDuration) {
          actualDisplayEnd = nextAnnotation.timestamp;
        } else {
          actualDisplayEnd = ann.timestamp + annDuration;
        }
        const isCurrentlyVisible = currentTime >= ann.timestamp && currentTime < actualDisplayEnd;
        const isSelectedAndShouldBeVisible = selectedAnnotation?.id === ann.id && (currentTime >= ann.timestamp && currentTime < ann.timestamp + (ann.duration || DEFAULT_ANNOTATION_DURATION));

        if (isCurrentlyVisible || isSelectedAndShouldBeVisible) {
          const isSelected = selectedAnnotation && selectedAnnotation.id === ann.id;
          ctx.strokeStyle = isSelected ? '#00FFFF' : (ann.color || 'red');
          ctx.fillStyle = isSelected ? '#00FFFF' : (ann.color || 'red');
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.globalAlpha = 0.7;
          if (ann.type === 'circle') {
            const radius = Math.sqrt(Math.pow(ann.endX - ann.startX, 2) + Math.pow(ann.endY - ann.startY, 2));
            ctx.beginPath(); ctx.arc(ann.startX, ann.startY, radius, 0, 2 * Math.PI); ctx.stroke();
            if (isSelected) drawSelectionHandles(ctx, ann.startX - radius, ann.startY - radius, radius * 2, radius * 2);
          } else if (ann.type === 'rectangle') {
            const width = ann.endX - ann.startX; const height = ann.endY - ann.startY;
            ctx.beginPath(); ctx.rect(ann.startX, ann.startY, width, height); ctx.stroke();
            if (isSelected) drawSelectionHandles(ctx, ann.startX, ann.startY, width, height);
          } else if (ann.type === 'line') {
            ctx.beginPath(); ctx.moveTo(ann.startX, ann.startY); ctx.lineTo(ann.endX, ann.endY); ctx.stroke();
            if (isSelected) drawSelectionHandles(ctx, Math.min(ann.startX, ann.endX), Math.min(ann.startY, ann.endY), Math.abs(ann.endX - ann.startX), Math.abs(ann.endY - ann.startY), true);
          } else if (ann.type === 'text' && ann.text) {
            ctx.font = ann.fontSize ? `${ann.fontSize}px Arial` : '16px Arial';
            ctx.fillText(ann.text, ann.x, ann.y);
            if (isSelected) {
              const textMetrics = ctx.measureText(ann.text);
              const textHeight = ann.fontSize || 16;
              drawSelectionHandles(ctx, ann.x, ann.y - textHeight, textMetrics.width, textHeight);
            }
          }
          ctx.globalAlpha = 1.0;
        }
      });
      if (drawing && currentDrawingAnnotation) { // Use currentDrawingAnnotation
        ctx.strokeStyle = 'blue'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.beginPath();
        if (currentDrawingAnnotation.type === 'circle') {
          const radius = Math.sqrt(Math.pow(currentDrawingAnnotation.endX - currentDrawingAnnotation.startX, 2) + Math.pow(currentDrawingAnnotation.endY - currentDrawingAnnotation.startY, 2));
          ctx.arc(currentDrawingAnnotation.startX, currentDrawingAnnotation.startY, radius, 0, 2 * Math.PI);
        } else if (currentDrawingAnnotation.type === 'rectangle') {
          ctx.rect(currentDrawingAnnotation.startX, currentDrawingAnnotation.startY, currentDrawingAnnotation.endX - currentDrawingAnnotation.startX, currentDrawingAnnotation.endY - currentDrawingAnnotation.startY);
        } else if (currentDrawingAnnotation.type === 'line') {
          ctx.moveTo(currentDrawingAnnotation.startX, currentDrawingAnnotation.startY);
          ctx.lineTo(currentDrawingAnnotation.endX, currentDrawingAnnotation.endY);
        }
        ctx.stroke(); ctx.globalAlpha = 1.0;
      }
    };
    const drawSelectionHandles = (ctx, x, y, width, height, isLine = false) => {
      ctx.fillStyle = '#00FFFF'; const handleSize = 8; const halfHandle = handleSize / 2;
      if (isLine) {
        ctx.fillRect(x - halfHandle, y - halfHandle, handleSize, handleSize);
        ctx.fillRect(x + width - halfHandle, y + height - halfHandle, handleSize, handleSize);
      } else {
        const handles = [
          { x: x - halfHandle, y: y - halfHandle }, { x: x + width / 2 - halfHandle, y: y - halfHandle }, { x: x + width - halfHandle, y: y - halfHandle },
          { x: x - halfHandle, y: y + height / 2 - halfHandle }, { x: x + width - halfHandle, y: y + height / 2 - halfHandle },
          { x: x - halfHandle, y: y + height - halfHandle }, { x: x + width / 2 - halfHandle, y: y + height - halfHandle }, { x: x + width - halfHandle, y: y + height - halfHandle }
        ];
        handles.forEach(handle => ctx.fillRect(handle.x, handle.y, handleSize, handleSize));
      }
    };
    drawAnnotations();
    const intervalId = setInterval(drawAnnotations, 1000 / 30);
    return () => clearInterval(intervalId);
  }, [annotations, currentTime, drawing, currentDrawingAnnotation, selectedAnnotation, duration]); // Removed videoRef

  const handleSeek = (time) => {
    const video = localVideoRef.current;
    if (video && isFinite(time)) {
      const newTime = Math.max(0, Math.min(time, duration));
      video.currentTime = newTime;
      setCurrentTimeLocal(newTime); // Update local state for UI responsiveness
      if(onTimeUpdate) onTimeUpdate(newTime); // Inform App
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (isPlaying) { alert("Please pause the video to interact with annotations."); return; }
    const { x, y } = getMousePosition(e);
    const currentAnnotationsInPlayer = annotations || [];
    for (let i = currentAnnotationsInPlayer.length - 1; i >= 0; i--) {
      const ann = currentAnnotationsInPlayer[i];
      const annDuration = ann.duration || DEFAULT_ANNOTATION_DURATION;
      const isVisible = currentTime >= ann.timestamp && currentTime < ann.timestamp + annDuration;
      if (isPointInsideShape({ x, y }, ann) && (isVisible || selectedAnnotation?.id === ann.id)) {
        setSelectedAnnotation(ann);
        setSelectedToolLocal(null);
        setIsDragging(true);
        setDragStartPoint({ x, y, originalX: ann.startX, originalY: ann.startY, originalEndX: ann.endX, originalEndY: ann.endY, originalTextX: ann.x, originalTextY: ann.y });
        return;
      }
    }
    if (selectedTool) {
      setDrawing(true);
      setStartPoint({ x, y });
      setCurrentDrawingAnnotation({ type: selectedTool, startX: x, startY: y, endX: x, endY: y, timestamp: currentTime, color: 'red', id: `temp-${Date.now()}` });
      setSelectedAnnotation(null);
    } else {
      setSelectedAnnotation(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const { x, y } = getMousePosition(e);
    if (drawing && selectedTool) {
      setCurrentDrawingAnnotation(prev => ({ ...prev, endX: x, endY: y }));
    } else if (isDragging && selectedAnnotation && dragStartPoint) {
      const dx = x - dragStartPoint.x;
      const dy = y - dragStartPoint.y;
      const updatedAnn = { ...selectedAnnotation };
      if (selectedAnnotation.type === 'text') {
        updatedAnn.x = dragStartPoint.originalTextX + dx;
        updatedAnn.y = dragStartPoint.originalTextY + dy;
      } else {
        updatedAnn.startX = dragStartPoint.originalX + dx;
        updatedAnn.startY = dragStartPoint.originalY + dy;
        updatedAnn.endX = dragStartPoint.originalEndX + dx;
        updatedAnn.endY = dragStartPoint.originalEndY + dy;
      }
      // Preview the drag locally on selectedAnnotation state for responsiveness
      setSelectedAnnotation(updatedAnn);
      // For final update, mouseUp will call onUpdateAnnotation
    }
  };

  const handleCanvasMouseUp = () => {
    if (drawing && selectedTool && currentDrawingAnnotation) {
      setDrawing(false);
      const newAnnotationData = { ...currentDrawingAnnotation, duration: DEFAULT_ANNOTATION_DURATION }; // Add default duration
      // Remove temporary ID before sending to backend, backend will assign one
      delete newAnnotationData.id; 
      
      if (selectedTool === 'text') {
        const text = prompt("Enter annotation text:");
        if (text) {
          onCreateAnnotation({ ...newAnnotationData, text, x: newAnnotationData.startX, y: newAnnotationData.startY, type: 'text' });
        }
      } else {
        if (!(Math.abs(newAnnotationData.startX - newAnnotationData.endX) < 5 && Math.abs(newAnnotationData.startY - newAnnotationData.endY) < 5 && (selectedTool === 'circle' || selectedTool === 'rectangle' || selectedTool === 'line'))) {
          onCreateAnnotation(newAnnotationData);
        }
      }
      setCurrentDrawingAnnotation(null);
      setStartPoint(null);
    } else if (isDragging && selectedAnnotation) {
      setIsDragging(false);
      // Call onUpdateAnnotation with the final state of selectedAnnotation (which was updated during mouseMove)
      onUpdateAnnotation(selectedAnnotation); 
      setDragStartPoint(null);
    }
  };

  const handleToolSelect = (tool) => {
    if (isPlaying) { alert("Please pause the video to select a drawing tool."); return; }
    setSelectedToolLocal(tool);
    setSelectedAnnotation(null); // Deselect in App state
  };

  // Other functions (togglePlayPause, etc.) mostly remain the same, but use localVideoRef.current
  const togglePlayPause = () => {
    const video = localVideoRef.current;
    if (video) { if (isPlaying) video.pause(); else video.play(); setIsPlaying(!isPlaying); }
  };
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (localVideoRef.current) { localVideoRef.current.volume = newVolume; setIsMuted(newVolume === 0); }
  };
  const toggleMute = () => {
    const video = localVideoRef.current;
    if (video) { video.muted = !isMuted; setIsMuted(!isMuted); if (!isMuted && volume === 0) setVolume(0.5); if (isMuted && video.volume > 0) setVolume(video.volume); }
  };
  const toggleFullScreen = () => {
    const player = playerRef.current;
    if (player) { if (!document.fullscreenElement) { player.requestFullscreen().catch(err => alert(`Error: ${err.message}`)); setIsFullScreen(true); } else { document.exitFullscreen(); setIsFullScreen(false); } }
  };
  const handlePlaybackSpeedChange = (speed) => setPlaybackSpeed(speed);
  const handleFrameStep = (direction) => {
    const video = localVideoRef.current;
    if (video && !isPlaying) { const frameRate = 1 / 30; handleSeek(video.currentTime + direction * frameRate); }
  };
  const getMousePosition = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); const video = localVideoRef.current;
    if (!video || !canvas) return {x:0, y:0};
    const scaleX = canvas.width / video.clientWidth; const scaleY = canvas.height / video.clientHeight;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
   const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  const handleMouseMoveControls = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => setShowControls(false), 3000);
  };

  const handleMouseLeaveControls = () => {
    if (isPlaying && !drawing && !isDragging) {
      controlsTimeout = setTimeout(() => setShowControls(false), 1000);
    }
  };

  const isPointInsideShape = (point, shape) => {
    if (!shape) return false;
    const { x, y } = point;
    const { startX, startY, endX, endY, type } = shape;

    switch (type) {
        case 'circle':
            const centerX = startX;
            const centerY = startY;
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) <= radius + SELECTION_PADDING;
        case 'rectangle':
            const minX = Math.min(startX, endX) - SELECTION_PADDING;
            const maxX = Math.max(startX, endX) + SELECTION_PADDING;
            const minY = Math.min(startY, endY) - SELECTION_PADDING;
            const maxY = Math.max(startY, endY) + SELECTION_PADDING;
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        case 'line':
            const distToStart = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            const distToEnd = Math.sqrt(Math.pow(x - endX, 2) + Math.pow(y - endY, 2));
            const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            return distToStart + distToEnd >= lineLength - SELECTION_PADDING && distToStart + distToEnd <= lineLength + SELECTION_PADDING;
        case 'text':
            const fontSize = shape.fontSize || 16;
            const textWidth = shape.text ? shape.text.length * (fontSize / 2) : 0; 
            return x >= shape.x - SELECTION_PADDING && x <= shape.x + textWidth + SELECTION_PADDING &&
                   y >= shape.y - fontSize - SELECTION_PADDING && y <= shape.y + SELECTION_PADDING;
        default:
            return false;
    }
};

  return (
    <div ref={playerRef} className="relative w-full bg-black group" onMouseMove={handleMouseMoveControls} onMouseLeave={handleMouseLeaveControls}>
      <video
        ref={localVideoRef}
        src={src}
        className="w-full h-auto block"
        onClick={togglePlayPause}
        onDoubleClick={toggleFullScreen}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      ></canvas>
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300">
          <div className="relative w-full mb-2">
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => handleSeek(parseFloat(e.target.value))} className="w-full h-2 accent-red-500 cursor-pointer appearance-none bg-gray-700 rounded-lg" style={{ WebkitAppearance: 'none' }} />
            {(annotations || []).map(ann => (
              duration > 0 && (
                <div key={ann.id} className="absolute h-2 w-1 bg-yellow-400 rounded-full pointer-events-none" style={{ left: `${(ann.timestamp / duration) * 100}%`, top: '0px' }} title={`Annotation at ${formatTime(ann.timestamp)}`}></div>
              )
            ))}
          </div>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button onClick={() => handleFrameStep(-1)} title="Previous Frame" className="hover:text-red-500 disabled:opacity-50" disabled={isPlaying}><Rewind size={20} /></button>
              <button onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"} className="hover:text-red-500">{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
              <button onClick={() => handleFrameStep(1)} title="Next Frame" className="hover:text-red-500 disabled:opacity-50" disabled={isPlaying}><FastForward size={20} /></button>
              <div className="flex items-center">
                <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} className="hover:text-red-500">{isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 ml-1 accent-red-500 cursor-pointer" />
              </div>
              <div className="text-xs">{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
            {!isPlaying && (
              <div className="flex items-center space-x-1">
                <button onClick={onUndo} className="p-1 rounded hover:bg-gray-700 disabled:opacity-50" title="Undo (Ctrl+Z)" disabled={currentHistoryIndex === 0}><Undo size={18}/></button>
                <button onClick={onRedo} className="p-1 rounded hover:bg-gray-700 disabled:opacity-50" title="Redo (Ctrl+Y)" disabled={currentHistoryIndex >= annotationHistoryLength - 1}><Redo size={18}/></button>
                <button onClick={() => handleToolSelect('circle')} className={`p-1 rounded ${selectedTool === 'circle' ? 'bg-red-500' : 'hover:bg-gray-700'}`} title="Circle (C)"><Circle size={18}/></button>
                <button onClick={() => handleToolSelect('rectangle')} className={`p-1 rounded ${selectedTool === 'rectangle' ? 'bg-red-500' : 'hover:bg-gray-700'}`} title="Rectangle (R)"><Rectangle size={18}/></button>
                <button onClick={() => handleToolSelect('line')} className={`p-1 rounded ${selectedTool === 'line' ? 'bg-red-500' : 'hover:bg-gray-700'}`} title="Line (L)"><Spline size={18}/></button>
                <button onClick={() => handleToolSelect('text')} className={`p-1 rounded ${selectedTool === 'text' ? 'bg-red-500' : 'hover:bg-gray-700'}`} title="Text (T)"><Type size={18}/></button>
                {selectedAnnotation && <button onClick={() => deleteAnnotationHandler(selectedAnnotation.id)} className="p-1 rounded hover:bg-gray-700" title="Delete Selected (Del)"><Trash2 size={18}/></button>}
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="relative group/settings">
                <button title="Playback Speed" className="hover:text-red-500"><Settings size={20} /></button>
                <div className="absolute bottom-full right-0 mb-2 p-1 bg-black/80 rounded shadow-md hidden group-hover/settings:block">
                  {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                    <button key={speed} onClick={() => handlePlaybackSpeedChange(speed)} className={`block w-full text-left px-2 py-1 text-xs hover:bg-red-500 ${playbackSpeed === speed ? 'bg-red-600' : ''}`}>{speed}x</button>
                  ))}
                </div>
              </div>
              <button onClick={toggleFullScreen} title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"} className="hover:text-red-500">{isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 