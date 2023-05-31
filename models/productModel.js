const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productname: {
     type: String, 
     required: true  
    }, 
  category: { 
      type:String,
    }, 
  brand: {
     type: String
    },
  quantity: { 
    type: Number,
     required: true },
  prize: {
     type: Number,
     required: true },
  MRP: { 
    type: Number,
    required: true },
  description: { 
    type: String,
     required: true },
  image: { 
    type: Object, 
    required: true },
  subimage:{
    type:Object,
    required:true
  },
  block:{
    type:Boolean,
    required:true
  },
  reviews: [
    {
      rating: {
        type: Number,
      },
      comment: {
        type: String,
       
      },user: {
        type: ObjectId,
       
      }
    }
  ]
  
});

const ProductModel = mongoose.model("Product", productSchema);
module.exports= ProductModel
