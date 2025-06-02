export const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <path d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z"></path>
  </svg>
);

export const PauseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <path d="M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z"></path>
  </svg>
);

export const FullscreenEnterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <g>
      <path d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path>
      <path d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path>
      <path d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path>
      <path d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path>
    </g>
  </svg>
);

export const FullscreenExitIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <g>
      <path d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z"></path>
      <path d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z"></path>
      <path d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z"></path>
      <path d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z"></path>
    </g>
  </svg>
);

export const PreviousFrameIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <path d="M 12,12 L 12,24 L 10,24 L 10,12 L 12,12 Z M 24,12 L 14,18 L 24,24 L 24,12 Z"></path>
  </svg>
);

export const NextFrameIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 36 36" fill="currentColor">
    <path d="M 24,12 L 24,24 L 26,24 L 26,12 L 24,12 Z M 12,12 L 22,18 L 12,24 L 12,12 Z"></path>
  </svg>
);

export const UndoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
  </svg>
);

export const RedoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22l2.37.78C5.05 12.31 8.05 10 11.5 10c1.96 0 3.73.72 5.12 1.88L13 15h9V6l-3.6 3.6z"/>
  </svg>
); 