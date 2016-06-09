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

  // After we have sent our parameters to app.js, the server will make a Twitter API Call
  // and return tweets and related data to the client via socket below
  socket.on('scavenge_tweets', function(data) {

    // Announcement
    console.log("'scavenge_tweets' socket is on")

    // Start displaying data that we received from server on our map
    my.markTweets(data, map);

    my.showImagesOnGrid(data);

  })

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
    // document.getElementById('nav-search-button').onclick = function(){
    //   my.setAndSendDataToServer(my.pos, my.search_radius, my.twitterQueryTerms);
    // }
    
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
    // if (hr >= 6 && hr < 19) {
    //   var map_style = my.map_style_light;
    // } else {
    //   var map_style = my.map_style_dark;
    // }
    var map_style = my.map_style_dark;

    map = new google.maps.Map(document.getElementById('map'), {

      // Make map center the default location until the geolocation function finishes finding user
      center: defaultLocation,
      
      // Zoom the map to neighborhood level of detail
      zoom: 15,
      
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
    my.map = map;

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
        map.setZoom(15);

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

      // Mark new location
      var new_location = place.geometry.location;
      var icon_img_src = '../images/newlocation@2x.png';
      var icon_dim = {
        width: 55,
        height: 62
      }
      var marker_title = 'new location';
      my.createMapMarker(new_location, icon_img_src, icon_dim, marker_title);

      console.log(new_location);
      
      // save new_location to my.pos variable to persist user's new location across files
      my.pos = new_location;

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

        // Create marker for user position
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var icon_img_src = '../images/homeicon@2x.png';
        var icon_dim = {
          width: 55,
          height: 62
        }
        var marker_title = 'you';
        my.createMapMarker(pos, icon_img_src, icon_dim, marker_title);

        console.log('User located at ' + pos.lat + ', ' + pos.lng);

        // for calculating distances, etc.
        my.pos = pos;

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
  
  my.overlayTextOnMap = function(text, class_name, external_link) {
    console.log(text);

    $('.erase-'+class_name).each(function(){
      var $this = $(this);
      $this.hide();
    });

    var $map = $('#map-container');
    var $link = $('<a>', {href: external_link, target: '_blank'});

    if (class_name === 'place-overlay-rating') {
      var $span = $('<span>', {class: class_name+' erase-'+class_name});

      $span.html(text);
      $link.append($span);
    } else if (class_name === 'map-profile-img-overlay' || class_name === 'overlay-place-img') {
      var $img = $('<img>', {class: class_name+' erase-'+class_name});

      $img.attr('src', text);
      $link.append($img);
    } else {
      var $div = $('<div>', {class: class_name+' erase-'+class_name});
      
      $div.html(text);
      $link.append($div);
    } 


    $map.append($link);

    if (class_name === 'place-overlay-rating') {
      $(function() {
        $('.place-overlay-rating').stars();
      });
    }

    return false;
  }

  // $.fn extends functions unto $(..)
  $.fn.stars = function() {
    return $(this).each(function() {
      // Get the value
      var val = parseFloat($(this).html());
      // Make sure that the value is in 0 - 5 range, multiply to get width
      var size = Math.max(0, (Math.min(5, val))) * 16;
      // Create stars holder
      var $span = $('<span />').width(size);
      // Replace the numerical value with stars
      $(this).html($span);
    });
  }

  // Put a custom marker on the map
  // https://developers.google.com/maps/documentation/javascript/markers
  my.createMapMarker = function(pos_lat_lng, icon_img_src, icon_dim, marker_title, tweet) {
    var icon_width = icon_dim.width;
    var icon_height = icon_dim.height;
    var marker_icon = new google.maps.MarkerImage(icon_img_src, null, null, null, new google.maps.Size(icon_width,icon_height));
    var marker = new google.maps.Marker({
      position: pos_lat_lng,
      icon: marker_icon,
      title: marker_title,
      animation: google.maps.Animation.DROP
    });
    marker.setMap(my.map);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    addMarkerFunctionality(marker, customizeMarkerAnimation, marker_title, tweet);
    return marker;
  }

  var addMarkerFunctionality = function(marker, callback, marker_title, tweet){
    // Toggles animation
    marker.toggleBounce = function(){
      if (this.getAnimation() !== null) {
        this.setAnimation(null);
      } else {
        this.setAnimation(google.maps.Animation.BOUNCE);
      }
    }

    // Stops animation
    marker.stopAnimation = function(){
      if (this.getAnimation() !== null) {
        this.setAnimation(null);
      }
    }

    // Have the marker stop animating automatically
    marker.setAnimationTimeout = function(sec){
      var that = this;
      setTimeout(function(){
        that.stopAnimation();
      },sec*1000)
    }

    // Add a listener to marker's infowindow so that when you
    // close the infowindow, the associated marker stops its animation
    marker.infowindowClose = function(){
      var that = this; 
      google.maps.event.addListener(marker.infowindow,'closeclick',function(){
        console.log('Closed infowindow!');
        that.stopAnimation(); // referring to 'marker'
        this.state = false; // referring to 'infowindow'
      });
    }

    marker.addToggle = function(){
      marker.addListener('click', function() {
        this.toggleBounce();
        if (this.infowindow) {
          if (this.infowindow.state) { // if infowindow is currently open
            console.log('closing infowindow');
            this.infowindow.close();
            this.infowindow.state = false; // currently not open
          } else {
            console.log('opening infowindow');
            this.infowindow.open(map, this);
            this.infowindow.state = true; // currently open
          }
        }
      })
    }

    callback(marker, marker_title, tweet);
  }

  var customizeMarkerAnimation = function(marker, marker_title, tweet){

    // user geolocation
    if (marker_title === 'you' || marker_title === 'new location') { 

      marker.setAnimationTimeout(10);
      marker.addListener('click', function() {
        map.setZoom(15);
        this.toggleBounce();
      });

    // twitter / instagram
    } else if (marker_title === 'scavenged') {

      // Link to sites external to Twitter... for example, a link to an instagram photo
      var external_link = tweet.external_link;

      // Try to extract the url to an Instagram photo's url
      if (tweet.instagram_data) {
        var thumbnail_url = tweet.instagram_data.thumbnail_url;
      }

      // return an infowindow and attach to the marker
      var infowindow = my.createInfowindow(external_link, thumbnail_url, marker);

    // yelp
    } else if (marker_title === 'place') { 

      marker.setAnimationTimeout(5);
      marker.addListener('click', marker.toggleBounce);

    }
  }

  my.createInfowindow = function(external_link, thumbnail_url, marker) {
    var iwContent = '<div class="iw">'+
      '<a href="'+external_link+'" target="_blank" class="iw iw-link">'+
      '<img src="'+thumbnail_url+'" alt="'+external_link+'" class="iw iw-img">'+
      '</a>'+
      '</div>'
    var infowindow = new google.maps.InfoWindow({
      content: iwContent,
      disableAutoPan: true, // prevent map from moving around to each infowindow - spastic motion
      maxWidth: 200 // width of the card - also change .gm-style-iw width in css
    });

    // Attach to marker variable
    marker.infowindow = infowindow;
    
    // .open sets the infowindow upon the map
    marker.infowindow.open(map, marker);
    
    // About 'state':
    // true = 'I am currently open'
    // false = 'I am currently not open'
    marker.infowindow.state = true;

    // Add custom bounce / infowindow close listener to marker
    marker.addToggle();    

    // Add custom styling to the Google infowindow to differentiate our app
    google.maps.event.addListener(infowindow, 'domready', function() {

      // This is the <div> which receives the infowindow contents
      var iwOuter = $('.gm-style-iw');

      // The <div> we want to change is above the .gm-style-iw <div>
      var iwBackground = iwOuter.prev();

      // Remove the background shadow <div>
      iwBackground.children(':nth-child(2)').css({'display' : 'none'});

      // Remove the white background <div>
      iwBackground.children(':nth-child(4)').css({'display' : 'none'});

      // Move the infowindow to the right.
      // iwOuter.parent().parent().css({left: '25px'});

      // Move the shadow of the arrow 76px to the left margin 
      // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

      // Move the arrow 76px to the left margin 
      // iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

      // Change color of tail outline
      // The outline of the tail is composed of two descendants of <div> which contains the tail
      // The .find('div').children() method refers to all the <div> which are direct descendants of the previous <div>
      // iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(140, 140, 140, 0.6) 0px 1px 6px', 'z-index' : '1'});
      iwBackground.children(':nth-child(3)').find('div').children().css({
        'box-shadow': 'none !important',
        'background': 'none !important',
        'z-index' : '1'
      });

      // This <div> groups the close button elements
      var iwCloseBtn = iwOuter.next();

      iwCloseBtn.css({
        opacity: '1.0', // by default the close button has an opacity of 0.7
        position: 'absolute',
        right: '62px', top: '24px', // button repositioning
        content: 'url("../images/closebutton@2x.png")',
        height: '15px', width: '15px'
      });

      // Google API automatically applies 0.7 opacity to the button after the mouseout event.
      // This function reverses this event to the desired value.
      iwCloseBtn.mouseout(function(){
        $(this).css({opacity: '1.0'});
      });

      // Remove close button
      iwCloseBtn.css({'display': 'none'});

    });

    return infowindow;
  }
  
  return my;
}(MODULE || {}));