//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const md5 = require("md5");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

//mongodb connection
const URL = "mongodb://localhost:27017/";

mongoose.connect(URL+"userDB", {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

//creating schema

const UserSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: String
});


//model
const UserModel = new mongoose.model( "User", UserSchema); 


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

app.post("/register", (req, res)=>{
    const user = new UserModel({
        email: req.body.username,
        password: md5(req.body.password)
    });

    user.save((err, result)=>{
        if (err) {
            res.render("error", {msg: "Oops, Something went wrong...."});
        }else{
            res.render("secrets");
        }
    });
});

app.post("/login", (req, res)=>{

    const username = req.body.username;
    const password = md5(req.body.password);

    UserModel.findOne({email: username}, (err, foundUser)=>{
        
        if(err){
            res.render("error", {msg: "Oops, Something went wrong...."});
        }else{
            if (foundUser) {
                if (foundUser.password == password) {
                    res.render("secrets");
                }
                else{
                    res.render("error", {msg: "Password is wrong"});
                }
            }else{
                res.render("error", {msg: "username not found..."});
            }
        }
    })

});


app.get("/logout", (req, res)=>{
    res.redirect("/");
});

app.get("/error", (req, res)=>{
    res.render("error");
});


const port = process.env.PORT || 3000;
app.listen(port, (req, res)=>{
    console.log("Server has started on port " + port +"....");
});