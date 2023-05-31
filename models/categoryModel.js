const mongoose=require('mongoose')


const categorySchema = new mongoose.Schema({
    newcategories: { 
      type: String,
      required: true
      },
    block:{
        type:Boolean,
        required:true
      }
  });

const categoryModel= new mongoose.model('NewCategory',categorySchema)
module.exports= categoryModel 