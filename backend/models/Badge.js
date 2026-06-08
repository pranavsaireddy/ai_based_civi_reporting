const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String, // e.g., emoji or image URL
  color: String
});
module.exports = mongoose.model('Badge', BadgeSchema);