require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const annotationRoutes = require('./routes/annotations');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Routes
app.use('/api/annotations', annotationRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Video Annotation API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 