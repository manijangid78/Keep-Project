const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + "/views/public"));
app.set("view engine", "ejs");

app.use(session({
  secret:"It'sMani",
  resave : false,
  saveUninitialized :true
}));

app.use(passport.initialize());
app.use(passport.session());

// make connection to mongodb database
mongoose.connect("mongodb+srv://manijangid:maMAmaMA@cluster0.pket8.mongodb.net/keepDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

// created a userSchema
const userSchema = new mongoose.Schema({
  username: String,
  email : String,
  password : String,
  articals : []
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Requests handles

// home page request--
app.get("/", function(req, res){
  res.render("home");
});

// register page get request
app.get("/register", function(req, res){
  res.render("register");
});

// notes get request
app.get("/notes", function(req, res){

  if(req.isAuthenticated()){
      User.find({email : req.user[0].email}, function(err, findUser){
        res.render("notes", {articals : findUser[0].articals})
      });

  }else{
    res.redirect("/signin");
  }

});

// signin page get request
app.get("/signin", function(req, res){
  res.render("signin");
});

// post request for notes page
app.post("/notes", function(req ,res){

  if(req.body.newNote===""){
    res.redirect("/notes")
  }else{


    // find user which is logged in and load articals
    User.find({email : req.user[0].email}, function(err, findUser){
      if(err){
        console.log(err);
      }else{
        findUser[0].articals.push(req.body.newNote);
        findUser[0].save();
        res.redirect("/notes");
      }
    });

  }

});

// post request for register page
app.post("/register", function(req, res){

  const userPassword = req.body.password;

  User.find({email:req.body.email}, function(err, findUsers){
    if(err){
      console.log(err);
    }else{
      if(findUsers.length > 0){
        res.redirect("/register");
      }else{
        // Encrypt the password using bcrypt
        bcrypt.hash(userPassword, saltRounds, function(err, hash){

          if(err){
            console.log(err);
          }else{
            // create a newUser to add database
            const newUser = new User({
              username : req.body.username,
              email : req.body.email,
              password : hash
            });
            // save user to database
            newUser.save();
            res.redirect("/signin");

            // Give Authication to user
            // req.login(newUser, function(err) {
            //   if (err) { console.log(err); }
            //   res.redirect("/notes");
            // });

          }
        });
      }
    }
  });

});

// post requiest for signin page
app.post("/signin", function(req, res){

    // find user which should match with id or not
    User.find({email:req.body.signInEmail}, function(err, findUser){
      if(err){
        console.log(err);
      }else{
        //check about user is found or not
        if(findUser.length>0){
          bcrypt.compare(req.body.signInPassword, findUser[0].password, function(err, result){
            if(err){
              console.log(err);
            }else{
              console.log(result);
              if(result){

                // Give Authication to user
                req.login(findUser, function(err) {
                  if (err) { console.log(err); }
                  res.redirect("/notes");
                });

              }else{
                res.redirect("/signin");
              }
            }
          });
        }else{
          res.redirect("/signin");
        }
      }
    });
});


// delete an note
app.post("/delete", function(req, res){

  User.find({email : req.user[0].email}, function(err, findUser){
    if(err){
      console.log(err);
    }else{

      // remove artical from articals array using slice
      if(findUser.length>0){
        findUser[0].articals.splice(req.body.artical,req.body.artical+1);
        findUser[0].save();
        res.redirect("/notes");
      }else{
        res.redirect("/notes");
      }
    }
  });

});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on 3000");
});
