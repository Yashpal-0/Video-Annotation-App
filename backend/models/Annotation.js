const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  // videoId: { type: String, required: true, index: true }, // To associate annotations with specific videos
  // For now, fields will match the frontend's relative coordinate structure
  type: { type: String, required: true, enum: ['circle', 'rectangle', 'line', 'text'] },
  
  // Relative coordinates and dimensions (0.0 to 1.0)
  relativeX: { type: Number },
  relativeY: { type: Number },
  relativeWidth: { type: Number }, // For rectangle
  relativeHeight: { type: Number }, // For rectangle
  relativeRadius: { type: Number }, // For circle
  relativePoints: [{ x: Number, y: Number }], // For line (array of 2 points usually)
  
  text: { type: String }, // For text annotations
  
  timestamp: { type: Number, required: true }, // Video time in seconds
  duration: { type: Number, required: true }, // Annotation visibility duration in seconds
  
  // Optional: Styling properties if you want to save them
  // color: { type: String, default: 'red' },
  // strokeWidth: { type: Number, default: 2 },

  // Mongoose automatically adds _id and __v
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update `updatedAt` field before saving
annotationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// If using findOneAndUpdate, updatedAt won't be updated by pre('save') by default.
// Add a pre-hook for findOneAndUpdate if you use it often for updates.
annotationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Annotation', annotationSchema); 