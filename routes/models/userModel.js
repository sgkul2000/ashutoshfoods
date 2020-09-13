const mongoose = require("mongoose");
const Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

const UserSchema = new mongoose.Schema({
  username: {
    unique: true,
    trim: true,
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    unique: true,
    trim: true,
    lowercase: true,
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  orders:[{
    type:mongoose.Schema.ObjectId,
    required:false,
    ref: "Order"
  }],
}, {
  timestamps: true,
  collection: "users"
});

module.exports = mongoose.model('User', UserSchema);