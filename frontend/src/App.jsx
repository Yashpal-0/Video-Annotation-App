import React, { useState, useEffect, useCallback, useRef } from 'react';
import VideoPlayer from './components/VideoPlayer';
import AnnotationList from './components/AnnotationList';
import AnnotationProperties from './components/AnnotationProperties';
// import sampleVideo from './assets/sample.mp4';

const API_BASE_URL = 'http://localhost:5001/api'; // Your backend API URL
const LOCAL_STORAGE_KEY = 'video-annotations';

const App = () => {
  const sampleVideoUrl =
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const [annotations, _setAnnotations] = useState([]);
  const [annotationHistory, setAnnotationHistory] = useState([[]]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // Effect to load initial annotations: API first, then localStorage fallback
  useEffect(() => {
    const loadAnnotations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/annotations`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        _setAnnotations(data);
        setAnnotationHistory([data]); // Initialize history with API data
        setCurrentHistoryIndex(0);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (apiError) {
        console.error("Failed to fetch annotations from API:", apiError);
        setError('Failed to load annotations from server. Attempting to load from local storage.');
        // Fallback to localStorage
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        try {
          const localAnnotations = saved ? JSON.parse(saved) : [];
          _setAnnotations(localAnnotations);
          setAnnotationHistory([localAnnotations]);
          setCurrentHistoryIndex(0);
        } catch (localError) {
          console.error("Failed to load annotations from localStorage:", localError);
          _setAnnotations([]);
          setAnnotationHistory([[]]);
          setCurrentHistoryIndex(0);
          setError('Failed to load annotations from server and local storage.');
        }
      }
      setIsLoading(false);
    };
    loadAnnotations();
  }, []);

  // Syncs annotation state to history and localStorage (when history changes)
  const setAnnotationsAndHistory = useCallback((newAnnotationsOrCallback, fromApiSync = false) => {
    _setAnnotations(prevAnnotations => {
      let newAnnotations;
      if (typeof newAnnotationsOrCallback === 'function') {
        newAnnotations = newAnnotationsOrCallback(prevAnnotations);
      } else {
        newAnnotations = newAnnotationsOrCallback;
      }

      if (!fromApiSync && JSON.stringify(newAnnotations) !== JSON.stringify(prevAnnotations)) {
        const newHistory = annotationHistory.slice(0, currentHistoryIndex + 1);
        setAnnotationHistory([...newHistory, newAnnotations]);
        setCurrentHistoryIndex(newHistory.length);
      }
      // Always update localStorage with the latest set of annotations
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newAnnotations));
      return newAnnotations;
    });
  }, [annotationHistory, currentHistoryIndex]);

  // Effect to update the live annotations state when history index changes (for undo/redo)
  useEffect(() => {
    const currentAnnotationsFromHistory = annotationHistory[currentHistoryIndex] || [];
    if (JSON.stringify(currentAnnotationsFromHistory) !== JSON.stringify(annotations)) {
      _setAnnotations(currentAnnotationsFromHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentAnnotationsFromHistory));
    }
  }, [currentHistoryIndex, annotationHistory, annotations]);

  const handleCreateAnnotation = async (annotationData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData),
      });
      if (!response.ok) throw new Error('Failed to create annotation on server');
      const createdAnnotation = await response.json();
      // Add to local state/history (API is source of truth for _id from DB if used)
      setAnnotationsAndHistory(prev => [...prev, createdAnnotation]);
      setError(null);
    } catch (err) {
      console.error("Error creating annotation:", err);
      setError('Failed to save annotation to server. Changes might be local only.');
      // Optimistic update: still add to local state for UX, but mark as unsynced if needed
      setAnnotationsAndHistory(prev => [...prev, annotationData]); 
    }
    setIsLoading(false);
  };

  const handleUpdateAnnotation = async (updatedAnnotation) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/annotations/${updatedAnnotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAnnotation),
      });
      if (!response.ok) throw new Error('Failed to update annotation on server');
      const returnedAnnotation = await response.json();
      setAnnotationsAndHistory(prev => prev.map(ann => ann.id === returnedAnnotation.id ? returnedAnnotation : ann));
      if (selectedAnnotation && selectedAnnotation.id === returnedAnnotation.id) {
        setSelectedAnnotation(returnedAnnotation);
      }
      setError(null);
    } catch (err) {
      console.error("Error updating annotation:", err);
      setError('Failed to update annotation on server. Changes might be local only.');
      // Optimistic update
      setAnnotationsAndHistory(prev => prev.map(ann => ann.id === updatedAnnotation.id ? updatedAnnotation : ann));
       if (selectedAnnotation && selectedAnnotation.id === updatedAnnotation.id) {
        setSelectedAnnotation(updatedAnnotation);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteAnnotation = async (idToDelete) => {
    setIsLoading(true);
    const originalAnnotations = [...annotations]; // For potential rollback
    // Optimistic UI update
    setAnnotationsAndHistory(prev => prev.filter(ann => ann.id !== idToDelete));
    if (selectedAnnotation && selectedAnnotation.id === idToDelete) {
      setSelectedAnnotation(null);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/annotations/${idToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete annotation on server');
      // If successful, local state is already updated optimistically
      setError(null);
    } catch (err) {
      console.error("Error deleting annotation:", err);
      setError('Failed to delete annotation on server. Reverting local changes.');
      // Rollback optimistic update
      setAnnotationsAndHistory(originalAnnotations, true); // fromApiSync = true to prevent new history entry
    }
    setIsLoading(false);
  };

  const handleSelectAnnotationFromList = (annotation) => {
    setSelectedAnnotation(annotation);
    if (videoRef.current && videoRef.current.videoEl) { // Ensure videoRef.current.videoEl exists
      videoRef.current.videoEl.currentTime = annotation.timestamp;
    }
  };
  
  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < annotationHistory.length - 1) {
      setCurrentHistoryIndex(prevIndex => prevIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-white">
      <header className="p-4 bg-gray-800 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Annotation Tool</h1>
        {isLoading && <div className="text-sm text-yellow-400">Loading...</div>}
        {error && <div className="text-sm text-red-500">Error: {error}</div>}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-y-auto">
          <VideoPlayer
            src={sampleVideoUrl}
            annotations={annotations} 
            // setAnnotations pass onCreateAnnotation instead for clarity
            onCreateAnnotation={handleCreateAnnotation} // New prop for creating
            onUpdateAnnotation={handleUpdateAnnotation} // New prop for updating from VideoPlayer (e.g., dragging)
            selectedAnnotation={selectedAnnotation}
            setSelectedAnnotation={setSelectedAnnotation}
            onTimeUpdate={setVideoCurrentTime} 
            videoRefPassed={videoRef} // Pass the ref to VideoPlayer
            onUndo={handleUndo}
            onRedo={handleRedo}
            currentHistoryIndex={currentHistoryIndex}
            annotationHistoryLength={annotationHistory.length}
            deleteAnnotationHandler={handleDeleteAnnotation} // Pass delete handler
          />
        </main>
        <aside className="w-72 bg-gray-800 p-0 border-l border-gray-700 flex flex-col">
          <AnnotationList
            annotations={annotations} 
            onSelectAnnotation={handleSelectAnnotationFromList}
            // onDeleteAnnotation={handleDeleteAnnotation} // Deletion can be from properties panel or key press
            videoRefPassed={videoRef} // Pass the ref to AnnotationList
            selectedAnnotationId={selectedAnnotation?.id}
            currentTime={videoCurrentTime}
          />
        </aside>
        <aside className="w-64 bg-gray-800 p-0 border-l border-gray-700 flex flex-col">
            <AnnotationProperties 
                selectedAnnotation={selectedAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
            />
        </aside>
      </div>
    </div>
  );
};

export default App;
