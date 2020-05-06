require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Uber = require('node-uber');
const request = require("request");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const  findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;
const  uberStrategy = require('passport-uber-v2').Strategy;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
  secret:"our little secret.",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/minorDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

//blog
const postSchema = {
  title: String,
  content: String
};


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/book",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  //console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/book"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// passport.use(new uberStrategy({
//   clientID: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: 'http://localhost:3000/book'
// },
// function(accessToken, refreshToken, request, done) {
//   var user = request;
//   console.log(user);
//   user.accessToken = accessToken;
//   return done(null, user);
// }
// ));


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/bloghome", function(req, res){

  Post.find({}, function(err, posts){
    res.render("bloghome", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});


app.get("/blogcompose", function(req, res){
  res.render("blogcompose");
});

app.get("/blogposts/:postId", function(req, res){

  const requestedPostId = req.params.postId;
  
    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("blogpost", {
        title: post.title,
        content: post.content
      });
    });
  
  });

 

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
  );

  app.get("/auth/google/book", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to book.
    res.redirect("/book");
  });

app.get('/auth/facebook',
passport.authenticate('facebook'));

app.get('/auth/facebook/book',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/book');
  });



app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/book",function(req,res){
  if(req.isAuthenticated()){
    res.render("book");
  }
  else{
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect('/');
});


app.post("/blogcompose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
        res.redirect("/bloghome");
    }
  });
});

app.post("/blogdelete",function(req,res){
    
  if(req.body.titleName===req.body.delete){
    Post.findOneAndDelete({title:req.body.delete},function(err,result){
      if(!err){
        console.log("succesfully deleted");
    res.redirect("/bloghome");}
      });
  }
    else{
      console.log("cant find");
    }
});

app.post("/register", function (req, res) {
  User.register({username:req.body.username},req.body.password,function(err,user){
      if(err){console.log(err);
          res.redirect("/register");}
      else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/book");
          });

      }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });

  req.login(user,function(err){
      if(err){console.log(err);
         res.redirect("/register");}
      else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/book");
      });
  }

});
});


app.listen(3000, function () {
    console.log("server started on 3000");
});