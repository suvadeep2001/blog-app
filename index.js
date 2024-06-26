require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 4000;
const seedDB = require('./seed');

// routes
const blogRoutes = require('./routes/blogs')
const authRoutes = require('./routes/auth');

const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

const sessionConfig = {
    secret: process.env.SECRET_CONFIG,
    resave: false,
    saveUninitialized: true
}

app.use(session(sessionConfig));
app.use(flash());

// Initilising the passport and sessions for storing the users info
app.use(passport.initialize());
app.use(passport.session());

// configuring the passport to use local strategy
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//  database connection

mongoose.connect(process.env.SECRET_DB,
{
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex:true,
    useUnifiedTopology: true
})



.then( ()=>{
    console.log("DB Connected!!!")
})
.catch( (err) => {
    console.log("Something Went Wrong!!!")
    console.log(err.message);
})

// seedDB();

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
})


app.get('/', (req, res) => {
        res.render('./blogs/cover')
    })

app.use(blogRoutes);
app.use(authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})