var Twitter = require('twitter-node-client').Twitter;
var instagramUtils = require('./instagramUtils');

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

exports.twitter = new Twitter(config);

var isolateShortenedUrl = function(text, callback) {
  // Find the link in the text that starts with 'https://t.co/xxx'
  var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  var regex = new RegExp(expression);

  // Some tweets link to other sites, some don't...
  if (text.match(regex)) {
    // Get t.co url and remove from text string
    var url = text.match(regex).toString();
    var index = text.indexOf(url);
    text = text.slice(0, index);
    callback(url);
  } else {
    return;
  }
}

exports.searchError = function (err, response, body) {
  console.log('ERROR [%s]', err);
  console.log(err);
};

var tweetCoordinates = function(tweet) {
  if (tweet.coordinates) {
    return {
      lat: tweet.coordinates.coordinates[1],
      lng: tweet.coordinates.coordinates[0]
    }
  } else {
    return null;
  }
}

exports.searchSuccess = function (tweet, callback) {
  isolateShortenedUrl(tweet.text, function(shortenedUrl) {
    // This function expands the t.co url into the external link
    console.log(shortenedUrl);
    reverse(shortenedUrl, function(err, expandedUrl) {
      console.log(expandedUrl);
      if (err) {
        console.log(err);
        return;
      } else if (!expandedUrl) {
        console.log('No expandedUrl found');
        return;
      } else if (expandedUrl.indexOf('instagram') > -1) {
        instagramUtils.getThumbnailUrl(expandedUrl, function(thumbnailUrl) {

          // Create a new array of select data to be sent to client
          callback({
            tweetID: tweet.id_str,
            user: tweet.user,
            text: tweet.text,
            hashtags: tweet.entities.hashtags,
            latLng: tweetCoordinates(tweet),
            timestamp: tweet.created_at,
            source: tweet.source,
            favorite_count: tweet.favorite_count,
            retweet_count: tweet.retweet_count,
            truncated: tweet.truncated,
            sensitive: tweet.possibly_sensitive,
            thumbnailUrl: thumbnailUrl
          });
        });
      }
    });
  })
};

// Only add to scavengeTweets / send to client if there is a link to instagram pic
// When we add support for other links later on, can add additional filters
// if (source.indexOf('instagram') > -1) {

// }


// // Put the instagram urls in here
// var expanded_instagram_url_arr = [];

// var expandURL = function(tweet) {
  
//   // console.log(debugindex1 + '  LOCATION:  In expandURL function');
//   // debugindex1++;

//   var text = tweet.text;
//   var tweetID = tweet.id_str;  

//   // 'reverse' is npm package that unwraps our t.co url
//   // reverse(t_coURL, function(err, expandedURL) {

    
//   // });
// }


// Wipe the slate clean
// debugindex1 = 1;
// debugindex2 = 1;
// debugindex3 = 1;
// expanded_instagram_url_arr = [];
// thumbnail_url_arr = [];


// console.log('LOCATION:  We are in the success handler function of the twitter API caller');
// console.log('NEWS:  We have returned ' + tweets.length + ' results');
// console.log('');
// console.log('ACTION:  Starting for loop:');
// console.log('');


// var debugindex1;
// var debugindex2;
// var debugindex3;

// Contain the latest twitter query terms in the app.js scope
// var twitterQueryTerms;

// console.log(debugindex1 + '  ACTION:  Calling expandURL function now');


// console.log(' ');
// console.log(debugindex2 + '  t_coURL:  ' + t_coURL);
// console.log(debugindex2 + '  NEWS:  We\'ve received the expanded url from the API');
// console.log(debugindex2 + '  ACTION:  Now starting the secondary "for" loop to locate the correct tweet'+
//   ' and attach the retrieved instagram url');
// console.log(debugindex2 + '  expandedurl:  ' + expandedURL);


// console.log(' ');
// console.log(debugindex1 + '  ACTION:  Setting and attaching main variables to the scavengeTweets array')
// console.log(debugindex1 + '  text:  ' + text);
