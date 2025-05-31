import React, { useState, useEffect } from 'react';
import { useAnnotations } from '../context/AnnotationContext';
import { updateAnnotation, deleteAnnotation } from '../api';

export default function PropertiesPanel() {
  const { state, dispatch } = useAnnotations();
  const [selectedId, setSelectedId] = useState(null);
  const [props, setProps] = useState({});

  // When selectedAnnotationId changes in context, load its properties
  useEffect(() => {
    // This requires exposing selectedAnnotationId in context or via an event bus
    // For brevity, omitted—advanced integration left as exercise.
    // For now, let's assume selectedAnnotationId is available globally or passed down.
    // This example won't fully work without wiring up selectedId properly.
    const selectedAnnotation = state.annotations.find(a => a._id === selectedId);
    if (selectedAnnotation) {
        setProps(selectedAnnotation);
    } else {
        setProps({});
    }
  }, [selectedId, state.annotations]);

  const onSave = async () => {
    if (!selectedId) return;
    const updated = await updateAnnotation(selectedId, props);
    dispatch({ type: 'UPDATE_ANNOTATION', payload: updated });
  };

  const onDelete = async () => {
    if (!selectedId) return;
    await deleteAnnotation(selectedId);
    dispatch({ type: 'DELETE_ANNOTATION', payload: selectedId });
    setSelectedId(null); // Clear selection
    setProps({});
  };

  // A way to select an annotation (e.g., from AnnotationCanvas via context or prop)
  // This is a placeholder for actual selection logic integration.
  // For example, if AnnotationCanvas sets a selectedId in context:
  // const { selectedAnnotationIdFromContext } = useAnnotations();
  // useEffect(() => { setSelectedId(selectedAnnotationIdFromContext); }, [selectedAnnotationIdFromContext]);


  if (!selectedId) return <div className="properties-panel-placeholder">Select an annotation to see properties.</div>;
  if (Object.keys(props).length === 0) return <div className="properties-panel-placeholder">Loading properties...</div>; 


  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      <label>
        Timestamp:
        <input
          type="number"
          value={props.timestamp || ''}
          onChange={(e) => setProps({ ...props, timestamp: Number(e.target.value) })}
        />
      </label>
      <label>
        Duration:
        <input
          type="number"
          value={props.duration || ''}
          onChange={(e) => setProps({ ...props, duration: Number(e.target.value) })}
        />
      </label>
      {props.type === 'text' && (
        <label>
          Text:
          <input
            type="text"
            value={props.text || ''}
            onChange={(e) => setProps({ ...props, text: e.target.value })}
          />
        </label>
      )}
       <label>
        Color:
        <input
          type="color"
          value={props.color || '#FF5722'}
          onChange={(e) => setProps({ ...props, color: e.target.value })}
        />
      </label>
      <button onClick={onSave}>Save Changes</button>
      <button onClick={onDelete}>Delete Annotation</button>
    </div>
  );
} 