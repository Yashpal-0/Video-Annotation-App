import React from 'react';
import './AnnotationList.css';

const AnnotationList = ({ annotations, onSelectAnnotation, selectedAnnotationId, videoTotalDuration }) => {
  
  // Helper to format time, can be imported from a shared util if available
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === undefined) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  if (!annotations || annotations.length === 0) {
    return <div className="annotation-list">No annotations yet.</div>;
  }

  return (
    <div className="annotation-list">
      <h4>Annotations</h4>
      <ul>
        {annotations
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)) // Sort by timestamp
        .map(ann => (
          <li 
            key={ann.id} 
            onClick={() => onSelectAnnotation(ann.id)}
            className={ann.id === selectedAnnotationId ? 'selected' : ''}
          >
            <span className="ann-type">{ann.type}</span>
            <span className="ann-time">@{formatTime(ann.timestamp)} ({ann.duration}s)</span>
            {ann.type === 'text' && <span className="ann-preview">: {ann.text.substring(0, 20)}{ann.text.length > 20 ? '...' : ''}</span>}
            {/* Thumbnail placeholder - actual thumbnail generation is complex */}
            {/* <div className="ann-thumbnail"></div> */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnotationList; 