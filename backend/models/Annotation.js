const mongoose = require('mongoose');

const AnnotationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['circle', 'rectangle', 'line', 'text'],
    required: true
  },
  x: { type: Number, required: true },       // normalized [0,1]
  y: { type: Number, required: true },       // normalized [0,1]
  w: { type: Number, required: true },       // normalized width
  h: { type: Number, required: true },       // normalized height
  timestamp: { type: Number, required: true }, // in seconds
  duration: { type: Number, default: 2.5 },
  color: { type: String, default: '#FF5722' },
  text: { type: String, default: '' },
  video: { type: String, default: 'default' } // each annotation belongs to a video
});

module.exports = mongoose.model('Annotation', AnnotationSchema); 