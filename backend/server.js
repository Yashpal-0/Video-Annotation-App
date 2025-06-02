const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const annotationRoutes = require('./routes/annotations');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
app.use('/api/annotations', annotationRoutes);

// Endpoint to get video configuration (e.g., URL)
app.get('/api/video/config', (req, res) => {
  // In a real app, you might look up video info by ID from a DB
  // For now, sending a static URL. You can also add other video metadata here.
  res.json({
    // videoId: 'defaultVideo', // Example ID if you manage multiple videos
    src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    // You could add title, description, etc.
  });
});

// Health check
app.get('/', (req, res) => {
  res.send('Video Annotation API is running');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 