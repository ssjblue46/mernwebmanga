const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('PDF', pdfSchema);
