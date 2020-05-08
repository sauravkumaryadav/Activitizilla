require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const _ = require("lodash");
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

const homeStartingContent = " Blog is a platform where a writer or even a group of writers share their views on an individual subject.It's main purpose  is to connect you to the relevant audience.These are individuals who love sharing parts of their lives with you. They post various topics from arts, home designs, carpentry, and finance articles. Bloggers are mobile and don’t need to be in one place. They live on the internet!A blogger is someone who runs and controls a blog. He or she shares his or her opinion on different topics for a target audience.Would you want to have a blog of your own? Yes! Most people today are creating a blog for various reasons. Every human being has its story to tell. Hence, through the internet, bloggers can communicate to a larger group of people.Why is blogging so popular? Blogs allow you to talk about any topics and express your opinion. You’ll find some bloggers writing on every activity that took place during the day. These may range from small issues such as waking up, to major issues like human rights and climate changes! Remember that as a blogger running your own blog, you need to rely on the topics that you love and strive to become one of the best blogs on the web.";

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
mongoose.connect("mongodb+srv://admin-saurav:Saurav@1998@cluster0-ms87l.mongodb.net/minorDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

//blog
const postSchema = {
  title: String,
  content: String
};

//todolist
const itemSchema = new mongoose.Schema({
  name:String,
  userId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
const Item = new mongoose.model("Item",itemSchema);
const item1 = new Item({
  name:"Welcome to your todolist"
});
const item2 = new Item({
  name:"Hit the + button to add a new item"
});
const item3 = new Item({
  name:"Tick the checkbox to delete the item"
});
const defaultItems = [item1 , item2 , item3];
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemSchema]
});
const List = new mongoose.model("List",listSchema);
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

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/bloghome", function(req, res){

  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      res.render("bloghome", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
}
else{
    res.redirect("/login");
}
  
});

app.get("/secretshome", function (req, res) {
  res.render("secretshome");
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

  app.get("/todolistshome/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name:customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                //not exist so create a new list
                const list =new List({
                    name:req.params.customListName,
                    items:defaultItems
                });
                list.save();
                res.redirect("/todolistshome"+customListName);
            }
            else{
                //already exists
                res.render("todolistslist",{day:foundList.name,items:foundList.items});
            }
        }
    });
    
});


app.get("/todolistshome", function (req, res) {

    
  Item.find(function(err,result){
      if(result.length===0){
          Item.insertMany(defaultItems,function(err,result){
  if(err){console.log(err);}
  else{console.log("succesfully inserted all default items to your db");}
});
res.redirect("/todolistshome");
      }

      else{
          res.render('todolistslist', {
              day: "Today",
              items: result,
              userId:result.userId
          });
      }
      
          
  });


});

app.get("/secretssecrets",function(req,res){
  User.find({"secret":{$ne: null}},function(err,foundUsers){
      if(err){console.log(err)}
      else{
          if(foundUsers){
              res.render("secretssecrets",{usersWithSecrets: foundUsers});
          }
      }
  });
});

app.get("/secretssubmit",function(req,res){
  if(req.isAuthenticated()){
      res.render("secretssubmit");
  }
  else{
      res.redirect("/secretshome");
  }
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

app.post("/todolistshome", function (req, res) {
  const listName=req.body.list;
   const item = new Item({
       name: req.body.newItem,
       userId: "adnmakld"
   });
   if(listName==="Today")
   {
       item.save();
       res.redirect("/todolistshome");
   }
   else{
       List.findOne({name:listName},function(err,foundList){
           foundList.items.push(item);
           foundList.save();
           res.redirect("/todolistshome"+listName);
       });
   }
  


});

app.post("/todolistsdelete",function(req,res){ 
  const listName = req.body.listName;
  if(listName==="Today"){
      Item.findByIdAndDelete(req.body.checkbox,function(err,result){
          if(!err)
          {
          console.log("succesfully deleted");
      res.redirect("/todolistshome");}
          
});
  }
  else{
      List.findOneAndUpdate({name:listName},{$pull: {items: {_id:req.body.checkbox}}},function(err,foundList){
          if(!err){
              res.redirect("/todolistshome"+listName);
          }
      });
  }
});

app.post("/secretssubmit",function(req,res){
  const submittedSecret=req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
      if(err){console.log(err);}
      else{
          if(foundUser){
              foundUser.secret=submittedSecret;
              foundUser.save(function(){
                  res.redirect("/secretssecrets");
              });
          }
      }
  });

})

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
app.post("/contact",function(req,res){
  res.render("contact" ,{name:req.body.fName , subject:req.body.subj});
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
    console.log("server has started successfully");
});