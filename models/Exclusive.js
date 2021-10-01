const mongoose = require('mongoose');

const exclusiveSchema = mongoose.Schema({
  date: { type: Number, default: Date.now() },
  pageName: String,
  email: String,
  title: String,
  description: String,
});

module.exports = mongoose.model('Exclusive', exclusiveSchema);
