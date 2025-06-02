import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';
import Controls from './Controls'; // We will create this component next
import AnnotationLayer from './AnnotationLayer'; // New component for annotations
import PropertiesPanel from './PropertiesPanel'; // New component
import AnnotationList from './AnnotationList';   // New component
import * as api from '../../services/api'; // Import the API service

const VideoPlayer = (/* { src } NO LONGER TAKES SRC PROP */) => {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(''); // State for video source URL
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [currentTool, setCurrentTool] = useState(null); // e.g., 'circle', 'rectangle', 'line', 'text'
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  // State for annotation movement
  const [isMovingAnnotation, setIsMovingAnnotation] = useState(false);
  const [moveOrigin, setMoveOrigin] = useState(null);

  // History for Undo/Redo (will need rethinking with API calls for true backend undo/redo)
  // For now, frontend history will manage local changes optimistically.
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Define constants for video interaction
  const SEEK_TIME = 5; // 5 seconds for arrow key seek
  const FRAME_STEP = 1 / 30; // Assuming 30 FPS for frame step
  const ANNOTATION_DEFAULT_DURATION = 3;

  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Fetch video config and initial annotations on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingVideo(true);
      try {
        const videoConfig = await api.getVideoConfig();
        setVideoSrc(videoConfig.src);
        
        const loadedAnnotations = await api.getAnnotations();
        setAnnotations(loadedAnnotations.map(ann => ({...ann, id: ann._id || ann.id }))); // Ensure frontend uses 'id'
        setHistory([loadedAnnotations.map(ann => ({...ann, id: ann._id || ann.id }))]);
        setHistoryIndex(0);
        console.log("Video config and annotations loaded from API.");
      } catch (error) {
        console.error("Error loading initial data from API:", error);
        // Handle error (e.g., show error message to user)
        setAnnotations([]);
        setHistory([[]]);
        setHistoryIndex(0);
      }
      setIsLoadingVideo(false);
    };
    loadInitialData();
  }, []); // Empty dependency array: runs once on mount

  // Helper to convert pixel point to relative
  const getRelativePoint = (pixelPoint, currentVideoDimensions) => {
    if (!currentVideoDimensions || currentVideoDimensions.width === 0 || currentVideoDimensions.height === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: pixelPoint.x / currentVideoDimensions.width,
      y: pixelPoint.y / currentVideoDimensions.height,
    };
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateProgress = () => {
        setCurrentTime(video.currentTime);
        setProgress((video.currentTime / video.duration) * 100);
        if (video.buffered.length > 0) {
          // Display buffered end of the first range, good enough for most cases
          setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
        }
      };
      const setVideoDuration = () => {
        setDuration(video.duration);
        // Update video dimensions once metadata is loaded
        // Use clientWidth/Height for actual rendered dimensions
        setVideoDimensions({ width: video.clientWidth, height: video.clientHeight });
      };
      const handleVideoResize = () => {
        // Use clientWidth/Height for actual rendered dimensions on resize
        if (video) { // Ensure video ref is still valid
          setVideoDimensions({ width: video.clientWidth, height: video.clientHeight });
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('loadedmetadata', setVideoDuration);
      window.addEventListener('resize', handleVideoResize); // For responsive dimension updates

      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('loadedmetadata', setVideoDuration);
        window.removeEventListener('resize', handleVideoResize);
      };
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(error => {
        console.error("Error attempting to play video:", error);
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleSeek = (e) => {
    const video = videoRef.current;
    const seekTime = (e.target.value / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(e.target.value);
  };

  const toggleFullScreen = () => {
    const videoContainer = videoRef.current.parentElement; // Assuming video is wrapped in a container
    if (!isFullScreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.mozRequestFullScreen) { /* Firefox */
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.msRequestFullscreen) { /* IE/Edge */
        videoContainer.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const stepFrame = useCallback((direction) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      let newTime = videoRef.current.currentTime + (direction * FRAME_STEP);
      newTime = Math.max(0, Math.min(newTime, videoRef.current.duration));
      videoRef.current.currentTime = newTime;
    }
  }, [setIsPlaying]);

  // Moved these function definitions before the keyboard shortcut useEffect that depends on them
  const handleDeleteSelectedAnnotation = () => {
    if (!selectedAnnotationId) return;
    updateAnnotationsAndHistory('DELETE', { id: selectedAnnotationId });
    setSelectedAnnotationId(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAnnotationId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAnnotationId(null);
    }
  };

  // useEffect for keyboard shortcuts
  useEffect(() => {
    // const video = videoRef.current; // Keep this if video specific actions not in handlers are needed
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    // Keyboard shortcuts listener
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
      }
      // if (!videoRef.current) return; // videoRef.current is now checked by handlers themselves or video var above

      const activeElement = document.activeElement;
      const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'BUTTON' || activeElement.tagName === 'TEXTAREA';

      if (isInputFocused && videoRef.current && videoRef.current.parentElement.contains(activeElement)) {
        if (e.code === 'Space' && activeElement.classList.contains('control-button')) {
          togglePlayPause();
        } else if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && activeElement.type === 'range') {
          return; // Let arrow keys work for slider
        }
      } else {
        // Global shortcuts
        switch (e.code) {
          case 'Space':
            togglePlayPause();
            break;
          case 'ArrowLeft':
            if (videoRef.current) videoRef.current.currentTime -= SEEK_TIME;
            break;
          case 'ArrowRight':
            if (videoRef.current) videoRef.current.currentTime += SEEK_TIME;
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedAnnotationId) {
              if (e.code === 'Backspace' && e.target === document.body) e.preventDefault();
              handleDeleteSelectedAnnotation();
            }
            break;
          case 'KeyZ':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              if (e.shiftKey) {
                handleRedo();
              } else {
                handleUndo();
              }
            }
            break;
          case 'KeyY':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleRedo();
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, selectedAnnotationId, handleDeleteSelectedAnnotation, handleUndo, handleRedo]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleToolSelect = (tool) => {
    setCurrentTool(tool);
    setSelectedAnnotationId(null); // Deselect annotation when a tool is selected
    setIsDrawing(false); // Reset drawing state
    setCurrentDrawing(null); // Clear any partial drawing

    if (tool === 'text') {
      // Logic for text tool selection (e.g., prompt for text or set up for click-to-add)
      // For now, just set the tool. The AnnotationLayer will handle the click.
      setIsDrawing(false); // Ensure not in a drawing state from another tool
      setCurrentDrawing(null);
    } else {
      // For shape tools, we might want to clear any partial text input state if implemented that way
    }
  };

  // Handlers for drawing on AnnotationLayer - to be passed down
  const handleAnnotationMouseDown = (point, clickedAnnotationId) => {
    if (currentTool && currentTool !== 'text') {
      if (isPlaying) return;
      setSelectedAnnotationId(null);
      setIsDrawing(true);

      const relativePoint = getRelativePoint(point, videoDimensions);

      const newAnnotation = {
        id: Date.now(),
        type: currentTool,
        // Store initial point as relative for all types
        relativePoints: [relativePoint],
        timestamp: videoRef.current.currentTime,
        duration: ANNOTATION_DEFAULT_DURATION,
        // Store initial relative x,y for shapes that use them directly
        // These will be relative to video dimensions
        relativeX: relativePoint.x,
        relativeY: relativePoint.y,
        relativeWidth: 0,
        relativeHeight: 0,
        relativeRadius: 0 // For circles
      };
      setCurrentDrawing(newAnnotation);
    } 
    // Note: Selection of existing annotations is now primarily handled within AnnotationLayer.js
    // Text tool related mousedown is also handled in AnnotationLayer.js
    // Play/pause on empty space click is handled in AnnotationLayer.js
  };

  const handleAddTextAnnotation = (text, point) => {
    if (currentTool !== 'text' || isPlaying) return;
    const relativePoint = getRelativePoint(point, videoDimensions);
    const newAnnotationData = {
      type: 'text',
      text,
      relativeX: relativePoint.x,
      relativeY: relativePoint.y,
      timestamp: videoRef.current.currentTime,
      duration: ANNOTATION_DEFAULT_DURATION,
    };
    updateAnnotationsAndHistory('CREATE', newAnnotationData);
    // setSelectedAnnotationId will be handled once server responds, or optimistically.
    // For now, deselect tool to prevent immediate re-trigger.
    setCurrentTool(null); 
  };

  // Function to pass to AnnotationLayer to handle selection
  const handleSelectAnnotation = (annotationId) => {
    if (currentTool) { // If a tool is active, selecting an annotation should probably deselect the tool.
      setCurrentTool(null);
    }
    setSelectedAnnotationId(annotationId);
    setIsMovingAnnotation(false); // Ensure movement state is reset if just selecting
  };

  // Centralized function to update annotations and history
  const updateAnnotationsAndHistory = async (action, payload) => {
    let newAnnotationsState = [...annotations]; // Start with current annotations
    let optimisticUpdate = true;
    let serverResponse;

    switch (action) {
      case 'CREATE':
        // Optimistically add to frontend state. Backend will assign final ID.
        // The payload here is the annotation data BEFORE sending to backend.
        const tempId = `temp-${Date.now()}`;
        const optimisticAnnotation = { ...payload, id: tempId }; 
        newAnnotationsState.push(optimisticAnnotation);
        try {
          serverResponse = await api.createAnnotation(payload); 
          // Replace temp annotation with server response (which includes final _id as id)
          newAnnotationsState = newAnnotationsState.map(ann => 
            ann.id === tempId ? { ...serverResponse, id: serverResponse._id || serverResponse.id } : ann
          );
        } catch (error) {
          console.error("API Create Error:", error);
          optimisticUpdate = false; 
          newAnnotationsState = annotations; // Revert optimistic update
          // TODO: Show error to user
        }
        break;
      case 'UPDATE':
        // Optimistically update in frontend state.
        newAnnotationsState = newAnnotationsState.map(ann => 
          ann.id === payload.id ? payload : ann
        );
        try {
          // The payload should already have the correct MongoDB _id as 'id' for the API call
          serverResponse = await api.updateAnnotation(payload.id, payload);
          // Update with server response if needed (though usually same as payload for PUT)
          newAnnotationsState = newAnnotationsState.map(ann => 
            ann.id === serverResponse.id ? { ...serverResponse, id: serverResponse._id || serverResponse.id } : ann
          );
        } catch (error) {
          console.error("API Update Error:", error);
          optimisticUpdate = false;
          newAnnotationsState = annotations; // Revert
        }
        break;
      case 'DELETE':
        newAnnotationsState = newAnnotationsState.filter(ann => ann.id !== payload.id);
        try {
          await api.deleteAnnotation(payload.id);
        } catch (error) {
          console.error("API Delete Error:", error);
          optimisticUpdate = false;
          newAnnotationsState = annotations; // Revert
        }
        break;
      default:
        console.warn("Unknown action for updateAnnotationsAndHistory");
        return;
    }

    if (optimisticUpdate || action === 'CREATE') { // For create, even if API fails, temp change might have happened
      setAnnotations(newAnnotationsState);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotationsState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
        // If API call failed and it wasn't an optimistic add that we want to keep temporarily
        setAnnotations(newAnnotationsState); // This would be the reverted state
        // Optionally, you might not want to add a history entry for a failed non-create operation
    }
  };

  const handleMasterMouseMove = (point) => {
    if (isDrawing && currentDrawing && currentTool !== 'text') {
      const relativeCurrentPoint = getRelativePoint(point, videoDimensions);
      const initialRelativeAnchorPoint = currentDrawing.relativePoints[0];

      setCurrentDrawing(prev => {
        const updatedAnnotation = { ...prev };
        if (prev.type === 'line') {
          updatedAnnotation.relativePoints[1] = relativeCurrentPoint;
        } else if (prev.type === 'rectangle') {
          updatedAnnotation.relativeWidth = Math.abs(relativeCurrentPoint.x - initialRelativeAnchorPoint.x);
          updatedAnnotation.relativeHeight = Math.abs(relativeCurrentPoint.y - initialRelativeAnchorPoint.y);
          updatedAnnotation.relativeX = Math.min(relativeCurrentPoint.x, initialRelativeAnchorPoint.x);
          updatedAnnotation.relativeY = Math.min(relativeCurrentPoint.y, initialRelativeAnchorPoint.y);
        } else if (prev.type === 'circle') {
          const dRx = relativeCurrentPoint.x - initialRelativeAnchorPoint.x;
          const dRy = relativeCurrentPoint.y - initialRelativeAnchorPoint.y;
          updatedAnnotation.relativeRadius = Math.sqrt(dRx * dRx + dRy * dRy);
          updatedAnnotation.relativeX = initialRelativeAnchorPoint.x;
          updatedAnnotation.relativeY = initialRelativeAnchorPoint.y;
        }
        return updatedAnnotation;
      });
    } else if (isMovingAnnotation && selectedAnnotationId && moveOrigin && videoDimensions.width > 0) { 
      // Moving logic: This updates `annotations` state directly for smooth drag.
      // The final state is sent to API on mouse up.
      const dRx = (point.x - moveOrigin.initialMouseX) / videoDimensions.width;
      const dRy = (point.y - moveOrigin.initialMouseY) / videoDimensions.height;
      setAnnotations(prevAnnotations =>
        prevAnnotations.map(ann => {
          if (ann.id === selectedAnnotationId) {
            const movedAnn = { ...ann };
            if (ann.type === 'line') {
              movedAnn.relativePoints = moveOrigin.annotationInitialRelativePoints.map(rp => ({
                x: rp.x + dRx, y: rp.y + dRy
              }));
            } else {
              movedAnn.relativeX = moveOrigin.annotationInitialRelativeX + dRx;
              movedAnn.relativeY = moveOrigin.annotationInitialRelativeY + dRy;
              if (movedAnn.relativePoints && movedAnn.relativePoints[0] && moveOrigin.annotationInitialRelativePoints) {
                movedAnn.relativePoints[0] = {
                    x: moveOrigin.annotationInitialRelativePoints[0].x + dRx,
                    y: moveOrigin.annotationInitialRelativePoints[0].y + dRy
                }
             }
            }
            return movedAnn;
          }
          return ann;
        })
      );
    }
  };

  const handleMasterMouseUp = () => {
    if (isDrawing && currentDrawing && currentTool !== 'text') {
      const finalAnnotationData = {
        ...currentDrawing, // Contains relativeX, relativeY, etc.
        timestamp: videoRef.current.currentTime,
        duration: currentDrawing.duration || ANNOTATION_DEFAULT_DURATION,
      };
      // No type or id needed for payload, backend assigns id, type is in currentDrawing
      updateAnnotationsAndHistory('CREATE', finalAnnotationData);
      setIsDrawing(false);
      setCurrentDrawing(null);
    } else if (isMovingAnnotation) {
      setIsMovingAnnotation(false);
      setMoveOrigin(null);
      // Find the moved annotation to send its complete state for update
      const movedAnnotation = annotations.find(ann => ann.id === selectedAnnotationId);
      if (movedAnnotation) {
        updateAnnotationsAndHistory('UPDATE', movedAnnotation);
      }
    }
  };

  const updateAnnotationProperties = (updatedAnnotation) => { // Renamed from updateAnnotation to avoid clash
    updateAnnotationsAndHistory('UPDATE', updatedAnnotation);
  };

  // handleDeleteSelectedAnnotation, handleUndo, handleRedo were moved up

  // Handlers for annotation movement
  const handleAnnotationMoveStart = (annotationId, initialMousePoint) => {
    if (currentTool || !selectedAnnotationId || selectedAnnotationId !== annotationId) return;

    const annotationToMove = annotations.find(ann => ann.id === annotationId);
    if (!annotationToMove) return;

    setIsMovingAnnotation(true);
    videoRef.current.pause();
    setIsPlaying(false);

    setMoveOrigin({
      initialMouseX: initialMousePoint.x, // Pixel value from AnnotationLayer
      initialMouseY: initialMousePoint.y,
      // Store initial state of annotation in RELATIVE terms for move calculation
      annotationInitialRelativeX: annotationToMove.relativeX,
      annotationInitialRelativeY: annotationToMove.relativeY,
      annotationInitialRelativePoints: annotationToMove.relativePoints ? 
        [...annotationToMove.relativePoints.map(p => ({...p}))] : null
    });
  };

  // Note: handleAnnotationMouseMove is already used for drawing new shapes.
  // We need to ensure it also handles moving existing ones.
  // The distinction will be made by isDrawing vs isMovingAnnotation state.

  if (isLoadingVideo) {
    return <div className="video-annotation-workspace"><p>Loading video and annotations...</p></div>;
  }

  return (
    <div className="video-annotation-workspace"> {/* Main container for player and annotation section */}
      <div className={`video-player-main-area ${isFullScreen ? 'fullscreen-video-area' : ''}`}>
        <div className={`video-player-container ${isFullScreen ? 'fullscreen' : ''} ${!isPlaying ? 'paused' : ''}`}>
          <video
            ref={videoRef}
            src={videoSrc} // Use videoSrc from state
            className="video-player"
            onLoadedMetadata={() => { // Simplified: get dimensions once metadata is loaded
              if (videoRef.current) {
                setVideoDimensions({ width: videoRef.current.clientWidth, height: videoRef.current.clientHeight });
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                if (videoRef.current.buffered.length > 0) {
                  setBuffered((videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / videoRef.current.duration) * 100);
                }
              }
            }}
            onDurationChange={() => videoRef.current && setDuration(videoRef.current.duration)}
            // Removed explicit video.addEventListener in useEffect for these; using props instead for simplicity here
          />
          <AnnotationLayer
            annotations={annotations} // From state, updated by API calls
            currentTool={currentTool}
            isDrawing={isDrawing}
            currentDrawing={currentDrawing} // Used for rendering shape being drawn
            onMouseDown={handleAnnotationMouseDown} 
            onMouseMove={handleMasterMouseMove} 
            onMouseUp={handleMasterMouseUp}     
            onAddText={handleAddTextAnnotation}
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            togglePlayPause={togglePlayPause}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={handleSelectAnnotation}
            onAnnotationMoveStart={handleAnnotationMoveStart}
            videoCurrentTime={currentTime}
          />
          <Controls
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            progress={progress}
            onSeek={handleSeek}
            currentTime={formatTime(currentTime)}
            duration={formatTime(duration)}
            videoTotalDuration={duration}
            annotations={annotations} 
            buffered={buffered}
            onToggleFullScreen={toggleFullScreen}
            isFullScreen={isFullScreen}
            playbackRate={playbackRate}
            onChangePlaybackRate={changePlaybackRate}
            onStepFrame={stepFrame}
            onSelectTool={handleToolSelect}
            currentTool={currentTool}
            onUndo={handleUndo} 
            onRedo={handleRedo} 
            canUndo={historyIndex > 0} 
            canRedo={historyIndex < history.length - 1} 
          />
        </div>
      </div>

      {/* Annotation Section - moved to be a sibling of video-player-main-area for vertical stacking */}
      {!isFullScreen && (
        <div className="video-annotation-bottom-section"> {/* Renamed from sidebar for clarity */}
          <PropertiesPanel
            selectedAnnotation={annotations.find(ann => ann.id === selectedAnnotationId)}
            onUpdateAnnotation={updateAnnotationProperties} // Use renamed handler
            videoTotalDuration={duration}
          />
          <AnnotationList
            annotations={annotations}
            onSelectAnnotation={handleSelectAnnotation}
            selectedAnnotationId={selectedAnnotationId}
            videoTotalDuration={duration}
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 