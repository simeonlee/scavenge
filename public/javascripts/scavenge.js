var MODULE = (function (my) {

	// Set up socket to communicate with our server
  var socket = io.connect(scavengeurl);
  var scavengeurl = 'https://www.scavenge.io' // website url
  // var scavengeurl = 'https://infinite-inlet-93119.herokuapp.com/' // heroku app url

  // This will be an object later that contains the data we want to send to app.js / server
  // Includes the parameters needed to make our desired Twitter API call
  my.client_to_server;

  my.twitterQueryTerms = [

    // search for all instagram pics
    // 'instagram',

    // search for healthy eating tips
    // 'paleo',
    'healthy',
    // 'keto',
    // 'ketogenic',
    // 'avocado',
    // 'juice',
    // 'juicepress',
    // 'smoothies',
    // 'chia',
    // 'salad',
    // 'salmon',
    // 'organic',
    // 'usdaorganic',
    // 'vegan',
    // 'raw',
    // 'glutenfree',
    // 'noGMO',
    // 'eatclean',
    // 'wholefoods',
    // 'kale',
    // 'broccoli',
    // 'cucumber',
    // 'ginger',
    // 'protein',
    // 'fiber'

    // search for fitness inspiration
    // 'fitness',
    // 'fitfam',
    // 'fitspo',
    // 'gym',
    // 'crossfit',
    // 'barre',
    // 'yoga',
    // 'pilates',
    // 'lifting',
    // 'training',
    // 'running',
    // 'boxing',
    // 'sweat',
  ];

  /*
	 * This is the main function that takes client's parameters & sends to app.js server  
   * 1) Called upon initGeolocate function upon loading of page
   * 2) Called upon autocomplete place_changed (user has selected a new location)
   * 3) Called upon magnifier button click (user has either selected a new location or wants to re-do the search)
   * 4) Called upon addition of search term to twitterqueryterms (user has modified the query and pressed 'Enter')
   * 5) Called upon plus button click (user has modified the query and pressed the 'plus' button)
   */
  my.setAndSendDataToServer = function(pos, radius, queryterms) {

    // Clear existing content on the map in preparation for new content
    my.clearMarkers();

    // clear grid of images
    my.clearGrid();

    // Set up object with the relevant data that we need to send to server to ask API's to search for data
    my.client_to_server = {
      pos: pos,
      search_radius: radius,
      twitterQueryTerms: queryterms
    };

    // Socket prefers json over objects
    var json_string = JSON.stringify(my.client_to_server);

    // Send data to server via socket
    socket.emit('my_geolocation', json_string);

    // set the position to be center of map
    my.google_map.setCenter(pos);

  }


  // Clear the map of content in preparation for a new query
  my.clearMarkers = function(){
    
    for (var i = 0; i < my.tweets.length; i++) {
      var stale_marker = my.tweets[i].marker;
      if (stale_marker) {
        stale_marker.setMap(null);
      }
    }

    // Announcement
    console.log('Map cleared!');

  }

	return my;
}(MODULE || {}));