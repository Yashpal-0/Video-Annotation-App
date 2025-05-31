# Backend for Video Annotation Tool

This directory contains the Node.js, Express, and MongoDB backend for the Video Annotation Tool.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in this directory with:
    ```
    PORT=5000
    MONGO_URI=<your_mongodb_connection_string>
    ```
    Replace `<your_mongodb_connection_string>` with your actual MongoDB connection URI (e.g., from MongoDB Atlas or a local instance).

3.  **Run the Server:**
    For development with auto-restarting (using nodemon):
    ```bash
    npm run dev
    ```
    For production:
    ```bash
    npm start
    ```
    The server will typically start on `http://localhost:5000`.

## API Endpoints

Base URL: `/api/annotations`

*   **GET `/`**
    *   Description: Fetches all annotations. Can be filtered by video ID.
    *   Query Parameters:
        *   `video` (String, Optional): The ID of the video to fetch annotations for. Defaults to "default".
    *   Response: `200 OK` with an array of annotation objects.
    *   Example: `GET /api/annotations?video=my_video_123`

*   **POST `/`**
    *   Description: Creates a new annotation.
    *   Request Body (JSON):
        ```json
        {
          "type": "circle", // "circle", "rectangle", "line", "text"
          "x": 0.1,         // Normalized coordinate [0,1]
          "y": 0.2,         // Normalized coordinate [0,1]
          "w": 0.05,        // Normalized width
          "h": 0.05,        // Normalized height
          "timestamp": 15.7,  // Time in seconds
          "duration": 2.5,    // Optional, defaults to 2.5s
          "color": "#FF0000", // Optional, defaults to #FF5722
          "text": "Important point", // Optional, for text annotations
          "video": "default"  // Optional, video identifier
        }
        ```
    *   Response: `201 Created` with the newly created annotation object.

*   **PUT `/:id`**
    *   Description: Updates an existing annotation by its `_id`.
    *   URL Parameters:
        *   `id` (String): The MongoDB `_id` of the annotation to update.
    *   Request Body (JSON): Object containing fields to update.
        ```json
        {
          "text": "Updated important point",
          "color": "#00FF00"
        }
        ```
    *   Response: `200 OK` with the updated annotation object. `404 Not Found` if ID doesn't exist.

*   **DELETE `/:id`**
    *   Description: Deletes an annotation by its `_id`.
    *   URL Parameters:
        *   `id` (String): The MongoDB `_id` of the annotation to delete.
    *   Response: `200 OK` with `{ "message": "Deleted successfully" }`. `404 Not Found` if ID doesn't exist.

## Models

### Annotation

*   `type` (String, Enum: ['circle', 'rectangle', 'line', 'text'], Required)
*   `x` (Number, Required) - Normalized X coordinate.
*   `y` (Number, Required) - Normalized Y coordinate.
*   `w` (Number, Required) - Normalized width.
*   `h` (Number, Required) - Normalized height.
*   `timestamp` (Number, Required) - Timestamp in seconds.
*   `duration` (Number, Default: 2.5) - Duration the annotation is visible.
*   `color` (String, Default: '#FF5722') - Color of the annotation.
*   `text` (String, Default: '') - Text content for text annotations.
*   `video` (String, Default: 'default') - Identifier for the video this annotation belongs to. 