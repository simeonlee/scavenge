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

var tweetCoordinates = function(tweet) {
  if (tweet.coordinates) {
    return {
      lat: tweet.coordinates.coordinates[1],
      lng: tweet.coordinates.coordinates[0]
    };
  } else {
    return null;
  }
}

exports.searchError = function (err, response, body) {
  console.log('ERROR [%s]', err);
  console.log(err);
};

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
            externalLink: expandedUrl,
            thumbnailUrl: thumbnailUrl
          });
        });
      }
    });
  })
};