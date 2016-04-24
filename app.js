var compression = require('compression');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// create a new middleware function to serve files from within a given root directory
var serveStatic = require('serve-static');

var routes = require('./routes/index');
var users = require('./routes/users');

// create express server
var app = express();

var debug = require('debug')('twitter-test-1:server');
var http = require('http');

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);

var io = require('socket.io')(server);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// var world = 'text';

setTimeout(function(){
  io.on('connection', function(socket) {
    // socket.emit('test emit', 'test emit');

    socket.on('my geolocation', function(userGeo) {
      console.log(userGeo); // returns user's geolocation
      console.log('this is geo');
      twitterSearch(userGeo);
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









// set up http server for use with socket.io
// var server = require('http').Server(app);

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

var twitterSearch = function(userGeo){

  if (userGeo) {
    var lat = userGeo.lat;
    var lng = userGeo.lng;
  } else {
    var lat = 40.7308;  
    var lng = -73.9973;
  }
  
  

  return twitter.getSearch({
    
    // bread is the enemy query terms
    'q': 'paleo'+
    ' OR '+
    'healthy'+
    ' OR '+
    'keto'+
    ' OR '+
    'ketogenic'+
    ' OR '+
    'avocado'+
    ' OR '+
    'juice'+
    ' OR '+
    'chia'+
    ' OR '+
    'salad',

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

  // send data to client
  io.sockets.emit('retrieved tweets', dataJSON);

  // print tweet
  var text = dataJSON.statuses[0].text;
  console.log(text);
};










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

app.all('/*', function(req, res, next) {
  // if (/^http$/.test(req.protocol)) {
  //   var host = req.headers.host.replace(/:[0-9]+$/g, ""); // strip the port # if any
  //   if ((HTTPS_PORT != null) && HTTPS_PORT !== 443) {
  //     return res.redirect("https://" + host + ":" + HTTPS_PORT + req.url, 301);
  //   } else {
  //     return res.redirect("https://" + host + req.url, 301);
  //   }

  if(req.headers['x-forwarded-proto']!='https')
    res.redirect('https://mypreferreddomain.com'+req.url)
  } else {
    return next();
  }
});

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

app.use('/', routes);
app.use('/users', users);

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


module.exports = app;