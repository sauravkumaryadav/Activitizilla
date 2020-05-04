const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Uber = require('node-uber');
const request = require("request");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));


const uber = new Uber({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    user_access_token: process.env.USER_ACCESS_TOKEN,
    redirect_uri: 'http://localhost:3000/auth/uber/minorproject',
    name: 'price comparison website',
    // language: 'en_US', // optional, defaults to en_US
    // sandbox: true, // optional, defaults to false
    // proxy: 'PROXY URL' // optional, defaults to none
  });

  app.get('/api/login', function(request, response) {
      console.log(response);
    var url = uber.getAuthorizeUrl(['request']);
    response.redirect(url);
  });
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/book",function(req,res){
    // res.sendFile(__dirname + "/index.html");
//     request(curl -H 'Authorization: Bearer ' \
//     -H 'Accept-Language: en_US' \
//     -H 'Content-Type: application/json' \
//     'https://api.uber.com/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075', function (error, response, body) {
//   console.error('error:', error); // Print the error if one occurred
//   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//   console.log('body:', body); // Print the HTML for the Google homepage.
// });


});
app.get('/api/callback', function(request, response) {
    uber.authorizationAsync({authorization_code: "crd.EA.CAESEB2Gyplb1kNwmh0kfy4at_0iATE.wh0386JHrD8xATtEImD_TXS6-V6VF07vKCw_rEq0myQ#_"})
    .spread(function(access_token, refresh_token, authorizedScopes, tokenExpiration) {
      // store the user id and associated access_token, refresh_token, scopes and token expiration date
      console.log('New access_token retrieved: ' + access_token);
      console.log('... token allows access to scopes: ' + authorizedScopes);
      console.log('... token is valid until: ' + tokenExpiration);
      console.log('... after token expiration, re-authorize using refresh_token: ' + refresh_token);
 
      // redirect the user back to your actual app
      response.redirect('/web/index.html');
    })
    .error(function(err) {
      console.error(err);
    });
});


app.post("/book",function(req,res){

});











app.listen(3000, function () {
    console.log("server started on 3000");
});