const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const assignmentSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: [val => val.length === 4, 'Exactly 4 options required'],
    required: true
  },
  correctAnswer: { type: String, required: true },
  userAnswer: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: 3600 }
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  url: { type: String }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  userId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },

  about1: { type: String, maxlength: 250, default: '' },
  about2: { type: String, maxlength: 250, default: '' },
  about3: { type: String, maxlength: 250, default: '' },
  about4: { type: String, maxlength: 250, default: '' },
  about5: { type: String, maxlength: 250, default: '' },
  about6: { type: String, maxlength: 250, default: '' },
  about7: { type: String, maxlength: 250, default: '' },
  about8: { type: String, maxlength: 250, default: '' },
  about9: { type: String, maxlength: 250, default: '' },
  about10: { type: String, maxlength: 250, default: '' },

  playlists: {
    type: [playlistSchema],
    validate: [val => val.length <= 5, 'Max 5 playlists allowed'],
    default: []
  },

  chatHistory: {
    type: [chatSchema],
    default: []
  },

  assignments: {
    type: [assignmentSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
