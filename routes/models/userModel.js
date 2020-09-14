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
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  phone: {
    type: Number,
    required: true,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    required: false,
    default: false,
  },
  orders:[{
    type:mongoose.Schema.ObjectId,
    required:false,
    ref: "Order"
  }],
  addresses:[{
    type:mongoose.Schema.ObjectId,
    required:false,
    ref: "Address"
  }],
  resetToken:{
    type: String,
    required: false
  }
}, {
  timestamps: true,
  collection: "users"
});

module.exports = mongoose.model('User', UserSchema);