// Authentication stuffs for Twitter and Yelp API
var oauthSignature = require('oauth-signature');
var n = require('nonce')();
var request = require('request');
var qs = require('querystring');
var _ = require('lodash');

// This npm unwraps the t.co urls into the expanded link
// E.g., t.co/xxx --> www.instagram.com/xxx
var reverse = require('long-url');

// Secret!!!
var config = {
  "consumerKey": process.env.TWITTER_CONSUMERKEY,
  "consumerSecret": process.env.TWITTER_CONSUMERSECRET,
  "accessToken": process.env.TWITTER_ACCESSTOKEN,
  "accessTokenSecret": process.env.TWITTER_ACCESSTOKENSECRET,
  "callBackUrl": "https://infinite-inlet-93119.herokuapp.com/"
}

var Twitter = require('twitter-node-client').Twitter;
exports.twitter = new Twitter(config);

// Contain the latest twitter query terms in the app.js scope
var twitterQueryTerms;

exports.searchError = function (err, response, body) {
  console.log('ERROR [%s]', err);
  console.log(err);
};

// Variables for the success callback
var scavenge_tweets = [];
var debugindex1;
var debugindex2;
var debugindex3;

exports.searchSuccess = function (data) {

  // Wipe the slate clean
  debugindex1 = 1;
  debugindex2 = 1;
  debugindex3 = 1;
  expanded_instagram_url_arr = [];
  thumbnail_url_arr = [];

  var twitter_API_data = JSON.parse(data);
  
  // Tweets
  var statuses = twitter_API_data.statuses;
  
  // Show what the query was that resulted in this tweet selection
  var query = twitter_API_data.search_metadata.query;
  query = decodeURIComponent(query);

  // Clear array of any existing elements  
  scavenge_tweets = [];

  console.log('LOCATION:  We are in the success handler function of the twitter API caller');
  console.log('NEWS:  We have returned ' + statuses.length + ' results');
  console.log('');
  console.log('ACTION:  Starting for loop:');
  console.log('');

  for (var i = 0; i < statuses.length; i++) {

    console.log(' ');
    console.log(debugindex1 + '  ACTION:  Setting and attaching main variables to the scavenge_tweets array')
    console.log(debugindex1 + '  text:  ' + text);

    // Extract individual tweet status object
    var status = statuses[i];
    
    // Extract text of tweet including t.co url
    var text = status.text;

    // Define variables for each tweet's elements
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

    // Only add to scavenge_tweets / send to client if there is a link to instagram pic
    // When we add support for other links later on, can add additional filters
    if (source.indexOf('instagram') > -1) {

      // Create a new array of select data to be sent to client
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

    // This function expands the t.co url into the external link
    expandURL(status, getInstagramData);
  }
};

// Put the instagram urls in here
var expanded_instagram_url_arr = [];

var expandURL = function(status, getInstagramData) {
  
  console.log(debugindex1 + '  LOCATION:  In expandURL function');
  debugindex1++;

  var text = status.text;
  var tweetID = status.id_str;  

  // Find the link in the text that starts with 'https://t.co/xxx'
  var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  var regex = new RegExp(expression);

  // Some tweets link to other sites, some don't...
  if (text.match(regex)) {

    // Get t.co url and remove from text string
    var t_coURL = text.match(regex).toString();
    var t_coURL_index = text.indexOf(t_coURL);
    text = text.slice(0,t_coURL_index);

    // 'reverse' is npm package that unwraps our t.co url
    reverse(t_coURL, function(err, expandedURL) {

      if (expandedURL) {

        console.log(' ');
        console.log(debugindex2 + '  t_coURL:  ' + t_coURL);
        console.log(debugindex2 + '  NEWS:  We\'ve received the expanded url from the API');
        console.log(debugindex2 + '  ACTION:  Now starting the secondary "for" loop to locate the correct tweet'+
          ' and attach the retrieved instagram url');
        console.log(debugindex2 + '  expandedurl:  ' + expandedURL);

        // Push the expanded instagram urls to its own array so that we can grab array properties like 'length'
        // This helps us keep track of how many instagram url's we have found in our whole tweet set
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
          }
        }
      }
    });
  }
}

// To store thumbnail url's so we can count how many we have later via Array's length property
var thumbnail_url_arr = [];

// Pull out instagram media data which contains direct link to photo URL
// Helpful since Instagram has virtually closed off their API
var getInstagramData = function(scavenge_tweet, expandedURL) {

  // Experimented with promise implementation...
  return new Promise(function(resolve, reject) {

    console.log(' ');
    console.log(debugindex2 + '  LOCATION:  In getInstagramData function');

    // Check if it's an instagram link
    if (expandedURL.indexOf('instagram') > -1) {
      
      // Instagram api link that returns some media data
      var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+expandedURL;

      // AJAX call to get Instagram photo metadata
      request(instaAPIURL, function(err, resp, body) {

        console.log(' ');
        console.log(debugindex3 + '  ACTION:  Requesting data from the Instagram API');
        console.log(debugindex3 + '  instaAPIurl:  ' + instaAPIURL);

        // Parse and set instagram data
        try {
          var instagram_data = JSON.parse(body);
          console.log(debugindex3 + '  thumbnailurl:  ' + instagram_data.thumbnail_url);
        }
        catch(err) {
          var instagram_data = body;
          console.log(debugindex3 + '  ERROR:  Cannot parse instagram_data');
        }

        // attach to scavenge_tweet
        scavenge_tweet.instagram_data = instagram_data;
        
        // Instagram thumbnail
        if (instagram_data) {
          var thumbnail_url = instagram_data.thumbnail_url;
        }
        
        // Store the instagram thumbnail url in an array
        if (thumbnail_url) {
          thumbnail_url_arr.push(thumbnail_url);
        } else {
          thumbnail_url_arr.push('noinstagramurl');
        }
        
        console.log(debugindex3);
        console.log(debugindex3 + '  ACTION:  Checking if we have unpackaged the last thumbnail_url before'+
          ' opening the socket to the client');
        console.log(' ');
        // Length of the instagram url array
        console.log('Length of thumbnail_url_arr: '+thumbnail_url_arr.length);

        // If these two variables below match, then we know we have reached the last variable of the second array
        var expanded_arr_length = expanded_instagram_url_arr.length;
        var thumbnail_arr_length = thumbnail_url_arr.length;

        // Find out if this is the last scavenge_tweet in scavenge_tweets
        if (expanded_arr_length === thumbnail_arr_length) {
          console.log(debugindex3 + '  NEWS:  Last tweet in the array! Opening socket and sending data! :)');
          // Send data to client via socket.io
          // io.sockets.emit('scavenge_tweets', scavenge_tweets);
          var sendDataToClient = require('../app.js').sendDataToClient;
          console.log(sendDataToClient);
          sendDataToClient('newTweets', scavenge_tweets);
        }
        debugindex3++;
      });
    }
    debugindex2++;
  });
}