import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AnnotationProvider } from './context/AnnotationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnnotationProvider>
      <App />
    </AnnotationProvider>
  </React.StrictMode>
); 