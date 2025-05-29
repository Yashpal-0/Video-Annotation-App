import React from 'react';
import { Circle, Rectangle, Spline, Type, Eye, EyeOff } from 'lucide-react';

const AnnotationList = ({ annotations, onSelectAnnotation, onDeleteAnnotation, onToggleVisibility, videoRef, selectedAnnotationId, currentTime }) => {

  const getIconForType = (type) => {
    switch (type) {
      case 'circle': return <Circle size={16} className="mr-2 text-gray-400" />;
      case 'rectangle': return <Rectangle size={16} className="mr-2 text-gray-400" />;
      case 'line': return <Spline size={16} className="mr-2 text-gray-400" />;
      case 'text': return <Type size={16} className="mr-2 text-gray-400" />;
      default: return null;
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="p-4 bg-gray-800 text-white w-72 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Annotations</h3>
      {sortedAnnotations.length === 0 && (
        <p className="text-sm text-gray-400">No annotations yet. Pause the video and use the drawing tools to add some!</p>
      )}
      <ul className="space-y-2">
        {sortedAnnotations.map((ann) => {
          const annDuration = ann.duration || 3; // Default duration of 3s
          let actualDisplayEnd = ann.timestamp + annDuration;
          // Consider next annotation for display end
          const currentIndex = sortedAnnotations.findIndex(a => a.id === ann.id);
          const nextAnnotation = sortedAnnotations[currentIndex + 1];
          if (nextAnnotation && nextAnnotation.timestamp < actualDisplayEnd) {
            actualDisplayEnd = nextAnnotation.timestamp;
          }
          const isActive = currentTime >= ann.timestamp && currentTime < actualDisplayEnd;
          const isSelected = selectedAnnotationId === ann.id;

          return (
            <li
              key={ann.id}
              onClick={() => onSelectAnnotation(ann)}
              className={`p-2.5 rounded-md cursor-pointer transition-all duration-150 ease-in-out 
                          ${isSelected ? 'bg-red-600 shadow-lg ring-2 ring-red-400' : 'bg-gray-700 hover:bg-gray-600'}
                          ${isActive && !isSelected ? 'ring-1 ring-yellow-400' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center truncate">
                  {getIconForType(ann.type)}
                  <span className="text-sm font-medium truncate" title={ann.type === 'text' ? ann.text : ann.type}>
                    {ann.type === 'text' ? (ann.text.substring(0,20) + (ann.text.length > 20 ? '...':'')) : (ann.type.charAt(0).toUpperCase() + ann.type.slice(1))}
                  </span>
                </div>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(ann.timestamp)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AnnotationList; 