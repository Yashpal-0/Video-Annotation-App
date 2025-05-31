import React, { useRef, useEffect, useState } from 'react';
import { useAnnotations } from '../context/AnnotationContext';
import {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation
} from '../api';
import './AnnotationCanvas.css';

export default function AnnotationCanvas({ videoRef, currentTime, isPaused, selectedTool }) {
  const canvasRef = useRef(null);
  const { state, dispatch } = useAnnotations();
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('');

  // Resize canvas to match video size
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    function resize() {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      redraw();
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [videoRef, state.annotations, currentTime]);

  // Redraw on every annotation/state change
  useEffect(() => {
    redraw();
  }, [state.annotations, currentTime, selectedAnnotationId]); // Added selectedAnnotationId to dependencies

  // Handle click/drag for drawing and selecting
  const onMouseDown = (e) => {
    if (!isPaused) return; // only draw/select when paused
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // If selecting existing annotation
    if (selectedTool === 'select') {
      const hit = hitTest(x, y);
      if (hit) {
        setSelectedAnnotationId(hit._id);
      } else {
        setSelectedAnnotationId(null);
      }
      return;
    }

    // If text tool: show input box
    if (selectedTool === 'text') {
      setCaretPos({ x, y });
      setShowTextInput(true);
      return;
    }

    // Otherwise, start drawing shape
    if (['circle', 'rectangle', 'line'].includes(selectedTool)) {
      setDrawing(true);
      setStartPos({ x, y });
    }
  };

  const onMouseMove = (e) => {
    if (!isPaused || !drawing) return;
    // For dynamic preview (optional); for simplicity, skip live preview
  };

  const onMouseUp = async (e) => {
    if (!isPaused) return;
    if (drawing) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const endX = (e.clientX - rect.left) / rect.width;
      const endY = (e.clientY - rect.top) / rect.height;

      // Compute bounding box
      let x = Math.min(startPos.x, endX);
      let y = Math.min(startPos.y, endY);
      let w = Math.abs(endX - startPos.x);
      let h = Math.abs(endY - startPos.y);

      // For circle, make bounding box square
      if (selectedTool === 'circle') {
        const size = Math.max(w, h);
        w = size;
        h = size;
      }

      // Create annotation object
      const newAnno = {
        type: selectedTool,
        x: x,
        y: y,
        w: w,
        h: h,
        timestamp: currentTime,
        duration: 2.5,
        color: '#FF5722',
        text: ''
      };

      // Save to backend
      const saved = await createAnnotation(newAnno);
      dispatch({ type: 'ADD_ANNOTATION', payload: saved });
      setDrawing(false);
    }
  };

  const hitTest = (x, y) => {
    // Check each annotation at this timestamp
    return state.annotations
      .filter((a) => {
        return (
          currentTime >= a.timestamp &&
          currentTime <= a.timestamp + a.duration
        );
      })
      .find((a) => {
        // Check if point (x,y) is inside annotation
        if (a.type === 'rectangle' || a.type === 'text') {
          return (
            x >= a.x &&
            x <= a.x + a.w &&
            y >= a.y &&
            y <= a.y + a.h
          );
        } else if (a.type === 'circle') {
          // circle inscribed in bounding box
          const centerX = a.x + a.w / 2;
          const centerY = a.y + a.h / 2;
          const radius = a.w / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          return dx * dx + dy * dy <= radius * radius;
        } else if (a.type === 'line') {
          // treat line as rectangle with small thickness
          const buffer = 0.01;
          const x1 = a.x;
          const y1 = a.y;
          const x2 = a.x + a.w;
          const y2 = a.y + a.h;
          // compute distance from point to line segment
          const t =
            ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) /
            (Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const tClamped = Math.max(0, Math.min(1, t));
          const projX = x1 + tClamped * (x2 - x1);
          const projY = y1 + tClamped * (y2 - y1);
          const dx = x - projX;
          const dy = y - projY;
          return dx * dx + dy * dy <= buffer * buffer;
        }
        return false;
      });
  };

  // Show/hide text input box
  const onTextSubmit = async () => {
    setShowTextInput(false);
    const newAnno = {
      type: 'text',
      x: caretPos.x,
      y: caretPos.y,
      w: 0, // Will be set by text metrics if needed, or use fixed size
      h: 0, // Will be set by text metrics if needed, or use fixed size
      timestamp: currentTime,
      duration: 2.5,
      color: '#2196F3',
      text: textValue
    };
    const saved = await createAnnotation(newAnno);
    dispatch({ type: 'ADD_ANNOTATION', payload: saved });
    setTextValue('');
  };

  // Draw all visible annotations onto the canvas
  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas is available
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    state.annotations.forEach((a) => {
      if (
        currentTime >= a.timestamp &&
        currentTime <= a.timestamp + a.duration
      ) {
        drawAnno(ctx, a, canvas.width, canvas.height);
      }
    });

    // Highlight selected annotation
    if (selectedAnnotationId) {
      const sel = state.annotations.find((a) => a._id === selectedAnnotationId);
      if (sel && currentTime >= sel.timestamp && currentTime <= sel.timestamp + sel.duration) {
        drawSelection(ctx, sel, canvas.width, canvas.height);
      }
    }
  }

  function drawAnno(ctx, a, W, H) {
    const x = a.x * W;
    const y = a.y * H;
    const w = a.w * W;
    const h = a.h * H;
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = 2;

    if (a.type === 'rectangle') {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.stroke();
    } else if (a.type === 'circle') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = w / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (a.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
    } else if (a.type === 'text') {
      const fontSize = Math.max(14, 0.04 * H); // Adjusted font size calculation
      ctx.font = `${fontSize}px Arial`;
       // For text, w and h might need to be calculated based on text content if not fixed
      // For now, we assume x,y is top-left. If w,h are 0, text won't have a clear bounding box for hitTest
      // Adjusting to draw text and give it some default w,h for selection if they are 0
      const textWidth = ctx.measureText(a.text).width;
      const textHeight = fontSize; // Approximate height
      const actualW = a.w === 0 ? textWidth/W : a.w;
      const actualH = a.h === 0 ? textHeight/H : a.h;

      if (a.w === 0 && a.h === 0 && !state.annotations.find(ann => ann._id === a._id && (ann.w !== 0 || ann.h !== 0))) {
        // Only update if w and h are still 0 and no updated version exists in state
        // This is a simplistic way to update; ideally, this happens upon creation or if text changes.
        // Consider moving this logic to where text annotations are created or updated.
        // For now, this redraws with measured sizes but doesn't persist them automatically.
      }

      ctx.fillText(a.text, x, y + textHeight); // Adjust y for typical text rendering
    }
  }

  function drawSelection(ctx, a, W, H) {
    let x = a.x * W;
    let y = a.y * H;
    let w = a.w * W;
    let h = a.h * H;

    if (a.type === 'text') {
        const fontSize = Math.max(14, 0.04 * H);
        ctx.font = `${fontSize}px Arial`;
        const textMetrics = ctx.measureText(a.text);
        w = textMetrics.width; 
        h = fontSize; // Approximate height for text selection box
        // y position is baseline, so adjust selection box y for text
        y = (a.y * H); // y is already top for fillText if adjusted by + textHeight
    }


    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([6]);
    // For text, the y in annotation is typically baseline. Adjust selection box to cover text.
    if(a.type === 'text'){
         ctx.strokeRect(x - 3, y - 3, w + 6, h + 6); 
    } else {
        ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    }
    ctx.restore();
  }

  return (
    <div
      className="annotation-canvas-wrapper"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <canvas className="annotation-canvas" ref={canvasRef} />
      {showTextInput && (
        <div
          className="text-input-box"
          style={{
            left: `${caretPos.x * 100}%`,
            top: `${caretPos.y * 100}%`
          }}
        >
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Enter text..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') onTextSubmit();
            }}
            autoFocus // Automatically focus the input field
          />
          <button onClick={onTextSubmit}>Save</button>
        </div>
      )}
    </div>
  );
} 