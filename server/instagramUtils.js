var request = require('request');

// Pull out instagram media data which contains direct link to photo URL
// Helpful since Instagram has virtually closed off their API
exports.getThumbnailUrl = function(url, callback) {
  // Access exposed part of Instagram API to acquire media data
  var instaAPIURL = 'https://api.instagram.com/oembed?callback=&url='+url;
  request(instaAPIURL, function(err, resp, body) {
    if (err) {
      console.log(err);
      return;
    }
    Parse and set instagram data
    try {
      body = JSON.parse(body);
      callback(body.thumbnail_url);
    }
    catch(err) {
      console.log(err);
      callback(null);
    }
  });
}

// console.log(' ');
// console.log(debugindex3 + '  ACTION:  Requesting data from the Instagram API');
// console.log(debugindex3 + '  instaAPIurl:  ' + instaAPIURL);



// attach to scavenge_tweet
// scavenge_tweet.instagram_data = instagram_data;

// Instagram thumbnail
// if (instagram_data) {
//   var thumbnail_url = instagram_data.thumbnail_url;
// }

// Store the instagram thumbnail url in an array
// if (thumbnail_url) {
  // thumbnail_url_arr.push(thumbnail_url);
// } else {
  // thumbnail_url_arr.push('noinstagramurl');
// }

// console.log(debugindex3);
// console.log(debugindex3 + '  ACTION:  Checking if we have unpackaged the last thumbnail_url before'+
  // ' opening the socket to the client');
// console.log(' ');
// Length of the instagram url array
// console.log('Length of thumbnail_url_arr: '+thumbnail_url_arr.length);

// If these two variables below match, then we know we have reached the last variable of the second array
// var expanded_arr_length = expanded_instagram_url_arr.length;
// var thumbnail_arr_length = thumbnail_url_arr.length;

// Find out if this is the last scavenge_tweet in scavenge_tweets
// if (expanded_arr_length === thumbnail_arr_length) {
  // console.log(debugindex3 + '  NEWS:  Last tweet in the array! Opening socket and sending data! :)');
  // Send data to client via socket.io
  // io.sockets.emit('scavenge_tweets', scavenge_tweets);

// }
// debugindex3++;