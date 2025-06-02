# Video Annotation Tool

A web-based video annotation tool that allows users to watch videos and add timestamped annotations (circles, rectangles, lines, text) at specific moments. Annotations persist between sessions, stored in a MongoDB backend and accessed via a REST API.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Setup Instructions](#setup-instructions)
   - [Backend](#backend-setup)
   - [Frontend](#frontend-setup)
5. [API Documentation](#api-documentation)
6. [Screenshots (Placeholder)](#screenshots-placeholder)
7. [Design Decisions & Assumptions](#design-decisions--assumptions)
8. [Potential Enhancements](#potential-enhancements)

---

## Project Structure

```
video-annotation-tool/  (Root of the repository)
├── backend/                # Node.js, Express, MongoDB backend
│   ├── package.json
│   ├── server.js
│   ├── .env.example        # Example environment file
│   ├── models/
│   │   └── Annotation.js   # Mongoose schema for annotations
│   └── routes/
│       └── annotations.js  # API route handlers
│   └── README.md           # Backend specific documentation
│
├── video_annotation/       # React frontend (Create React App)
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── services/
│   │   │   └── api.js      # API utility functions
│   │   └── components/
│   │       └── VideoPlayer/
│   │           ├── VideoPlayer.js
│   │           ├── AnnotationLayer.js
│   │           ├── Controls.js
│   │           ├── PropertiesPanel.js
│   │           ├── AnnotationList.js
│   │           └── icons.js
│   └── README.md           # Frontend specific documentation
│
└── README.md                 # This file (Overall project overview)
```

---

## Features

### Core Functionality

1.  **Custom Video Player**
    *   Play/Pause button
    *   Progress bar with seek functionality
    *   Current time / total duration display
    *   Fullscreen toggle
    *   Frame-by-frame navigation
    *   Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)
    *   Keyboard shortcuts (Spacebar for play/pause, Arrow keys for seeking)

2.  **Advanced Annotation System**
    *   **Drawing Tools**: Circle, Rectangle, Line, Text
    *   Annotations drawn on an SVG overlay, responsive to video resizing/fullscreen (using relative coordinates).
    *   Video must be paused to create annotations.

3.  **Annotation Interaction**
    *   **Selection**: Click to select existing annotations (visual highlighting and handles).
    *   **Movement**: Drag selected annotations to reposition them.
    *   **Deletion**: Delete selected annotations using Delete/Backspace key.
    *   **Undo/Redo**: Frontend Undo/Redo for annotation actions (based on optimistic updates).

4.  **Timeline Integration**
    *   Annotations have a timestamp and duration, appearing only when relevant during video playback.
    *   Visual markers on the progress bar indicate annotation start times.

5.  **Annotation Management UI**
    *   **Toolbar (within Controls)**: Select drawing tool, Undo, Redo.
    *   **Properties Panel**: View and edit selected annotation's properties (type, timestamp, duration, text content).
    *   **Annotation List**: Sidebar showing all annotations (sorted by timestamp) with type, time, and preview; click to select.

6.  **Data Persistence & Backend**
    *   Video URL is fetched from the backend.
    *   Annotations are persisted in a MongoDB database via a REST API.
    *   Full CRUD (Create, Retrieve, Update, Delete) operations for annotations are handled through the backend.

---

## Tech Stack

-   **Frontend**
    -   React (v18+, Create React App)
    -   JavaScript (ES6+)
    -   SVG for drawing annotations
    -   Fetch API for HTTP requests
    -   CSS3 for styling

-   **Backend**
    -   Node.js
    -   Express.js
    -   MongoDB (with Mongoose ODM)
    -   CORS, dotenv

---

## Setup Instructions

### Backend Setup

(Refer to `backend/README.md` for detailed backend setup instructions.)

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Set up your `.env` file with `PORT` and `MONGO_URI`.
4.  Ensure MongoDB is running.
5.  Start the server: `npm run dev` (for development) or `npm start` (for production).
    The backend typically runs on `http://localhost:5000`.

### Frontend Setup

(Refer to `video_annotation/README.md` for detailed frontend setup instructions.)

1.  Navigate to the `video_annotation` directory (the frontend root).
2.  Install dependencies: `npm install`
3.  **Environment Variables (Optional for Frontend)**:
    If your backend API is not running on `http://localhost:5000/api`, create a `.env` file in the `video_annotation` root directory:
    ```env
    REACT_APP_API_BASE_URL=http://your-backend-api-url
    ```
    Replace `http://your-backend-api-url` accordingly (e.g., `http://localhost:5001/api` if you changed the backend port).
4.  Ensure the backend server is running.
5.  Start the frontend development server:
    ```bash
    npm start
    ```
    The application will open in your browser, typically at `http://localhost:3000`.

---

## API Documentation

Detailed API endpoint documentation can be found in `backend/README.md`.

Key Endpoints:
*   `GET /api/video/config`: Get video source URL.
*   `GET /api/annotations`: Retrieve all annotations.
*   `POST /api/annotations`: Create a new annotation.
*   `PUT /api/annotations/:id`: Update an existing annotation.
*   `DELETE /api/annotations/:id`: Delete an annotation.

---

## Screenshots (Placeholder)

*(Screenshots demonstrating the application's features will be added here.)*

1.  Main Video Player Interface: `path/to/screenshot1.png`
2.  Annotation Drawing in Action: `path/to/screenshot2.png`
3.  Annotation List and Properties Panel: `path/to/screenshot3.png`

---

## Design Decisions & Assumptions

*   **Annotation Layer**: An SVG overlay is used for drawing annotations directly on the video. This choice allows for easy manipulation of individual shapes as DOM elements.
*   **Relative Coordinates**: Annotation coordinates and dimensions (e.g., `relativeX`, `relativeWidth`) are stored as fractions (0.0 to 1.0) of the video's dimensions. This ensures annotations scale correctly and maintain their position relative to video content during resizing or fullscreen mode changes.
*   **State Management (Frontend)**: Primary application state related to video playback and annotations is managed within the `VideoPlayer.js` component using React hooks (`useState`, `useRef`, `useEffect`, `useCallback`).
*   **Data Flow (Annotations)**:
    *   Annotations are fetched from the backend API on initial load.
    *   User actions (create, update, delete) trigger optimistic updates on the frontend for immediate visual feedback.
    *   These actions then make asynchronous API calls to persist changes to the backend MongoDB database.
    *   Error handling for API calls is included, with potential to revert optimistic updates if backend operations fail.
*   **Undo/Redo**: Implemented as a frontend-only feature operating on a history stack of annotation states. It reflects changes made optimistically or after successful API calls. True backend-synchronized undo/redo is more complex and considered a potential future enhancement.
*   **Timestamped Visibility**: Annotations are displayed on the `AnnotationLayer` only when the video's `currentTime` falls within their defined `[timestamp, timestamp + duration]` window. Selected annotations remain visible for editing.
*   **Video Source**: The video URL is dynamically fetched from a backend endpoint (`/api/video/config`), allowing for flexibility in video content management.
*   **Backend Interaction**: All annotation data is intended to be persisted via the backend API. LocalStorage is no longer used for primary annotation storage.

---

## Potential Enhancements

(List of potential future improvements, largely from the original document.)

*   Advanced annotation editing (e.g., resizing handles for shapes).
*   More sophisticated styling options for annotations (color palettes, stroke styles, opacity controls in UI).
*   Export/Import annotations (e.g., JSON, CSV format).
*   Comprehensive testing (unit, integration, end-to-end).
*   Performance optimizations for a very large number of annotations.
*   User authentication and authorization to associate annotations with users/projects.
*   Collaborative annotation features.
*   Support for different video sources beyond a single hardcoded URL (e.g., dynamic loading based on video ID).
*   More robust error handling and user feedback for API interactions. 