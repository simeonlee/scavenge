var compression = require('compression');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// create a new middleware function to serve files from within a given root directory
var serveStatic = require('serve-static');

// var routes = require('./routes/index');
// var users = require('./routes/users');

// create express server
var app = express();

var debug = require('debug')('twitter-test-1:server');
var http = require('http');

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);

var io = require('socket.io')(server);

// hold {lat:x,lng:y} of client
var pos = {
  lat: 40.7308,
  lng: -73.9973
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

setTimeout(function() {
  io.on('connection', function(socket) {
    // socket.emit('test emit', 'test emit');

    socket.on('my geolocation', function(clientToServer) {
      
      var clientData = JSON.parse(clientToServer);

      pos = clientData.pos
      var lat = pos.lat;
      var lng = pos.lng;

      // var twitterQueryTerms = ['paleo','healthy','keto','ketogenic','avocado','juice','chia','salad'];
      var twitterQueryTerms = clientData.twitterQueryTerms;

      // print client's geolocation
      console.log('Client geolocation: '+lat+','+lng);

      
      twitterSearch(pos, twitterQueryTerms);
    });

  });
},5000);


// io.sockets.on('my geolocation', function(userGeo) {
//   console.log(userGeo); // returns user's geolocation
//   console.log('this is geo');
//   twitterSearch(userGeo);
// });



/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}





// access Twitter API
var Twitter = require('twitter-node-client').Twitter;

var dataJSON = {test: 'No twitter data yet'};

// to log into twitter api - secret
var config = {
  "consumerKey": process.env.TWITTER_CONSUMERKEY,
  "consumerSecret": process.env.TWITTER_CONSUMERSECRET,
  "accessToken": process.env.TWITTER_ACCESSTOKEN,
  "accessTokenSecret": process.env.TWITTER_ACCESSTOKENSECRET,
  "callBackUrl": "https://infinite-inlet-93119.herokuapp.com/"
}

var twitter = new Twitter(config);



var twitterSearch = function(userGeo, twitterQueryTerms){

  if (userGeo) {
    var lat = userGeo.lat;
    var lng = userGeo.lng;
  } else {
    var lat = 40.7308;
    var lng = -73.9973;
  }

  return twitter.getSearch({
    
    // twitter query search terms
    'q': twitterQueryTerms.join(' OR '),

    // 'latitude,longitude,radius'
    'geocode': lat+','+lng+',1mi',

    // search for this many results
    'count': 20,

    // bias towards recent tweets
    'result_type': 'recent'

  }, error, success);

}

// callback functions
var error = function (err, response, body) {
  console.log('ERROR [%s]', err);
};

var success = function (data) {

  // turn string into a JSON object
  // we want to send this data to the client DOM... meteor could be a good solution
  // perhaps for now just inject JSON into HTML element and use jQuery or DOM manipulation to extract it
  // slow and unnecessary processing but good for single-use application
  dataJSON = JSON.parse(data);
  console.log(dataJSON);

  var dataJSONplusInsta = addInstaImgURL(dataJSON);
  console.log(dataJSONplusInsta);
  


  setTimeout(function(){
    // send data to client
    io.sockets.emit('retrieved tweets', dataJSONplusInsta);
  },10000);

  // print tweet
  var text = dataJSON.statuses[0].text;
  console.log(text);
};





// need to enforce SSL / https to allow geolocation in latest chrome

// app.all('*', function(req, res, next) {
//   if (/^http$/.test(req.protocol)) {
//     var host = req.headers.host.replace(/:[0-9]+$/g, ""); // strip the port # if any
//     if ((HTTPS_PORT != null) && HTTPS_PORT !== 443) {
//       return res.redirect("https://" + host + ":" + HTTPS_PORT + req.url, 301);
//     } else {
//       return res.redirect("https://" + host + req.url, 301);
//     }

//   // if(req.headers['x-forwarded-proto']!='https')
//   //   res.redirect('https://www.scavenge.io'+req.url)
//   } else {
//     return next();
//   }
// });





// we want to include caching of the content with max age
// the number of milliseconds in one day
var oneDay = 86400000;

// we want to make sure our static content is compressed using gzip
// use compress middleware that is bundled with Express
// new call to compress content before any other middlewares
// will return elements compressed with gzip if they're HTML, CSS, JS or JSON
app.use(compression());

// add static middleware that handles serving up content from public directory
// the public directory will be served and any content in it will be available
// request the root route '/' and you'll get index.html automatically
app.use(serveStatic(__dirname + '/public', { maxAge: oneDay }));



app.get('/data', function(req, res) {
  res.send(dataJSON);
});


// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
//   next();
// });




