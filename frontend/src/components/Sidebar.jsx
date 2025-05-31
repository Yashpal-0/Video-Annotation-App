import React from 'react';
import { useAnnotations } from '../context/AnnotationContext';

import './Sidebar.css';

export default function Sidebar() {
  const { state } = useAnnotations();

  const sorted = [...state.annotations].sort((a, b) => a.timestamp - b.timestamp);

  const seekVideo = (ts) => {
    const video = document.querySelector('video');
    if (video) video.currentTime = ts;
  };

  return (
    <div className="sidebar-container">
      <h2>Annotations</h2>
      <ul>
        {sorted.map((a) => (
          <li key={a._id} onClick={() => seekVideo(a.timestamp)}>
            <span>{formatTime(a.timestamp)}</span> &ndash; {a.type.toUpperCase()}
            {a.text && `: "${a.text}"`}
          </li>
        ))}
      </ul>
    </div>
  );

  function formatTime(time) {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }
} 