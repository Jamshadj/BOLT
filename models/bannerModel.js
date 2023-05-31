const mongoose= require("mongoose");

const bannerschema= new mongoose.Schema({
    name: { 
        type: String,
        required : true,

    }, 
    description: { 
        type: String,
        required : true,

    },
    image:{
            type:Object,
            required : true,
    }
     
})

const bannerModel= new mongoose.model('banner',bannerschema)
module.exports= bannerModel