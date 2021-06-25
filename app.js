//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const _ = require("lodash");

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

// encryption should be done before creating a model


//SchemaName.plugin(mongoose_encryption, {secret: secretName, encryptedFields: [an array of encryptedFields]})
UserSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

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
        password: req.body.password
    });

    //console.log(user);
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
    const password = req.body.password;

    //console.log(username, password);

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