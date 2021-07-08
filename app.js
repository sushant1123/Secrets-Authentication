//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

//to setup the initial configuration 
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// to initialize passport package
app.use(passport.initialize());

// to initialize the passport session
app.use(passport.session());


//mongodb connection
const URL = process.env.MONGODB_URL;

mongoose.connect(URL+"userDB", {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

//creating schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String

});

//to setup passport for monggose local to hash and salt the password
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

//model
const User = new mongoose.model( "User", UserSchema); 

// to provide local login strategy to authenticate users
passport.use(User.createStrategy());

// to serialize and deserialize the user session
passport.serializeUser((user, done)=> {
    done(null, user.id);
});
  
passport.deserializeUser((id, done)=> {
    User.findById(id, (err, user)=> {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  (accessToken, refreshToken, profile, cb)=> {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
  }
));

//routes
app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

//google authentication
app.get("/auth/google", 
    //use passport to authenticate a user using google strategy and we want user's profile
    passport.authenticate("google", {scope: ["profile"] })
);

//after authentication
app.get("/auth/google/secrets", 
    //if login fails, we redirect the user to login route
    passport.authenticate("google", {failureRedirect: "/login"}),
    //if login is successfull, we redirect the user to secrets route
    (req,res)=>{ res.redirect("/secrets")}
);

app.get("/secrets", (req, res)=>{
    //if user is already authenticated (with the help of express-session, passport-local-mongoose)
    // then render secrets
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});


//register post route 
app.post("/register", (req, res)=>{

    //passport local mongoose package
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.status(409).redirect("/register");
        }else{
            //                type of strategy      callback if successfull
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        }
    });
});


//login post route
app.post("/login", (req, res)=>{

    //create a user
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //using login() method to establish a login session
    req.login(user, (err)=>{
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            })        
        }
    })
});

//logout from the session
app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/");
});

app.get("/error", (req, res)=>{
    res.render("error");
});

const port = process.env.PORT || 3000;
app.listen(port, (req, res)=>{
    console.log("Server has started on port " + port +"....");
});