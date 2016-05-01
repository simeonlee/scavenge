
/* require the modules needed */
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

var oauthSignature = require('oauth-signature');
var n = require('nonce')();
var request = require('request');
var qs = require('querystring');
var _ = require('lodash');

// hold {lat:x,lng:y} of client
var pos = {
  lat: 40.7308,
  lng: -73.9973
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// setTimeout(function() {
  io.on('connection', function(socket) {
    // socket.emit('test emit', 'test emit');

    socket.on('my geolocation', function(clientToServer) {
      
      var clientData = JSON.parse(clientToServer);

      pos = clientData.pos;
      var lat = pos.lat;
      var lng = pos.lng;

      // var twitterQueryTerms = ['paleo','healthy','keto','ketogenic','avocado','juice','chia','salad'];
      var twitterQueryTerms = clientData.twitterQueryTerms;

      // print client's geolocation
      console.log('Client geolocation: '+lat+','+lng);

      
      twitterSearch(pos, twitterQueryTerms);
    });

  });
// },2500);


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

var twitter_API_data = {test: 'No twitter data yet'};

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

var scavenge_tweets = [];

var success = function (data) {

  twitter_API_data = JSON.parse(data);
  var statuses = twitter_API_data.statuses;
  
  // show what the query was that resulted in this tweet selection
  var query = twitter_API_data.search_metadata.query;
  query = decodeURIComponent(query);

  // clear array of any existing elements  
  scavenge_tweets = [];

  for (var i = 0; i < statuses.length; i++) {

    // extract individual tweet status object
    var status = statuses[i];
    
    // extract text of tweet including t.co url
    var text = status.text;
    console.log(text);

    // define variables for each tweet's elements
    var text = status.text;
    var coord = status.coordinates;
    var user = status.user;
    var timestamp = status.created_at;
    var tweetID = status.id_str;
    var source = status.source;
    var hashtags = status.entities.hashtags;
    var favorite_count = status.favorite_count;
    var retweet_count = status.retweet_count;
    var truncated = status.truncated;
    var sensitive = status.possibly_sensitive;

    if (coord) {
      var ll = coord.coordinates;
      var lat = ll[1];
      var lng = ll[0];
      var latLng = {
        lat: lat,
        lng: lng
      }
    } else {
      var latLng = null;
    }
   
    // create a new array of select data to be sent to client
    scavenge_tweets.push({
      tweetID: tweetID,
      user: user,
      text: text,
      hashtags: hashtags,
      latLng: latLng,
      timestamp: timestamp,
      source: source,
      favorite_count: favorite_count,
      retweet_count: retweet_count,
      truncated: truncated,
      sensitive: sensitive,
      query: query
    });
    
    expandURL(status, getInstagramData);
    
  }

};







var expandURL = function(status, getInstagramData) {

  var text = status.text;
  var tweetID = status.id_str;  

  // find the link in the text that starts with 'https://t.co/xxx'
  var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  var regex = new RegExp(expression);
  
  if (text.match(regex)) {

    // set external link to that link in the text that links to some content
    var t_coURL = text.match(regex);
    var linkexpanderURL = 'https://www.linkexpander.com/?url='+t_coURL;

    request(linkexpanderURL, function(err, resp, body) {
    
      // set the returned www.instagram.com url to 'expandedURL'
      // can also be a link to something else like a personal blog or something
      // so we need an if statement next to check if it's an instagram link
      var expandedURL = body;
      
      for (var i = 0; i < scavenge_tweets.length; i++) {
      
        var scavenge_tweet = scavenge_tweets[i];
        
        if (scavenge_tweet.tweetID === tweetID) {

          scavenge_tweet.external_link = expandedURL;
          
          getInstagramData(status);

        }

      }

    });

  }

}

var getInstagramData = function(scavenge_tweet) {

  var expandedURL = scavenge_tweet.external_link;

  // check if it's an instagram link
  if (expandedURL.indexOf('instagram') > -1) {
    
    // instagram api link that returns some media data
    var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+expandedURL;
    
    request(instaAPIURL, function(err, resp, body) {
      
      // parse and set instagram data
      var instagram_data = JSON.parse(body);

      scavenge_tweet.instagram_data = instagram_data;

      for (var i = 0; i < scavenge_tweets.length; i++) {
        
        // find out if this is the last scavenge_tweet in scavenge_tweets
        if (scavenge_tweets[i].tweetID === scavenge_tweet.tweetID && scavenge_tweets[i+1] == undefined) {

        setTimeout(function() {
          // send data to client
          io.sockets.emit('scavenge tweets', scavenge_tweets);
        },5000);

        }

      }

    });

  }

}






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
  res.send(twitter_API_data);
});

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

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

// setTimeout(function(){
  // request_yelp(set_parameters, pos, yelpCallback);
// },6000);












module.exports = app;





