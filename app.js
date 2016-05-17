
// Require the modules needed
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

var reverse = require('long-url');

// hold {lat:x,lng:y} of client
var pos = {
  lat: 40.7308,
  lng: -73.9973
}

// hold the latest twitter query terms in the wider app.js scope
var twitterQueryTerms;

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

  io.on('connection', function(socket) {
    // socket.emit('test emit', 'test emit');

    socket.on('my_geolocation', function(clientToServer) {
      
      var clientData = JSON.parse(clientToServer);

      // search radius in miles
      var search_radius = clientToServer.search_radius;

      pos = clientData.pos;
      var lat = pos.lat;
      var lng = pos.lng;

      // var twitterQueryTerms = ['paleo','healthy','keto','ketogenic','avocado','juice','chia','salad'];
      twitterQueryTerms = clientData.twitterQueryTerms;

      // print client's geolocation
      console.log('Client geolocation: '+lat+','+lng);

      
      twitterSearch(pos, search_radius, twitterQueryTerms);
    });

  });

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

var twitterSearch = function(userGeo, search_radius, twitterQueryTerms) {

  // Reference:
  // https://dev.twitter.com/rest/reference/get/search/tweets

  if (userGeo) {
    var lat = userGeo.lat;
    var lng = userGeo.lng;
  } else {
    var lat = 40.7308;
    var lng = -73.9973;
  }

  // UTF-8, URL-encoded search query of 500 characters maximum, including operators
  var twitter_query = twitterQueryTerms.join(' OR ');
  
  // 37.781157,-122.398720,1mi
  var geocode_input = lat+','+lng+',2mi';

  // maximum of 100, defaults to 15
  var results_count = 50;

  console.log('Twitter Query String:  ' + twitter_query);
  console.log('Twitter Query String Length:  ' + twitter_query.length + ' (500 char maximum)');
  console.log('Twitter Geocode Input:  ' + geocode_input);
  console.log('Number Of Results To Return:  ' + results_count);

  return twitter.getSearch({
    
    // twitter query search terms
    'q': twitter_query,

    // 'latitude,longitude,radius'
    'geocode': geocode_input,

    // search for this many results
    'count': results_count,

    // bias towards recent tweets
    // 'result_type': 'recent'

  }, error, success);

}

// callback functions
var error = function (err, response, body) {
  console.log('ERROR [%s]', err);
};

var scavenge_tweets = [];

var debugindex1;
var debugindex2;
var debugindex3;

var success = function (data) {

  // wipe the slate
  debugindex1 = 1;
  debugindex2 = 1;
  debugindex3 = 1;
  expanded_instagram_url_arr = [];
  thumbnail_url_arr = [];

  twitter_API_data = JSON.parse(data);
  var statuses = twitter_API_data.statuses;
  
  // show what the query was that resulted in this tweet selection
  var query = twitter_API_data.search_metadata.query;
  query = decodeURIComponent(query);

  // clear array of any existing elements  
  scavenge_tweets = [];

  console.log('LOCATION:  We are in the success handler function of the twitter API caller');
  console.log('NEWS:  We have returned ' + statuses.length + ' results');
  console.log('');

  // if the twitter query had keywords that were too specific and we couldn't find any results,
  // redo the twitter search but for all instagram pics in the local vicinity so that you
  // don't serve up an empty page
  // we also want to show a message on the client side to the user alerting them of this
  // if (statuses.length === 0) {
  //   twitterQueryTerms.push('instagram');
  //   twitterSearch(pos, search_radius, twitterQueryTerms);
  // }

  console.log('ACTION:  Starting for loop:');
  console.log('');

  for (var i = 0; i < statuses.length; i++) {


    console.log(' ');
    console.log(debugindex1 + '  ACTION:  Setting and attaching main variables to the scavenge_tweets array')
    console.log(debugindex1 + '  text:  ' + text);



    

    // extract individual tweet status object
    var status = statuses[i];
    
    // extract text of tweet including t.co url
    var text = status.text;

    
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

    // only add to scavenge_tweets / send to client if there is a link to instagram pic
    // when we add support for other links later on, can add additional filters through ||
    if (source.indexOf('instagram') > -1) {

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

    }
    
    console.log(debugindex1 + '  ACTION:  Calling expandURL function now');

    expandURL(status, getInstagramData);
    
  }

  // // send data to the client anyways, no matter what happens in these loops / requests
  // setTimeout(function() {
  //   console.log('10 seconds have elapsed - sending data anyways!')

  //   // send data to client
  //   io.sockets.emit('scavenge_tweets', scavenge_tweets);
  // },10000);

};


// put the instagram urls in here
var expanded_instagram_url_arr = [];