// server.listen(3000);





// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// app.get('/',function(req,res){
//   res.sendFile(path.join(__dirname+'/index.html'));
// });

// app.get('/about',function(req,res){
//   res.sendFile(path.join(__dirname+'/about.html'));
// });

// app.get('/sitemap',function(req,res){
//   res.sendFile(path.join(__dirname+'/sitemap.html'));
// });

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});







// START YELP CODE

/* require the modules needed */
var oauthSignature = require('oauth-signature');  
var n = require('nonce')();  
var request = require('request');  
var qs = require('querystring');  
var _ = require('lodash');

/* Function for yelp call
 * ------------------------
 * set_parameters: object with params to search
 * callback: callback(error, response, body)
 */



var request_yelp = function(set_parameters, pos, callback) {

  /* The type of request */
  var httpMethod = 'GET';

  /* The url we are using for the request */
  var url = 'http://api.yelp.com/v2/search';

  var lat = pos.lat;
  var lng = pos.lng;
  var yelpLatLng = lat+','+lng;

  console.log(yelpLatLng);

  /* We can setup default parameters here */
  var default_parameters = {
    ll: yelpLatLng,
    sort: '2' // 0=Best matched (default), 1=Distance, 2=Highest Rated
  };

  /* We set the require parameters here */
  var required_parameters = {
    oauth_consumer_key : process.env.YELP_CONSUMERKEY,
    oauth_token : process.env.YELP_TOKEN,
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  /* We combine all the parameters in order of importance */ 
  var parameters = _.assign(default_parameters, set_parameters, required_parameters);

  /* We set our secrets here */
  var consumerSecret = process.env.YELP_CONSUMERSECRET;
  var tokenSecret = process.env.YELP_TOKENSECRET;

  /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
  /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
  var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});

  /* We add the signature to the list of paramters */
  parameters.oauth_signature = signature;

  /* Then we turn the paramters object, to a query string */
  var paramURL = qs.stringify(parameters);

  /* Add the query string to the url */
  var apiURL = url+'?'+paramURL;

  /* Then we use request to send make the API Request */
  request(apiURL, function(error, response, body){
    return callback(error, response, body);
  });

};

var set_parameters = {
  term: 'healthy food'
}

var yelpCallback = function(error, response, body) {
  var parsedData = JSON.parse(body);
  console.log(parsedData);
}

setTimeout(function(){
  request_yelp(set_parameters, pos, yelpCallback);
},6000);










var addInstaImgURL = function(dataJSON) {

  var i;
  
  for (i = 0; i < dataJSON.length; i++) {

    // extract individual tweet status object
    var status = dataJSON.statuses[i];
    
    // extract text of tweet including t.co url
    var tweetText = status.text;



    // add instagram thumbnail url to datajson object before transmittal to client
    status.instaImgURL = returnInstaImgURL(tweetText);

    console.log(status.instaImgURL);

  }

  if (i === dataJSON.length-1) {
    return dataJSON
  }

}




var returnInstaImgURL = function() {

    // find the link in the text that starts with 'https://t.co/xxx'
    var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    var regex = new RegExp(expression);
    
    if (text.match(regex)) {
      
      // set innerURL to that link in the text that links to some content
      var innerURL = text.match(regex);
    
      // var innerURL is now a t.co url - need to transform using ajax call to 
      // www.linkexpander.com/?url=https://t.co/xxx to find instagram url
      var instaURL = expandT_coURL(innerURL,extractInstaURL);
      console.log(instaURL);

      return instaURL;

    } else {
      
      var innerURL = null;
      
      var instaURL = null;
      return null;

    }
    
  }


var expandT_coURL = function(innerURL,extractInstaURL) {
  $.ajax({
    type: 'GET',
    url: 'http://www.linkexpander.com/?url='+innerURL,
    cache: false,
    dataType: 'json',
    jsonp: false,
    success: function (data) {
      try {
        var expandedURL = data;
        console.log(expandedURL);
        var instaURL = extractInstaURL(expandedURL);
        console.log(instaURL);
        return instaURL;
      } catch (err) {
        console.log(err);
        return null;
      }
    }

  })

}




var extractInstaURL = function(expandedURL) {
  // extract instagram pic from twitter shortlink
  $.ajax({
    type: 'GET',
    url: 'http://api.instagram.com/oembed?callback=&url='+expandedURL,
    cache: false,
    dataType: 'json',
    jsonp: false,
    success: function (data) {
      try {
          var thumbnailURL = data.thumbnail_url;
          console.log(thumbnailURL);
          return thumbnailURL;
      } catch (err) {
          console.log(err);
          return null;
      }
    }
  });
}





module.exports = app;