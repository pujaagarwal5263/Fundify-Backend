const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
  pageName: String,
  email: String,
  title: String,
  description: String,
  amount: Number,
  audience: [],
});

module.exports = mongoose.model('Project', projectSchema);
