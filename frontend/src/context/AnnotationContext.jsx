import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AnnotationContext = createContext();

const initialState = {
  annotations: [],      // all annotations
  history: [],          // stack for undo
  future: []            // stack for redo
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.payload };

    case 'ADD_ANNOTATION': {
      const newAnno = action.payload;
      const updated = [...state.annotations, newAnno];
      return {
        annotations: updated,
        history: [...state.history, state.annotations],
        future: []
      };
    }

    case 'UPDATE_ANNOTATION': {
      const updatedList = state.annotations.map((a) =>
        a._id === action.payload._id ? action.payload : a
      );
      return {
        annotations: updatedList,
        history: [...state.history, state.annotations],
        future: []
      };
    }

    case 'DELETE_ANNOTATION': {
      const filtered = state.annotations.filter((a) => a._id !== action.payload);
      return {
        annotations: filtered,
        history: [...state.history, state.annotations],
        future: []
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      return {
        annotations: prev,
        history: newHistory,
        future: [state.annotations, ...state.future]
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        annotations: next,
        history: [...state.history, state.annotations],
        future: newFuture
      };
    }

    default:
      return state;
  }
}

export function AnnotationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('annotations', JSON.stringify(state.annotations));
  }, [state.annotations]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('annotations');
    if (stored) {
      dispatch({ type: 'SET_ANNOTATIONS', payload: JSON.parse(stored) });
    }
  }, []);

  return (
    <AnnotationContext.Provider value={{ state, dispatch }}>
      {children}
    </AnnotationContext.Provider>
  );
}

export function useAnnotations() {
  return useContext(AnnotationContext);
} 