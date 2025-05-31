import React from 'react';
import { useAnnotations } from '../context/AnnotationContext';

import './Toolbar.css';

export default function Toolbar({ selectedTool, setSelectedTool }) {
  const { dispatch } = useAnnotations();

  return (
    <div className="toolbar-container">
      <button
        className={selectedTool === 'select' ? 'active' : ''}
        onClick={() => setSelectedTool('select')}
      >
        Select
      </button>
      <button
        className={selectedTool === 'circle' ? 'active' : ''}
        onClick={() => setSelectedTool('circle')}
      >
        Circle
      </button>
      <button
        className={selectedTool === 'rectangle' ? 'active' : ''}
        onClick={() => setSelectedTool('rectangle')}
      >
        Rect
      </button>
      <button
        className={selectedTool === 'line' ? 'active' : ''}
        onClick={() => setSelectedTool('line')}
      >
        Line
      </button>
      <button
        className={selectedTool === 'text' ? 'active' : ''}
        onClick={() => setSelectedTool('text')}
      >
        Text
      </button>
      <button onClick={() => dispatch({ type: 'UNDO' })}>Undo</button>
      <button onClick={() => dispatch({ type: 'REDO' })}>Redo</button>
      <button onClick={() => dispatch({ type: 'DELETE_ANNOTATION', payload: null })}>
        Delete
      </button>
    </div>
  );
} 