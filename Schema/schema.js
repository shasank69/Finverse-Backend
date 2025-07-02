const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: uuidv4, 
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  confirmPassword: {
    type: String,
    required: true
  },
  about1: { type: String, maxlength: 250, default: '' },
  about2: { type: String, maxlength: 250, default: '' },
  about3: { type: String, maxlength: 250, default: '' },
  about4: { type: String, maxlength: 250, default: '' },
  about5: { type: String, maxlength: 250, default: '' },
  about6: { type: String, maxlength: 250, default: '' },
  about7: { type: String, maxlength: 250, default: '' },
  about8: { type: String, maxlength: 250, default: '' },
  about9: { type: String, maxlength: 250, default: '' },
  about10: { type: String, maxlength: 250, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
