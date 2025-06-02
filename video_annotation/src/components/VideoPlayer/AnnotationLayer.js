import React, { useRef, useState, useEffect } from 'react';
import './AnnotationLayer.css';

const AnnotationLayer = ({
  annotations,
  currentTool,
  isDrawing,
  currentDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onAddText,
  videoWidth,
  videoHeight,
  togglePlayPause,
  selectedAnnotationId,
  onSelectAnnotation,
  onAnnotationMoveStart,
  videoCurrentTime
}) => {
  const svgRef = useRef(null);
  const [textInput, setTextInput] = useState({ active: false, x: 0, y: 0, value: '' });

  const getMousePosition = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: e.clientX, y: e.clientY }; // Fallback if CTM is null
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e) => {
    const point = getMousePosition(e);
    let clickedOnExistingAnnotation = false;

    if (!currentTool) {
      // Check if clicking on an existing annotation to select it OR start moving it
      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (isPointInAnnotation(point, ann)) {
          if (ann.id === selectedAnnotationId) {
            // Clicked on an already selected annotation: Start moving it
            if (onAnnotationMoveStart) onAnnotationMoveStart(ann.id, point);
          } else {
            // Clicked on a different annotation: Select it
            onSelectAnnotation(ann.id);
          }
          clickedOnExistingAnnotation = true;
          return; 
        }
      }
    }

    if (currentTool === 'text') {
      // If already entering text, finalize it first
      if (textInput.active) {
        if (textInput.value.trim() !== '') {
          onAddText(textInput.value, { x: textInput.x, y: textInput.y });
        }
        setTextInput({ active: false, x: 0, y: 0, value: '' });
      } else {
        // Start new text input
        setTextInput({ active: true, x: point.x, y: point.y, value: '' });
      }
    } else if (currentTool) { // This implies a shape drawing tool is active
      onMouseDown(point); // Call the prop to start drawing in VideoPlayer.js
    } else if (!clickedOnExistingAnnotation && !currentTool) {
      // No tool selected, and didn't click on an existing annotation, so toggle play/pause
      if (togglePlayPause) togglePlayPause();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || currentTool === 'text') return;
    const point = getMousePosition(e);
    onMouseMove(point);
  };

  const handleMouseUp = (e) => {
    if (currentTool === 'text') {
      // For text, mouse up doesn't finalize drawing, focus on input or input finalizes.
      // However, if we click away from an active input without typing, it should probably cancel.
      // This logic is handled by onBlur and keydown for the text input itself.
      return;
    }
    if (!isDrawing) return;
    onMouseUp();
  };

  const handleTextInputChange = (e) => {
    setTextInput(prev => ({ ...prev, value: e.target.value }));
  };

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or other default Enter behavior
      if (textInput.value.trim() !== '') {
        onAddText(textInput.value, { x: textInput.x, y: textInput.y });
      }
      setTextInput({ active: false, x: 0, y: 0, value: '' });
    } else if (e.key === 'Escape') {
      setTextInput({ active: false, x: 0, y: 0, value: '' });
    }
  };

  const handleTextInputBlur = () => {
    // Add text if input loses focus and has content
    // Timeout to allow click on tool button to deselect text tool first
    setTimeout(() => {
        if (textInput.active && textInput.value.trim() !== '') {
            onAddText(textInput.value, { x: textInput.x, y: textInput.y });
        }
        // Only reset if it wasn't reset by Enter/Escape or another mousedown
        if (textInput.active) { 
             setTextInput({ active: false, x: 0, y: 0, value: '' });
        }
    }, 100); 
  };
  
  // Focus input when it becomes active
  const textInputRef = useRef(null);
  useEffect(() => {
    if (textInput.active && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput.active]);

  // Layer style needs to match video dimensions
  const layerStyle = {
    width: videoWidth > 0 ? `${videoWidth}px` : '100%',
    height: videoHeight > 0 ? `${videoHeight}px` : '100%',
  };

  // Helper to convert relative values to pixels for rendering
  const getPixelValue = (relativeValue, totalPixels) => {
    if (totalPixels === 0 || relativeValue === undefined) return 0;
    return relativeValue * totalPixels;
  };

  const renderAnnotation = (annotation) => {
    if (!annotation || !svgRef.current) return null;

    // Use actual current SVG dimensions for rendering calculations
    const currentSvgWidth = svgRef.current.clientWidth;
    const currentSvgHeight = svgRef.current.clientHeight;

    const isSelected = annotation.id === selectedAnnotationId;
    const style = {
      stroke: isSelected ? 'deepskyblue' : 'red', // Changed selected color for better visibility
      strokeWidth: isSelected ? 2.5 : 2,
      fill: 'transparent',
      fontSize: 16,
      fontFamily: 'Arial'
    };
    const handleRadius = isSelected ? 4 : 0; // Radius of selection handles
    const handleFill = 'white';
    const handleStroke = 'deepskyblue';

    let renderedAnnotation = null;
    const handles = [];

    switch (annotation.type) {
      case 'circle':
        const cx = getPixelValue(annotation.relativeX, currentSvgWidth);
        const cy = getPixelValue(annotation.relativeY, currentSvgHeight);
        const r = getPixelValue(annotation.relativeRadius, Math.min(currentSvgWidth, currentSvgHeight));

        renderedAnnotation = (
          <circle
            key={annotation.id}
            className={isSelected ? 'selected-annotation' : ''}
            cx={cx}
            cy={cy}
            r={r}
            {...style}
            fill={isSelected ? 'rgba(0,191,255,0.1)' : 'rgba(255,0,0,0.1)'}
          />
        );
        if (isSelected) {
          handles.push(<circle key="h-c" cx={cx} cy={cy} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1" />);
          handles.push(<circle key="h-r" cx={cx + r} cy={cy} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1" />); 
        }
        break;
      case 'rectangle':
        const rectX = getPixelValue(annotation.relativeX, currentSvgWidth);
        const rectY = getPixelValue(annotation.relativeY, currentSvgHeight);
        const rectWidth = getPixelValue(annotation.relativeWidth, currentSvgWidth);
        const rectHeight = getPixelValue(annotation.relativeHeight, currentSvgHeight);

        renderedAnnotation = (
          <rect
            key={annotation.id}
            className={isSelected ? 'selected-annotation' : ''}
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            {...style}
            fill={isSelected ? 'rgba(0,191,255,0.1)' : 'rgba(255,0,0,0.1)'}
          />
        );
        if (isSelected) {
          handles.push(<circle key="h-tl" cx={rectX} cy={rectY} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
          handles.push(<circle key="h-tr" cx={rectX + rectWidth} cy={rectY} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
          handles.push(<circle key="h-bl" cx={rectX} cy={rectY + rectHeight} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
          handles.push(<circle key="h-br" cx={rectX + rectWidth} cy={rectY + rectHeight} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
        }
        break;
      case 'line':
        if (!annotation.relativePoints || annotation.relativePoints.length < 2) return null;
        const p1x = getPixelValue(annotation.relativePoints[0].x, currentSvgWidth);
        const p1y = getPixelValue(annotation.relativePoints[0].y, currentSvgHeight);
        const p2x = getPixelValue(annotation.relativePoints[1].x, currentSvgWidth);
        const p2y = getPixelValue(annotation.relativePoints[1].y, currentSvgHeight);

        renderedAnnotation = (
          <line
            key={annotation.id}
            className={isSelected ? 'selected-annotation' : ''}
            x1={p1x}
            y1={p1y}
            x2={p2x}
            y2={p2y}
            {...style}
          />
        );
        if (isSelected) {
          handles.push(<circle key="h-p1" cx={p1x} cy={p1y} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
          handles.push(<circle key="h-p2" cx={p2x} cy={p2y} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
        }
        break;
      case 'text':
        const textX = getPixelValue(annotation.relativeX, currentSvgWidth);
        const textY = getPixelValue(annotation.relativeY, currentSvgHeight);
        renderedAnnotation = (
          <text
            key={annotation.id}
            className={isSelected ? 'selected-annotation' : ''}
            x={textX}
            y={textY}
            fill={style.stroke}
            fontSize={style.fontSize}
            fontFamily={style.fontFamily}
            dominantBaseline="hanging"
          >
            {annotation.text}
          </text>
        );
        if (isSelected) {
          // For text, show a bounding box with handles (approximate)
          const DEFAULT_FONT_SIZE_FOR_HIT_TEST = style.fontSize; // This is pixel font size for rendering
          // For handles on text, we need to estimate pixel width/height based on current video dimensions for accuracy
          const approxTextPixelWidth = (annotation.text.length * DEFAULT_FONT_SIZE_FOR_HIT_TEST * 0.6);
          const approxTextPixelHeight = (DEFAULT_FONT_SIZE_FOR_HIT_TEST * 1.2);

          handles.push(<rect key="h-text-box" x={textX} y={textY} width={approxTextPixelWidth} height={approxTextPixelHeight} fill="none" stroke={handleStroke} strokeWidth="1" strokeDasharray="2,2" />);
          handles.push(<circle key="h-text-tl" cx={textX} cy={textY} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
          handles.push(<circle key="h-text-br" cx={textX + approxTextPixelWidth} cy={textY + approxTextPixelHeight} r={handleRadius} fill={handleFill} stroke={handleStroke} strokeWidth="1"/>);
        }
        break;
      default:
        return null;
    }
    return <g key={`group-${annotation.id}`}>{renderedAnnotation}{handles}</g>;
  };

  // Helper function to check if a point is inside an annotation (simplified)
  // This needs to be more robust for accurate selection.
  const isPointInAnnotation = (point, annotation) => {
    if (!svgRef.current) return false; // Ensure svgRef is available

    const currentSvgWidth = svgRef.current.clientWidth;
    const currentSvgHeight = svgRef.current.clientHeight;

    const padding = 5; // Click padding in pixels
    const DEFAULT_FONT_SIZE_FOR_HIT_TEST = 16; // Base pixel font size for text hit test

    // For hit testing, convert relative annotation coords to current pixel coords
    const annX = getPixelValue(annotation.relativeX, currentSvgWidth);
    const annY = getPixelValue(annotation.relativeY, currentSvgHeight);

    switch (annotation.type) {
      case 'rectangle':
        const annWidth = getPixelValue(annotation.relativeWidth, currentSvgWidth);
        const annHeight = getPixelValue(annotation.relativeHeight, currentSvgHeight);
        return (
          point.x >= annX - padding &&
          point.x <= annX + annWidth + padding &&
          point.y >= annY - padding &&
          point.y <= annY + annHeight + padding
        );
      case 'circle':
        const annRadius = getPixelValue(annotation.relativeRadius, Math.min(currentSvgWidth, currentSvgHeight));
        const dx = point.x - annX;
        const dy = point.y - annY;
        return Math.sqrt(dx * dx + dy * dy) <= annRadius + padding;
      case 'line':
        if (!annotation.relativePoints || annotation.relativePoints.length < 2) return false;
        const p1x_hit = getPixelValue(annotation.relativePoints[0].x, currentSvgWidth);
        const p1y_hit = getPixelValue(annotation.relativePoints[0].y, currentSvgHeight);
        const p2x_hit = getPixelValue(annotation.relativePoints[1].x, currentSvgWidth);
        const p2y_hit = getPixelValue(annotation.relativePoints[1].y, currentSvgHeight);

        const minX = Math.min(p1x_hit, p2x_hit) - padding;
        const maxX = Math.max(p1x_hit, p2x_hit) + padding;
        const minY = Math.min(p1y_hit, p2y_hit) - padding;
        const maxY = Math.max(p1y_hit, p2y_hit) + padding;
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            const d = Math.abs((p2y_hit - p1y_hit) * point.x -
                               (p2x_hit - p1x_hit) * point.y +
                                p2x_hit * p1y_hit -
                                p2y_hit * p1x_hit) /
                      Math.sqrt(Math.pow(p2y_hit - p1y_hit, 2) +
                                Math.pow(p2x_hit - p1x_hit, 2));
            return d <= 5 + padding;
        }
        return false;
      case 'text':
        const textFontSize = annotation.fontSize || DEFAULT_FONT_SIZE_FOR_HIT_TEST;
        const charWidth = textFontSize * 0.6;
        const textWidth = annotation.text.length * charWidth; // This is pixel width
        const textHeight = textFontSize * 1.2; // This is pixel height
        return (
          point.x >= annX - padding &&
          point.x <= annX + textWidth + padding &&
          point.y >= annY - padding &&
          point.y <= annY + textHeight + padding
        );
      default:
        return false;
    }
  };

  return (
    <div className="annotation-layer-container" style={layerStyle}>
      <svg
        ref={svgRef}
        className="annotation-svg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        // onMouseLeave={handleMouseUp} // Optional: cancel drawing if mouse leaves SVG
        width="100%"
        height="100%"
        // viewBox might be useful if video element scales and SVG doesn't automatically
        // For now, assuming videoWidth and videoHeight props correctly size the SVG via container
      >
        {annotations
          .filter(ann => {
            if (videoCurrentTime === undefined || ann.timestamp === undefined || ann.duration === undefined) {
              return true; // If time data is missing, show (or handle error appropriately)
            }
            const annotationStartTime = ann.timestamp;
            const annotationEndTime = ann.timestamp + ann.duration;
            // Show if current time is within the annotation's active period
            // Or if an annotation is selected, always show it for editing purposes, regardless of time
            return (videoCurrentTime >= annotationStartTime && videoCurrentTime <= annotationEndTime) || ann.id === selectedAnnotationId;
          })
          .map(renderAnnotation)}
        {/* Show current drawing regardless of time, as it's actively being created */}
        {isDrawing && currentDrawing && renderAnnotation(currentDrawing)} 
      </svg>
      {textInput.active && (
        <textarea
          ref={textInputRef}
          className="annotation-text-input"
          style={{
            position: 'absolute',
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            zIndex: 100, // Ensure it's above the SVG
            // Basic styling, can be moved to CSS
            border: '1px solid #ccc',
            background: 'white',
            color: 'black',
            fontSize: '16px',
            padding: '5px',
            resize: 'none',
            minWidth: '100px',
            minHeight: '50px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
          value={textInput.value}
          onChange={handleTextInputChange}
          onKeyDown={handleTextInputKeyDown}
          onBlur={handleTextInputBlur} 
        />
      )}
    </div>
  );
};

export default AnnotationLayer; 