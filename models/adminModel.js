const mongoose= require("mongoose");

const adminSchema= new mongoose.Schema({
    email: { 
        type: String,
        required : true,

    },
    password:{
            type:String,
            required : true,
    }
})

const adminModel= new mongoose.model('admin',adminSchema)
module.exports= adminModel
