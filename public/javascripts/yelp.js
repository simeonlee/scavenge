var MODULE = (function (my) {

	// store the yelp places so we can clear them later
	my.places = [];

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
		markPlaces(yelp_response_data);
	})

	// Mark the places on the map
	var markPlaces = function(data){
		var places = data.businesses;
		for (var i = 0; i < places.length; i++) {
			(function(i){
				var place = places[i];
				var coord = place.location.coordinate;
				var lat = coord.latitude;
				var lng = coord.longitude;
				var pos_lat_lng = {lat: lat, lng: lng};
				var icon_img_src = '../images/icons/restaurant@2x.png';
				var icon_dim = {width: 30, height: 28};
				var marker_title = 'place';
				var marker = my.createMapMarker(pos_lat_lng, icon_img_src, icon_dim, marker_title);
				marker.addListener('mouseover', function(){
					displayPlaceData(place);
				});
				my.places.push(place);
				my.places[i].marker = marker; // save reference to marker so we can clear it later
			})(i);
		}
	}

	var displayPlaceData = function(place){
		console.log(place);
		var name = place.name;
		var rating = place.rating;
		var review_count = place.review_count;
		var is_closed = place.is_closed;
		var url = place.url;
		var img_url = place.image_url;

		if (is_closed == true) {
			my.overlayTextOnMap(is_closed.toString(), 'place-overlay-closed', url);
		}

		my.overlayTextOnMap(name, 'place-overlay-name', url);
		my.overlayTextOnMap(rating + ' stars', 'place-overlay-rating', url);
		my.overlayTextOnMap(review_count + ' reviews', 'place-overlay-review-count', url);
		my.overlayTextOnMap(img_url, 'overlay-place-img', url);

	}
	
  return my;
}(MODULE || {}));