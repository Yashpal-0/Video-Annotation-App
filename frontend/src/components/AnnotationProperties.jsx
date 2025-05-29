import React, { useState, useEffect } from 'react';

const AnnotationProperties = ({ selectedAnnotation, onUpdateAnnotation, onDeleteAnnotation }) => {
  const [color, setColor] = useState('');
  const [textContent, setTextContent] = useState('');
  const [duration, setDuration] = useState(DEFAULT_ANNOTATION_DURATION);

  const DEFAULT_ANNOTATION_DURATION = 3;

  useEffect(() => {
    if (selectedAnnotation) {
      setColor(selectedAnnotation.color || '#ff0000'); // Default to red if no color
      setTextContent(selectedAnnotation.text || '');
      setDuration(selectedAnnotation.duration || DEFAULT_ANNOTATION_DURATION);
    } else {
      // Reset when no annotation is selected
      setColor('');
      setTextContent('');
      setDuration(DEFAULT_ANNOTATION_DURATION);
    }
  }, [selectedAnnotation]);

  const handleColorChange = (e) => {
    setColor(e.target.value);
    if (selectedAnnotation) {
      onUpdateAnnotation({ ...selectedAnnotation, color: e.target.value });
    }
  };

  const handleTextChange = (e) => {
    setTextContent(e.target.value);
    // Debounce or update on blur for better performance if needed
    if (selectedAnnotation && selectedAnnotation.type === 'text') {
      onUpdateAnnotation({ ...selectedAnnotation, text: e.target.value });
    }
  };

   const handleDurationChange = (e) => {
    const newDuration = parseFloat(e.target.value);
    setDuration(newDuration);
    if (selectedAnnotation) {
      onUpdateAnnotation({ ...selectedAnnotation, duration: newDuration });
    }
  };

  if (!selectedAnnotation) {
    return (
      <div className="p-4 bg-gray-800 text-white w-64 h-full">
        <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Properties</h3>
        <p className="text-sm text-gray-400">Select an annotation to see its properties.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white w-64 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Annotation Properties</h3>
      <div className="mb-3">
        <label htmlFor="ann-id" className="block text-sm font-medium text-gray-300 mb-1">ID:</label>
        <input
          type="text"
          id="ann-id"
          readOnly
          value={selectedAnnotation.id.substring(0, 8)} // Show a shortened ID
          className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-400 cursor-not-allowed"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ann-type" className="block text-sm font-medium text-gray-300 mb-1">Type:</label>
        <input
          type="text"
          id="ann-type"
          readOnly
          value={selectedAnnotation.type.charAt(0).toUpperCase() + selectedAnnotation.type.slice(1)}
          className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-400 cursor-not-allowed"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ann-timestamp" className="block text-sm font-medium text-gray-300 mb-1">Timestamp:</label>
        <input
          type="text"
          id="ann-timestamp"
          readOnly
          value={`${selectedAnnotation.timestamp.toFixed(2)}s`}
          className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-400 cursor-not-allowed"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ann-duration" className="block text-sm font-medium text-gray-300 mb-1">Visible Duration (s):</label>
        <input
          type="number"
          id="ann-duration"
          min="1"
          max="10" // Arbitrary max, adjust as needed
          step="0.5"
          value={duration}
          onChange={handleDurationChange}
          className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="ann-color" className="block text-sm font-medium text-gray-300 mb-1">Color:</label>
        <input
          type="color"
          id="ann-color"
          value={color}
          onChange={handleColorChange}
          className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded cursor-pointer"
        />
      </div>

      {selectedAnnotation.type === 'text' && (
        <div className="mb-4">
          <label htmlFor="ann-text" className="block text-sm font-medium text-gray-300 mb-1">Text Content:</label>
          <textarea
            id="ann-text"
            rows="3"
            value={textContent}
            onChange={handleTextChange}
            className="w-full p-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-red-500 focus:border-red-500"
            placeholder="Enter annotation text"
          />
        </div>
      )}

      <button
        onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
        className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
      >
        Delete Annotation
      </button>
    </div>
  );
};

export default AnnotationProperties; 