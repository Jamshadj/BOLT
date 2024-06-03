const mongoose = require('mongoose');

const uri = "mongodb+srv://jamshad:123123123@bolt.mrga1o5.mongodb.net/?retryWrites=true&w=majority&appName=bolt";
const dbConnect = () => {
    mongoose.set('strictQuery', true);
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => {
        console.error('Error connecting to MongoDB Atlas:', err);
    });
}

module.exports = dbConnect;
