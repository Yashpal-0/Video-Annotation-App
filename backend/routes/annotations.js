const express = require('express');
const router = express.Router();
const Annotation = require('../models/Annotation');

// GET /api/annotations - Retrieve all annotations
router.get('/', async (req, res) => {
  try {
    // Later, you might add ?videoId=xyz to req.query to filter
    const annotations = await Annotation.find().sort({ timestamp: 1 }); // Sort by timestamp
    // Mongoose uses _id, frontend might use id. Let's map _id to id for consistency if needed by frontend.
    res.json(annotations.map(ann => ({ ...ann.toObject(), id: ann._id })));
  } catch (err) {
    console.error("Error fetching annotations:", err);
    res.status(500).json({ message: 'Failed to retrieve annotations', error: err.message });
  }
});

// POST /api/annotations - Create a new annotation
router.post('/', async (req, res) => {
  const annotationData = req.body;
  // Remove frontend 'id' if present, MongoDB will generate _id
  delete annotationData.id; 

  try {
    const newAnnotation = new Annotation(annotationData);
    await newAnnotation.save();
    res.status(201).json({ ...newAnnotation.toObject(), id: newAnnotation._id });
  } catch (err) {
    console.error("Error creating annotation:", err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).json({ message: 'Failed to create annotation', error: err.message });
  }
});

// PUT /api/annotations/:id - Update an existing annotation
router.put('/:mongoId', async (req, res) => {
  const { mongoId } = req.params;
  const updatedData = req.body;
  // Prevent changing the ID via the body
  delete updatedData._id;
  delete updatedData.id; 

  try {
    const updatedAnnotation = await Annotation.findByIdAndUpdate(
      mongoId, 
      updatedData, 
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );
    if (!updatedAnnotation) {
      return res.status(404).json({ message: 'Annotation not found.' });
    }
    res.json({ ...updatedAnnotation.toObject(), id: updatedAnnotation._id });
  } catch (err) {
    console.error(`Error updating annotation ${mongoId}:`, err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).json({ message: 'Failed to update annotation', error: err.message });
  }
});

// DELETE /api/annotations/:id - Delete an annotation
router.delete('/:mongoId', async (req, res) => {
  const { mongoId } = req.params;
  try {
    const deletedAnnotation = await Annotation.findByIdAndDelete(mongoId);
    if (!deletedAnnotation) {
      return res.status(404).json({ message: 'Annotation not found.' });
    }
    res.status(204).send(); // No content
  } catch (err) {
    console.error(`Error deleting annotation ${mongoId}:`, err);
    res.status(500).json({ message: 'Failed to delete annotation', error: err.message });
  }
});

module.exports = router; 