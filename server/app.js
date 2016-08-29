/* 
 * In the backend:
 * I receive data from the client including the user's geolocation via socket.io
 * Make a query to the Twitter API using the client's parameters
 * Expand the shortened t.co url's that Twitter replaces its external links with
 * Check if the link is related to Instagram
 * If related to Instagram, we get the photo's metadata including a url to the img
 * Then we use socket.io to send all the Twitter and Instagram data back to the client
 */

var compression = require('compression');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var Promise = require('bluebird');
var mongoose = require('mongoose');

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var uristring =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
'mongodb://localhost/scavenge';

var twitterUtils = require('./utils/twitterUtils.js');

// Create express server
var app = express();

var debug = require('debug')('twitter-test-1:server');
var http = require('http');

var port = normalizePort(process.env.PORT || '5000');
app.set('port', port);
var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

// Use socket.io to communicate with client
var io = require('socket.io')(server);
io.on('connection', function(socket) {
  socket.on('my_geolocation', function(data) {
    data = JSON.parse(data);
    twitterUtils.twitter.getSearch({
      // Twitter query search terms
      'q': data.topic,
      // 'latitude,longitude,radius'
      'geocode': data.pos.lat+','+data.pos.lng+','+data.radius+'mi',
      // Search for this many results
      'count': 100,
      // Bias towards recent tweets
      // 'result_type': 'recent'
    }, twitterUtils.searchError, function(data) {
      var tweets = JSON.parse(data).statuses;
      tweets.forEach(function(tweet) {
        twitterUtils.searchSuccess(tweet, function(processedTweet) {
          io.sockets.emit('newTweet', processedTweet);
        });
      });
    });
  });

  // called from yelp.js when the user clicks on a grid item
  // best guesses at what location the instagram was taken
  socket.on('yelp_request_data', function(yelp_request_data){
    var yelp_term = yelp_request_data.term;
    var yelp_latLng = yelp_request_data.latLng;
    var set_parameters = {
      term: yelp_term
    }
    // requestYelp(set_parameters, yelp_latLng, yelpCallback);
  })
});

// Normalize a port into a number, string, or false
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

// Event listener for HTTP server "error" event
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

// Event listener for HTTP server "listening" event
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// We want to include caching of the content with max age the number of milliseconds in one day
var oneDay = 86400000;

// We want to make sure our static content is compressed using gzip
// Use compress middleware that is bundled with Express
// New call to compress content before any other middlewares
// Will return elements compressed with gzip if they're HTML, CSS, JS or JSON
app.use(compression());

// Add static middleware that handles serving up content from public directory
// The public directory will be served and any content in it will be available
// Request the root route '/' and you'll get index.html automatically
app.use(serveStatic(path.join(__dirname), { maxAge: oneDay }));
app.use(favicon(path.join(__dirname, 'client', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler
// No stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;