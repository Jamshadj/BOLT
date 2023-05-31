const mongoose = require("mongoose");


const couponSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
    },
   code: {
     type: String,
     unique: true,
     required: true
   },
   discount: {
     type: Number,
     required: true
   },
   expiration_date: {
     type: Date,
     required: true 
   },
   minimum_purchase_amount: {
     type: Number,
     required: true
   },
   maximum_uses: {
     type: Number
   },
    status: {
     type: String,
     default:"available"
   }
 });

const couponModel = new mongoose.model("coupon", couponSchema);
module.exports = couponModel;
