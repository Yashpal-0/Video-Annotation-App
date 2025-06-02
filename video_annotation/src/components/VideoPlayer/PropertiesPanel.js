import React, { useState, useEffect } from 'react';
import './PropertiesPanel.css';

const PropertiesPanel = ({ selectedAnnotation, onUpdateAnnotation, videoTotalDuration }) => {
  const [editableText, setEditableText] = useState('');
  const [editableTimestamp, setEditableTimestamp] = useState(0);
  const [editableDuration, setEditableDuration] = useState(0);

  useEffect(() => {
    if (selectedAnnotation) {
      setEditableText(selectedAnnotation.type === 'text' ? selectedAnnotation.text : '');
      setEditableTimestamp(selectedAnnotation.timestamp || 0);
      setEditableDuration(selectedAnnotation.duration || 0);
    } else {
      setEditableText('');
      setEditableTimestamp(0);
      setEditableDuration(0);
    }
  }, [selectedAnnotation]);

  if (!selectedAnnotation) {
    return <div className="properties-panel">Select an annotation to see properties.</div>;
  }

  const handleTextChange = (e) => {
    setEditableText(e.target.value);
    onUpdateAnnotation({ ...selectedAnnotation, text: e.target.value });
  };

  const handleTimestampChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= videoTotalDuration) {
        setEditableTimestamp(newTime);
        onUpdateAnnotation({ ...selectedAnnotation, timestamp: newTime });
    }
  };

 const handleDurationChange = (e) => {
    const newDuration = parseFloat(e.target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
        setEditableDuration(newDuration);
        onUpdateAnnotation({ ...selectedAnnotation, duration: newDuration });
    }
 };

  return (
    <div className="properties-panel">
      <h4>Annotation Properties</h4>
      <p><strong>ID:</strong> {selectedAnnotation.id}</p>
      <p><strong>Type:</strong> {selectedAnnotation.type}</p>
      
      <label htmlFor="ann-timestamp">Timestamp (s):</label>
      <input 
        type="number" 
        id="ann-timestamp"
        value={editableTimestamp.toFixed(2)}
        onChange={handleTimestampChange}
        step="0.1"
        min="0"
        max={videoTotalDuration ? videoTotalDuration.toFixed(2) : undefined}
      />

      <label htmlFor="ann-duration">Duration (s):</label>
      <input 
        type="number" 
        id="ann-duration"
        value={editableDuration.toFixed(2)}
        onChange={handleDurationChange}
        step="0.1"
        min="0.1"
      />

      {selectedAnnotation.type === 'text' && (
        <>
          <label htmlFor="ann-text">Text:</label>
          <textarea 
            id="ann-text"
            value={editableText}
            onChange={handleTextChange}
            rows="3"
          />
        </>
      )}
      {/* Add more properties like color picker later */}
    </div>
  );
};

export default PropertiesPanel; 