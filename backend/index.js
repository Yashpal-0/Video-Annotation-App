const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5001; // Changed port to 5001 to avoid common conflicts

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'videoAnnotationDB';
const collectionName = 'annotations';
let db;

async function connectDB() {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit process with failure
  }
}

connectDB();

// Basic Route
app.get('/', (req, res) => {
  res.send('Video Annotation Backend API is running!');
});

// --- Annotation API Endpoints ---

// GET /api/annotations - Retrieve all annotations (can be filtered by videoId if provided as query param)
app.get('/api/annotations', async (req, res) => {
  try {
    const { videoId } = req.query; // Optional: filter by videoId if your app supports multiple videos
    const query = videoId ? { videoId: videoId } : {};
    const annotations = await db.collection(collectionName).find(query).toArray();
    res.status(200).json(annotations);
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ message: 'Error fetching annotations', error: error.message });
  }
});

// POST /api/annotations - Create a new annotation
app.post('/api/annotations', async (req, res) => {
  try {
    const newAnnotation = req.body;
    // Basic validation (can be more extensive)
    if (!newAnnotation || typeof newAnnotation !== 'object' || !newAnnotation.id || !newAnnotation.timestamp) {
      return res.status(400).json({ message: 'Invalid annotation data provided' });
    }
    // Add a server-generated timestamp if you prefer, or use client's
    newAnnotation.createdAt = new Date();

    const result = await db.collection(collectionName).insertOne(newAnnotation);
    // mongo < 4 returns insertedId, mongo >=4 returns insertedId in result.ops[0]._id
    // But insertOne in modern drivers returns an object with insertedId property directly
    if (result.insertedId) {
        const createdAnnotation = { ...newAnnotation, _id: result.insertedId }; // Use newAnnotation data + mongo _id
        res.status(201).json(createdAnnotation);
    } else {
        throw new Error('Failed to insert annotation, no ID returned');
    }

  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ message: 'Error creating annotation', error: error.message });
  }
});

// PUT /api/annotations/:id - Update an existing annotation
app.put('/api/annotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!ObjectId.isValid(id)) {
        // If using custom string IDs from frontend, this check needs adjustment or removal
        // For now, assuming frontend ID might not be a mongo ObjectId, so we search by 'id' field
    }

    // Remove _id from updates if present, as it shouldn't be changed
    delete updates._id;
    updates.updatedAt = new Date();

    // Assuming the frontend sends the custom 'id' (e.g., Date.now() based) and not MongoDB's '_id'
    // If you store annotations with frontend 'id' as the primary key in mongo, use that.
    // Otherwise, if you want to use MongoDB's default '_id', the frontend needs to know it after creation.
    // For simplicity, this example assumes we query by the custom 'id' field we added.
    const result = await db.collection(collectionName).updateOne(
      { id: id }, // Query by custom frontend ID
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Annotation not found with given custom ID' });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return res.status(200).json({ message: 'Annotation found but no new data to update or data is the same.'});
    }

    // Fetch the updated document to return it
    const updatedAnnotation = await db.collection(collectionName).findOne({ id: id });
    res.status(200).json(updatedAnnotation);

  } catch (error) {
    console.error('Error updating annotation:', error);
    res.status(500).json({ message: 'Error updating annotation', error: error.message });
  }
});

// DELETE /api/annotations/:id - Delete an annotation
app.delete('/api/annotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Assuming deletion by custom frontend ID
    const result = await db.collection(collectionName).deleteOne({ id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Annotation not found with given custom ID' });
    }

    res.status(200).json({ message: 'Annotation deleted successfully' }); // Or 204 No Content
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ message: 'Error deleting annotation', error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
}); 