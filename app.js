//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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

//to initialize the passport package
app.use(passport.initialize());

//to deal with the session
app.use(passport.session());


//mongodb connection
const URL = "mongodb://localhost:27017/";

mongoose.connect(URL+"userDB", {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

//creating schema

const UserSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: String
});

//to setup a passport for mongoose local to hash and salt the pwd 
UserSchema.plugin(passportLocalMongoose);

//model
const UserModel = new mongoose.model( "User", UserSchema); 

//local login strategy
passport.use(UserModel.createStrategy());

//serialize and deserialize the user
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

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

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});


//register post route 
app.post("/register", (req, res)=>{

    //passport local mongoose package
    UserModel.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            //                  type of auth          if successfull then in callback
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            });
        }
    });
});


//login post route
app.post("/login", (req, res)=>{

    //create a user
    const user = new UserModel({
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
    req.logOut();
    res.redirect("/");
});

app.get("/error", (req, res)=>{
    res.render("error");
});

const port = process.env.PORT || 3000;
app.listen(port, (req, res)=>{
    console.log("Server has started on port " + port +"....");
});