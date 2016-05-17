// Set up 'my' variable to expose methods and variables to other javascript files
var MODULE = (function (my) {

  // Set up socket to communicate with our server
  var socket = io.connect(scavengeurl);
  var scavengeurl = 'https://www.scavenge.io' // website url
  // var scavengeurl = 'https://infinite-inlet-93119.herokuapp.com/' // heroku app url

  // Expose the google map object to this file's scope
  var map;

  // How far (in miles) the twitter API should look for tweets
  // This currently doesn't work on the server side so we hardcoded the radius value in server
  var search_radius = 2;
  my.search_radius = search_radius;

  // Default location set to Washington Square Park... familiar restaurants for debugging
  var defaultLocation = {
    lat: 40.7308,
    lng: -73.9973
  }

  // We increment this index variable to create unique identifiers for each place found
  var index = 0;

  // This will be the input 'restaurants' for searching for Places on Google Places API
  // We are currently not using it for this app but keeping for future iteration
  var input;
  
  // Google Places search box
  var searchBox;

  // Array to hold our Place / Tweet markers for later operations
  var markers = [];

  // Do some operations including setting up our map and walkthrough upon DOM load
  document.addEventListener("DOMContentLoaded", function() {
    
    // Set up the map
    setUpGoogleMap();

    // Initiate walkthrough... planned for future versions
    (function() {
      console.log('initiating walkthrough')
    })();

    // If you click the search button (magnifying glass in top right),
    // search for more content in your current location
    document.getElementById('nav-search-button').onclick = function(){
      my.setAndSendDataToServer(my.pos, my.search_radius, my.twitterQueryTerms);
    }
    
  });

  // Called upon document load, enables access to Google API
  var setUpGoogleMap = function() {

    var script = document.createElement('script');
    
    script.type = 'text/javascript';

    // There is a callback function in this url that initiates the placement of our Google Map on our app
    // Used 'MODULE' instead of 'my' because this is called from the HTML file
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyATcsse4YhlcyBbTMIaPHmpZ-6M6rAdtxc&libraries=places&callback=MODULE%2EinitMap';

    document.body.appendChild(script);

  }

  // This is called from setUpGoogleMap function via the callback function in the script src
  my.initMap = function() {

    // Announcement
    console.log('In my.initMap function');

    // Get time in user's location so we can customize the app for day/night
    var hr = (new Date()).getHours()
    console.log('Hour of day:  ' + hr); // 0 - 24
    
    // If daytime, light map style
    // If nighttime, dark map style
    if (hr >= 6 && hr < 19) {
      var map_style = my.map_style_light;
    } else {
      var map_style = my.map_style_dark;
    }

    map = new google.maps.Map(document.getElementById('map'), {

      // Make map center the default location until the geolocation function finishes finding user
      center: defaultLocation,
      
      // Zoom the map to neighborhood level of detail
      zoom: 16,
      
      // No terrain view or satellite view
      mapTypeId: google.maps.MapTypeId.ROADMAP,

      // Change the style of the map to light / dark
      styles: map_style, 

      // Don't show the ui controls
      // disableDefaultUI: true,

      // Only show zoom controls
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false

    });

    // Set the map as a property of 'my' to make it and its functions accessible to other scripts
    my.google_map = map;

    // Add certain event listeners to map
    addMapListeners(map);

    // Assess user position so that we can get public API content relevent to user's context
    // Need SSL for geolocation to work... user must go to https not http
    initGeolocate(map);

    // Set up Google Places API autocomplete to search for new locations to get more content
    // https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
    var input = document.getElementById('google-search-bar');
    var autocomplete = new google.maps.places.Autocomplete(input);
    
    // Bias results to the bounds of the viewport
    autocomplete.bindTo('bounds', map);

    // Do the following when the place value is changed...
    autocomplete.addListener('place_changed', function() {
      
      var place = autocomplete.getPlace();

      // 'place' hopefully has geometry-related information
      // Geometry-related info includes location (lat,lng) and preferred viewport on map
      // Viewport specified as two lat,lng values defining southwest and
      // northeast corner of viewport bounding box - frames the result(s)

      // Geocoding is process of converting addresses into geographic coordinates

      if (!place.geometry) {
        window.alert("Autocomplete's returned place contains no geometry");
        return;
      }

      var user_inputted_location = place.geometry.location;

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {

        map.fitBounds(place.geometry.viewport);

      } else {

        map.setCenter(place.geometry.location);
        map.setZoom(16);

      }

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }

      console.log(address);

      // var new_location = {
      //   lat: new_location latitude,
      //   lng: new_location longitude
      // }
      var new_location = place.geometry.location;
      console.log(new_location);

      // save new_location to my.pos variable to persist user's new location across files
      my.pos = new_location;

      // Mark new location
      var new_location_marker_icon = new google.maps.MarkerImage("../images/newlocation@2x.png", null, null, null, new google.maps.Size(55,62));
      var marker = new google.maps.Marker({
        position: new_location,
        icon: new_location_marker_icon,
        animation: google.maps.Animation.DROP,
        title: 'new location'
      });

      // Set marker on map
      marker.setMap(map);

      // Make the marker bounce upon load
      marker.setAnimation(google.maps.Animation.BOUNCE);

      // Have the marker stop bouncing after 10 seconds for UX optimization
      setTimeout(function(){
        marker.setAnimation(null);
      },10000)

      // Stop animation or reanimate the marker once you click on it
      marker.addListener('click', function() {
        
        // Reset the zoom to starting 16
        map.setZoom(16);

        // Bounce on / off
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      });

      // Attach user geolocation data and twitter query terms to a data object
      // that we will send to the server to make API calls with based on user context
      my.setAndSendDataToServer(new_location, search_radius, my.twitterQueryTerms);

    });

    // Additional UX optimization where the map centers where you click
    map.addListener('click', function(event) {
      map.panTo(event.latLng);
    });
    
  }

  // This function gets the user's geolocation and sends
  // data to the app.js server regarding this new parameter
  function initGeolocate(map){

    console.log('In my.initGeolocate function');

    // Try HTML5 geolocation
    if (navigator.geolocation) {
      
      navigator.geolocation.getCurrentPosition(function(position) {        
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // for calculating distances, etc.
        my.pos = pos;

        console.log('User located at ' + pos.lat + ', ' + pos.lng);
        
        var user_position_marker_icon = new google.maps.MarkerImage("../images/homeicon@2x.png", null, null, null, new google.maps.Size(55,62));

        // mark user location - 'the nest'
        var marker = new google.maps.Marker({
          position: pos,
          icon: user_position_marker_icon,
          animation: google.maps.Animation.DROP,
          title: 'you'
        });

        // put the home marker on the map
        marker.setMap(map);

        // make the home marker bounce upon load
        marker.setAnimation(google.maps.Animation.BOUNCE);

        // Have the home marker stop bouncing after 10 seconds
        setTimeout(function(){
          marker.setAnimation(null);
        },10000)

        marker.addListener('click', function() {
          
          // reset the zoom to starting 16
          map.setZoom(16);

          // bounce toggle on / off
          if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          }
        });

        // Attach user geolocation data and twitter query terms to a data object
        // that we will send to the server to make API calls with based on user context
        my.setAndSendDataToServer(pos, search_radius, my.twitterQueryTerms);

        // Set map to center on position
        map.setCenter(pos);

      }, function() {

        alert('Geolocation failed');

      });

    } else {

      alert('Your browser doesn\'t support geolocation');

    }

  };

  // Add event listeners and UX customization to map... planned for future versions
  var addMapListeners = function(map) {

    // When you move the map viewport, enable the user to 'scavenge' even easier
    // by bringing up new tweets / pictures just by moving the map around
    map.addListener('bounds_changed', function() {
      
      console.log('bounds changed');

    })

    map.addListener('zoom_changed', function() {

      console.log('zoom changed');

    });

  }
  
  return my;
}(MODULE || {}));