const express = require('express');
const router = express.Router();
const Annotation = require('../models/Annotation');

// GET /api/annotations?video=VIDEO_ID
router.get('/', async (req, res) => {
  try {
    const videoId = req.query.video || 'default';
    const annos = await Annotation.find({ video: videoId });
    res.json(annos);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/annotations
router.post('/', async (req, res) => {
  try {
    const { type, x, y, w, h, timestamp, duration, color, text, video } =
      req.body;
    const newAnno = new Annotation({
      type,
      x,
      y,
      w,
      h,
      timestamp,
      duration,
      color,
      text,
      video: video || 'default'
    });
    const saved = await newAnno.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Invalid annotation data' });
  }
});

// PUT /api/annotations/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Annotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Invalid update data' });
  }
});

// DELETE /api/annotations/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Annotation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 