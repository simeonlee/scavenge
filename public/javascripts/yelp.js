var MODULE = (function (my) {

	// Set up socket to communicate with our server
	var socket = io.connect(scavengeurl);
	var scavengeurl = 'https://www.scavenge.io' // website url

	// Called from grid.js when the grid item is clicked
	my.yelpInit = function(tweet) {
		
		// Hashtag logic to search yelp with
		var hashtags_arr = [];
		var latLng = tweet.latLng;

		if (tweet.hashtags.length > 0) {
		  var hashtags = tweet.hashtags;

		  for (var i = 0; i < hashtags.length; i++) {
		    var hashtag = hashtags[i].text;
		    hashtags_arr.push(hashtag);
		  }
		  
		  console.log(hashtags_arr);

		  yelpRequestPrep(hashtags, latLng);
		}
	}

	// Send the data to the server to initiate the yelp API call
	var yelpRequestPrep = function(hashtags, latLng) {
		var term = hashtags[0];

		var yelp_request_data = {
			term: term,
			latLng: latLng
		}

		socket.emit('yelp_request_data', yelp_request_data);
	}

	// Return the response from the yelp API call
	socket.on('yelp_response_data', function(yelp_response_data){
		displayYelpData(yelp_response_data);
	})

	// Do things with the yelp data
	var displayYelpData = function(data){
		
	}

  return my;
}(MODULE || {}));