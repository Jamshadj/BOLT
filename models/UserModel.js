const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneno: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cart: {
    type: Array,
    default: [],
  },   
  wishlist: {
    type: Array,
    default: [],
  },
  address: {
    type: Array,
    default: [],
  },
  wallet:{
    type:Number,
    default:0
  },
  block: {
    type: Boolean,
    required: true,
  },
});

const UserDetails = new mongoose.model("UserDetails", userschema);
module.exports = UserDetails;
