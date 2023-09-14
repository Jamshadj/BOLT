//REQUIRING NODE MODULES
const express=require('express')
const hbs=require('express-handlebars')
const date=require('handlebars')
var bodyParser = require('body-parser')
const session=require('express-session')
const Handlebars = require('handlebars');
const moment=require('moment')
const app=express();
const dotenv= require('dotenv').config()
//IMPORTING LOCAL MODULES
const adminRoutes = require('./routes/admin') 
const userRouters= require('./routes/user')
const dbConnect=require('./dbconnect');

//SESSION
app.use(session({secret:"key",resave:false,saveUninitialized:true}))

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));


app.use(function(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next(); 
}); 


date.registerHelper('formatDate', function(date, format) {
  moment.locale('en');
  return moment(date).tz('Asia/Kolkata').format(format);
});
// hbs index number
Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

// Register the ifEqual helper
Handlebars.registerHelper('ifEqual', function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
     

//STYLE LINKING
app.use(express.static(__dirname+"/public"))
 
dbConnect()
//VIEW ENGINE SETUP
app.engine('hbs',hbs.engine({extname:'.hbs'}))
app.set('view engine','hbs')

//MIDDLEWARES
app.use(bodyParser.urlencoded({ extended: false }))

 
//ROUTER MIDDLEWARES
app.use('/admin',adminRoutes)
app.use('/',userRouters)



 
app.use('*',(req,res)=>{
  res.render('admin/error404')
})

//PORT 
app.listen(3000,console.log('server started at port number 3000'))
