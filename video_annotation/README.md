# Video Annotation Tool - Frontend (React)

This project is the frontend for a comprehensive video annotation tool, allowing users to play videos and add various types of annotations directly onto the video frames. It is built with React.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- **Custom Video Player:**
  - Play/Pause functionality.
  - Seekable progress bar.
  - Current time / Total duration display.
  - Fullscreen toggle.
  - Frame-by-frame navigation (previous/next).
  - Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x).
  - Keyboard shortcuts (Space for play/pause, Arrow keys for seek).
- **Advanced Annotation System:**
  - Drawing Tools: Circle, Rectangle, Line, Text.
  - Annotations are drawn directly on an SVG overlay on the video.
  - Annotations use relative coordinates to adapt to video resizing and fullscreen mode.
- **Annotation Interaction:**
  - Selection of annotations.
  - Movement of selected annotations.
  - Deletion of selected annotations (via Delete/Backspace key).
  - Basic frontend Undo/Redo for annotation changes.
- **Timeline Integration:**
  - Annotations have a timestamp and duration, appearing only when relevant during video playback.
  - Visual markers on the progress bar indicate annotation timestamps.
- **Annotation Management UI:**
  - Properties panel to view/edit details of a selected annotation (type, timestamp, duration, text content).
  - Annotation list sidebar displaying all annotations, sorted by time, with type and preview.
  - Video must be paused to create annotations.
- **Backend Integration:**
  - Fetches video URL from the backend.
  - Annotation data (CRUD operations) is managed via a backend REST API.

## Project Structure (Key Components)

- `src/App.js`: Main application component, sets up the overall layout.
- `src/components/VideoPlayer/VideoPlayer.js`: Core component managing video playback, annotation state, UI, and API interactions.
- `src/components/VideoPlayer/AnnotationLayer.js`: Handles drawing and interaction with annotations on an SVG overlay.
- `src/components/VideoPlayer/Controls.js`: UI for video playback controls and annotation tool selection.
- `src/components/VideoPlayer/PropertiesPanel.js`: UI for displaying and editing selected annotation properties.
- `src/components/VideoPlayer/AnnotationList.js`: UI for listing all annotations.
- `src/components/VideoPlayer/icons.js`: SVG icon components.
- `src/services/api.js`: Functions for making API calls to the backend.

## Prerequisites

- Node.js (e.g., v16.x or later)
- npm (usually comes with Node.js)
- A running instance of the backend server (see `../backend/README.md`).

## Available Scripts

In the project directory (`video_annotation`), you can run:

### `npm install`

Installs all the necessary dependencies for the frontend application.

### `npm start`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.
This script assumes the backend server is running (typically on `http://localhost:5000`).

### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Environment Variables

To configure the backend API URL if it's not running on the default `http://localhost:5000/api`, you can create a `.env` file in the `video_annotation` directory with the following content:

`REACT_APP_API_BASE_URL=http://your-backend-api-url`

Replace `http://your-backend-api-url` with the actual base URL of your backend API (e.g., `http://localhost:5001/api` if you changed the backend port).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
