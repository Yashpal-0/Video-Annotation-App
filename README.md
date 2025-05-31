# Video Annotation Tool

A web-based video annotation tool that allows users to watch videos and add timestamped annotations (circles, rectangles, lines, text) at specific moments. Annotations persist between sessions and are stored in a MongoDB backend.

---

## Table of Contents

1. [Project Structure](#project-structure)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [Setup Instructions](#setup-instructions)  
   - [Backend](#backend)  
   - [Frontend](#frontend)  
5. [API Documentation](#api-documentation)  
6. [Screenshots](#screenshots)  
7. [Design Decisions & Assumptions](#design-decisions--assumptions)  
8. [Bonus / Optional Enhancements](#bonus--optional-enhancements)  

---

## Project Structure

```
video-annotation-tool/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   ├── models/
│   │   └── Annotation.js
│   └── routes/
│       └── annotations.js
│   └── README.md
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   └── AnnotationContext.jsx
│   │   ├── api.js
│   │   ├── components/
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── AnnotationCanvas.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── PropertiesPanel.jsx
│   │   └── assets/
│   │       └── sample.mp4
│   └── public/
│       └── index.html
│
└── README.md
```

---

## Features

### Core Functionality

1. **Custom Video Player**  
   - Play/Pause button  
   - Progress bar with seek  
   - Current time / total duration display  
   - Fullscreen toggle  
   - Frame-by-frame navigation (◀️ / ▶️)  
   - Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)  
   - Keyboard shortcuts (spacebar for play/pause, arrow keys for seeking, C/R/L/T/Esc for tools)

2. **Advanced Annotation System**  
   - **Drawing Tools**: Circle, Rectangle, Line, Text  
   - **Selection**: Click to select existing annotations (highlights with dashed border)  
   - **Movement**: Drag to reposition (future enhancement)  
   - **Deletion**: Delete selected annotation via Delete button  
   - **Undo/Redo**: Full undo/redo stack for annotation actions  
   - **Timeline Integration**: Markers on progress bar (future enhancement)  
   - **Timestamp Visibility**: Annotations appear only during their 2.5s window  
   - **Duration Control**: Default duration is 2.5s; editable via PropertiesPanel

3. **Annotation Management UI**  
   - **Toolbar**: Select tool (select, circle, rectangle, line, text), Undo, Redo, Delete  
   - **Sidebar**: List of all annotations with timestamp & type; click to seek video  
   - **Properties Panel** *(optional)*: Edit selected annotation's properties (timestamp, duration, text)

4. **Data Persistence**  
   - **LocalStorage**: Caches annotations for offline / refresh persistence  
   - **Backend (MongoDB)**: CRUD via REST API; ensures permanent storage  

---

## Tech Stack

- **Frontend**  
  - React (v18) + Vite  
  - Context API for state management  
  - Canvas API for drawing  
  - Axios for HTTP requests  
  - Plain CSS for styling (as per the initial file structure; can be extended with CSS Modules or other solutions)

- **Backend**  
  - Node.js + Express  
  - MongoDB (Mongoose) for data persistence  
  - CORS + dotenv  

---

## Setup Instructions

### Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the `backend` directory with the following:

   ```
   PORT=5000
   MONGO_URI=<your-mongodb-connection-string>
   ```
   Replace `<your-mongodb-connection-string>` with your actual MongoDB connection string (e.g., from MongoDB Atlas or a local instance like `mongodb://localhost:27017/video_annotations`).

4. **Start the server**
   For development (with auto-restart using nodemon):
   ```bash
   npm run dev
   ```
   For production:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000/` by default.


### Frontend

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend 
   # (or just `cd frontend` if you are in the root project directory)
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables (Optional for Frontend)**
   If your backend is running on a different URL than `http://localhost:5000`, create a `frontend/.env` file:
   ```
   VITE_API_BASE=<your_backend_api_url>
   ```
   Example: `VITE_API_BASE=http://your-backend-domain.com/api`
   If this file is not present, it defaults to `http://localhost:5000/api`.

4. **Run in development**
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:3000/` by default.

5. **Build for production**
   ```bash
   npm run build
   ```
   This creates a `dist` folder in `frontend`. Deploy the contents of `frontend/dist` to any static host (Netlify, Vercel, GitHub Pages, etc.).

--- 

## API Documentation

(Refer to `backend/README.md` for detailed API endpoint documentation.)

--- 

## Screenshots

*(Placeholder: Add screenshots of the application in action after development)*

1. **Main Video Player with Canvas Overlay**
   `./screenshots/video-player.png` (to be added)

2. **Drawing a Rectangle Annotation**
   `./screenshots/drawing-rectangle.png` (to be added)

3. **Annotation List in Sidebar**
   `./screenshots/sidebar-list.png` (to be added)

4. **Properties Panel Editing (Optional Feature)**
   `./screenshots/properties-panel.png` (to be added)

--- 

## Design Decisions & Assumptions

* **Canvas Overlay**: An absolutely positioned `<canvas>` is used over the `<video>` element for drawing. This allows annotations to scale with video size and provides a direct mapping for coordinates.
* **Normalized Coordinates**: Annotation coordinates (`x`, `y`, `w`, `h`) are stored as fractions (0–1) relative to the video dimensions. This ensures responsiveness across different video sizes and resolutions.
* **Timestamp Visibility**: Annotations are displayed only when the video's `currentTime` is within their defined `[timestamp, timestamp + duration]` window. Default duration is 2.5 seconds.
* **Data Flow**: 
    * Annotations are primarily managed via React Context (`AnnotationContext`).
    * Changes (add, update, delete) are dispatched to the context, which updates its state and also triggers API calls to the backend.
    * LocalStorage is used for immediate persistence and to maintain state across page refreshes before backend synchronization.
    * On initial load, annotations are fetched from the backend.
* **Undo/Redo**: Implemented within the `AnnotationContext` by maintaining `history` (previous states) and `future` (undone states) stacks. 
* **Selection & Deletion**: Implemented via a `hitTest` function on the canvas. Selected annotations are visually highlighted. Deletion is handled through the toolbar, acting on the currently selected annotation (if any) or the last action for general deletion/undo.
* **Frame-by-Frame Navigation**: Assumes a standard 25 FPS for frame calculation (1 frame = 1/25th of a second). Video is paused during frame navigation.
* **Video Source**: A sample video (`sample.mp4`) is expected in `frontend/src/assets/`. This should be replaced with an actual video file for testing.

---

## Bonus / Optional Enhancements (Future Work)

* **Annotation Markers on Progress Bar**: Visual cues on the video progress bar indicating where annotations exist.
* **Advanced Editing**: Implementing drag handles on selected annotations for resizing and more intuitive movement.
* **Export/Import Annotations**: Allow users to download annotations as JSON/CSV and import them.
* **Enhanced Styling & UX**: Further refinement of the UI/UX, including loading states, error handling, and visual feedback.
* **Testing**: Comprehensive unit and integration tests for both frontend and backend components.
* **Performance Optimization**: For canvas drawing, especially with many annotations, consider throttling redraws or using more optimized rendering techniques.
* **User Authentication**: If multiple users are expected, implement an authentication system to associate annotations with users. 