var expandURL = function(status, getInstagramData) {
  
  console.log(debugindex1 + '  LOCATION:  In expandURL function');
  debugindex1++;

  var text = status.text;
  var tweetID = status.id_str;  

  // find the link in the text that starts with 'https://t.co/xxx'
  var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  var regex = new RegExp(expression);
  
  if (text.match(regex)) {

    // set external link to that link in the text that links to some content
    var t_coURL = text.match(regex).toString();
    var linkexpanderURL = 'https://www.linkexpander.com/?url='+t_coURL;

    // remove the inner URL from the text so we can do better things with the url
    // ideally somehow show the contents of the webpage beyond the url in the card itself...
    // for example, if it is a link to instagram just display the pic...
    var t_coURL_index = text.indexOf(t_coURL);
    text = text.slice(0,t_coURL_index);



    



    // request(linkexpanderURL, function(err, resp, body) {

    // HEAD is same as GET but returns only HTTP headers and no document body

    // request( { method: "HEAD", url: t_coURL, followAllRedirects: true }, function(error, response) {

    reverse(t_coURL, function(err, expandedURL) {

      if (expandedURL) {

        // set the returned www.instagram.com url to 'expandedURL'
        // can also be a link to something else like a personal blog or something
        // so we need an if statement next to check if it's an instagram link
        // var expandedURL = body.toString();

        // var expandedURL = expandedURL;

        console.log(' ');
        console.log(debugindex2 + '  t_coURL:  ' + t_coURL);
        console.log(debugindex2 + '  NEWS:  We\'ve received the expanded url from the API and it looks like'+
          ' it took awhile to get here');
        console.log(debugindex2 + '  ACTION:  Now starting the secondary for loop to locate the correct tweet'+
          ' and attach the retrieved instagram url that we get from the API');

        // console.log(debugindex2 + '  user:  ' + scavenge_tweet.user.name);
        console.log(debugindex2 + '  expandedurl:  ' + expandedURL);

        // push the expanded instagram urls to its own array so that we can grab the length for later
        if (expandedURL.includes("www.instagram.com")) {

          expanded_instagram_url_arr.push(expandedURL);
          console.log(' ');
          console.log('Length of expanded_instagram_url_arr: '+expanded_instagram_url_arr.length);

        }



        

        
        for (var i = 0; i < scavenge_tweets.length; i++) {
        
          var scavenge_tweet = scavenge_tweets[i];
          
          if (scavenge_tweet.tweetID === tweetID) {

            scavenge_tweet.text = text;
            scavenge_tweet.external_link = expandedURL;
            
            getInstagramData(scavenge_tweet, expandedURL);
              // .then(function(response) {
              //   console.log(debugindex1 + '  NEWS:  Promise was successful! We are about to socket emit the scavenged tweets');
              // }, function(error) {
              //   console.log(debugindex1 + '  NEWS:  Promise failed!');
              // });

          }

        }

      }



    });

  }

}



// to store thumbnail url's so we can count how many we have later
var thumbnail_url_arr = [];


var getInstagramData = function(scavenge_tweet, expandedURL) {

  return new Promise(function(resolve, reject) {

    console.log(' ');
    console.log(debugindex2 + '  LOCATION:  In getInstagramData function');


    // check if it's an instagram link
    if (expandedURL.indexOf('instagram') > -1) {
      
      // instagram api link that returns some media data
      var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+expandedURL;




      request(instaAPIURL, function(err, resp, body) {

        console.log(' ');
        console.log(debugindex3 + '  ACTION:  Requesting data from the Instagram API');

        // console.log(debugindex2 + '  ' + 'In getInstagramData\'s request function for instagram API data');
        console.log(debugindex3 + '  instaAPIurl:  ' + instaAPIURL);

        // parse and set instagram data
        try {
          
          var instagram_data = JSON.parse(body);
          console.log(debugindex3 + '  thumbnailurl:  ' + instagram_data.thumbnail_url);
          

          

        }
        catch(err) {
          
          var instagram_data = body;
          console.log(debugindex3 + '  ERROR:  Cannot parse instagram_data');


        
        }

        // store the instagram thumbnail url in an array
        var thumbnail_url = instagram_data.thumbnail_url;
        thumbnail_url_arr.push(thumbnail_url);








        scavenge_tweet.instagram_data = instagram_data;
        








        console.log(debugindex3);
        console.log(debugindex3 + '  ACTION:  Checking if we have unpackaged the last thumbnail_url before'+
          ' opening the socket to the client');

        console.log(' ');
        console.log('Length of thumbnail_url_arr: '+thumbnail_url_arr.length);


        // length of the instagram url array
        // hopefully we've collected all the instagram urls by now and so when we call scavenge_tweets[x] below
        // we would be one beyond the actual number of scavenge_tweets that we have collected, which would be equal
        // to 'undefined' and would trigger the socket call
        var expanded_arr_length = expanded_instagram_url_arr.length;
        var thumbnail_arr_length = thumbnail_url_arr.length;
        



        // for (var i = 0; i < scavenge_tweets.length; i++) {

          // find out if this is the last scavenge_tweet in scavenge_tweets
          if (expanded_arr_length === thumbnail_arr_length) {

            console.log(debugindex3 + '  NEWS:  Arrived at the last tweet in the array! Time to open the socket'+
              ' and send data to the client!');

            // setTimeout(function() {
            
              // send data to client
              io.sockets.emit('scavenge_tweets', scavenge_tweets);

            // },5000);

          // }

          }


        debugindex3++;
        
      });

    }

    debugindex2++;

  });

}








// var getInstagramData = function(scavenge_tweet, expandedURL) {

//   console.log(expandedURL);

//   // check if it's an instagram link
//   if (expandedURL.indexOf('instagram') > -1) {
    
//     // instagram api link that returns some media data
//     var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+expandedURL;
    
//     request(instaAPIURL, function(err, resp, body) {      

//       // parse and set instagram data
//       try {
//         var instagram_data = JSON.parse(body);
//       }
//       catch(err) {
//         var instagram_data = body;
//       }

//       scavenge_tweet.instagram_data = instagram_data;

//       for (var i = 0; i < scavenge_tweets.length; i++) {
        
//         // find out if this is the last scavenge_tweet in scavenge_tweets
//         if (scavenge_tweets[i].tweetID === scavenge_tweet.tweetID && scavenge_tweets[i+1] == undefined) {

//         setTimeout(function() {
//           // send data to client
//           io.sockets.emit('scavenge tweets', scavenge_tweets);
//         },10000);

//         }

//       }
      
//     });

//   }

// }






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





