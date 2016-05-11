/* Modularized the javascript files to make cross-file work possible
 *
 * Resources:
 * http://stackoverflow.com/questions/8752627/how-can-i-split-a-javascript-application-into-multiple-files
 * http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
 */ 
var MODULE = (function (my) {

  // set up socket
  var socket = io.connect(scavengeurl);

  var client_to_server;

  // url of site
  // var scavengeurl = 'http://local.simeon86.com:3000'
  var scavengeurl = 'https://infinite-inlet-93119.herokuapp.com/'

  // google map
  var map;

  // user position
  // var pos;

  // set to Washington Square Park... familiar restaurants for debugging
  var defaultLocation = {
    lat: 40.7308,
    lng: -73.9973
  }

  // we increment index to create unique identifiers for each place found
  var index = 0;

  // this will be the input 'restaurants' for google maps search
  var input;
  
  // google maps search box
  var searchBox;

  // put restaurant markers here
  var markers = [];

  // socket used to communicate back and forth with server
  var socket = io.connect(scavengeurl);  
  
  // get the tweets from the server as soon as they are retrieved by the
  // server from twitter API
  // socket.on('retrieved tweets', function (data) {
  
  //   console.log(data);

  // });

  // get the tweets from the server after some operations have been completed
  // including getting direct link to instagram photo and getting expanded url
  socket.on('scavenge_tweets', function(data) {

    console.log("'scavenge_tweets' socket is on")

    // data that contains instagram data
    console.log(my.tweets);

    // start displaying data that we received from server on our google map
    my.markTweets(data, map);

  })

  // load upon HTML loaded
  document.addEventListener("DOMContentLoaded", function() {
    
    // map
    setUpGoogleMap();

    // initiate walkthrough
    (function() {
      console.log('initiating walkthrough')
    })();
    
  });



  // called upon document load, allows access to Google API
  var setUpGoogleMap = function() {

    var script = document.createElement('script');
    
    script.type = 'text/javascript';

    // use MODULE instead of my because this is called from the HTML file    
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyATcsse4YhlcyBbTMIaPHmpZ-6M6rAdtxc&libraries=places&callback=MODULE%2EinitMap'; 

    document.body.appendChild(script);

  }



  var searchPlaces = function() {
  
    // set google maps search to restaurants
    input.value = 'restaurants'; 
    
    // focus on the google maps search input box
    google.maps.event.trigger(input, 'focus'); 
    
    // programatically press enter to auto search a few secs after load
    google.maps.event.trigger(input, 'keydown', {
        keyCode: 13
    });

  };




  
  my.initMap = function() {

    console.log('In my.initMap function');

    // need to add my. to initMap() to have it accessible by the callback function in the url
    // of setUpGoogleMap() which calls the my.initMap method from the document body

    map = new google.maps.Map(document.getElementById('map'), {

      // make center the default location until the geolocate finishes finding you
      center: defaultLocation,
      
      // neighborhood view
      zoom: 16,
      
      // don't show the ui controls
      disableDefaultUI: true,
      
      // no terrain view or satellite view
      mapTypeId: google.maps.MapTypeId.ROADMAP,

      // change the style of the map to futuristic white (thanks to snazzymaps)
      styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
    
    });

    // set the map as a property of my to make it and its functions accessible to other scripts
    my.google_map = map;

    // add capabilities to map
    addMapListeners(map);

    // to demonstrate that we can access our Google Maps functions in the Twitter API script file
    // my.loadMapIntoTwitterAPIScript();

    // assess user position
    initGeolocate(map);

    
    
    
    /*
     * Set up google maps place autocomplete to search for new locations to scavenge
     * https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
     */

    var input = document.getElementById('google-search-bar');
    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function() {
      
      var place = autocomplete.getPlace();

      // place hopefully has geometry-related information
      // geometry-related info includes location (lat,lng) and preferred viewport on map
      // viewport specified as two lat,lng values defining southwest and northeast corner of
      // viewport bounding box - frames the result(s)

      // geocoding is process of converting addresses into geographic coordinates

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

      // marker.setIcon(/** @type {google.maps.Icon} */({
      //   url: place.icon,
      //   size: new google.maps.Size(71, 71),
      //   origin: new google.maps.Point(0, 0),
      //   anchor: new google.maps.Point(17, 34),
      //   scaledSize: new google.maps.Size(35, 35)
      // }));
      // marker.setPosition(place.geometry.location);
      // marker.setVisible(true);

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }

      console.log(address);


      // var new_location_lat = place.geometry.location.lat;
      // var new_location_lng = place.geometry.location.lng;
      // var new_location = {
      //   lat: new_location_lat,
      //   lng: new_location_lng
      // }
      var new_location = place.geometry.location;
      console.log(new_location);

      // we are saving new location to my.pos variable to persist user's desired gelocation
      my.pos = new_location;

      // mark new location
      var marker = new google.maps.Marker({
        position: new_location,
        icon: '../images/newlocation.png',
        animation: google.maps.Animation.DROP,
        title: 'new location'
      });

      // set marker on map
      marker.setMap(map);

      // make the marker bounce upon load
      marker.setAnimation(google.maps.Animation.BOUNCE);

      // Have the marker stop bouncing after 10 seconds
      setTimeout(function(){
        marker.setAnimation(null);
      },10000)

      marker.addListener('click', function() {
        
        // reset the zoom to starting 16
        map.setZoom(16);

        // bounce (on/off)
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      });

      // attach user geolocation data and twitter query terms to a data object
      // that we will send to the server to make API calls with based on user context
      setAndSendDataToServer(new_location, my.twitterQueryTerms);

      // infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
      // infowindow.open(map, marker);
    });






    map.addListener('click', function(event) { // event is object containing information regarding click
      // moveCenter(event.latLng, map);
      map.panTo(event.latLng);
    });
    
  }





  function moveCenter(latLng, map) {
    // createMarker(latLng, map, "Moved your nest here");
    // map.panTo(latLng);
  }



  // function createMarker(latLng, map, markerTitle) {

  //   var contentString = '<div id="content">'+
  //     '<h1>Restaurant Name</h1>'+
  //     '<div>'+
  //     '<p>Insert details of the place here</p>'+
  //     '<p>Source: blah blah</p>'+
  //     '</div>'+
  //     '</div>';

  //   var infowindow = new google.maps.InfoWindow({
  //     content: contentString,
  //     maxWidth: 200
  //   });

  //   var marker = new google.maps.Marker({
  //     position: latLng, // change to map.center or something later
  //     map: map,
  //     title: markerTitle
  //   });
    
  //   marker.addListener('click', function() {
  //     infowindow.open(map, marker);
  //   });
    
  // }



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
        
        // mark user location - 'the nest'
        var marker = new google.maps.Marker({
          position: pos,
          icon: '../images/homeicon.png',
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

          // set the position to be center of map
          // map.setCenter(marker.getPosition());

          // bounce (on/off)
          if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          }
        });

        // attach user geolocation data and twitter query terms to a data object
        // that we will send to the server to make API calls with based on user context
        setAndSendDataToServer(pos, my.twitterQueryTerms);

        // set map to center on position
        map.setCenter(pos);

      }, function() {

        alert('Geolocation failed');

      });

    } else {

      alert('Your browser doesn\'t support geolocation');

    }

  };


  var setAndSendDataToServer = function(pos, queryterms) {

    // set up object with the relevant data that we need to send to server
    // to ask API's to search for data
    client_to_server = {
      pos: pos,
      twitterQueryTerms: queryterms
    };

    // socket prefers json over objects
    var jsonData = JSON.stringify(client_to_server);

    

    // send data to server
    socket.emit('my geolocation', jsonData);

  }



  // if you click the search button, scavenge for more tweets in your current location
  document.addEventListener('DOMContentLoaded', function(event) {
    console.log('DOM fully loaded and parsed');
    document.getElementById('nav-search-button').onclick = function(){
      setAndSendDataToServer(my.pos, my.twitterQueryTerms);
    }
  });




  // Location search bar returns places and predicted search terms
  // Supported by Google Places Autocomplete
  
  // Ultimately want to return a location, convert to latLng,
  // then move map and have new twitter api call with new location

  function initAutocomplete(map) {

    // create the search box and link it to the UI element
    // want to make auto-search upon page load
    input = document.getElementById('google-search-bar');
    searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    
    searchBox.addListener('places_changed', function() {
      
      // google search for restaurants
      var places = searchBox.getPlaces();

      console.log(places);

      if (places.length == 0) {
        return;
      }

      // clear out old markers
      markers.forEach(function(marker) {
        // remove a marker
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();

      places.forEach(function(place) {
        
        // var icon = {
        //   url: place.icon, // design and insert scavenge logo url here
        //   size: new google.maps.Size(71, 71),
        //   origin: new google.maps.Point(0, 0),
        //   anchor: new google.maps.Point(17, 34), // perhaps make 0,0 once you design new logo        
        //   scaledSize: new google.maps.Size(25, 25)
        // };

        // for each place, call addToList to present them on the left side of the page
        addToList(place);


        // begin marker creation process

        // Create a marker for each place.
        var marker = new google.maps.Marker({
          map: map,
          icon: '../images/restaurant.png',
          animation: google.maps.Animation.DROP,
          title: place.name,
          position: place.geometry.location
        });

        var address = place.formatted_address;
        var comma = address.indexOf(",");
        var add = address.substring(0, comma);
        
        
        var arr = [];

        arr.push(place.types[0]);
        for (var i = 1; i < place.types.length; i++) {
          var type = ", "+place.types[i];
          arr.push(type);
        }
        var types = arr.join('');

        var contentString = '<div id="content">'+
          '<h3>'+place.name+'</h3>'+
          '<div>'+
          '<p>'+add+'</p>'+
          '<p>'+types+'</p>'+
          '</div>'+
          '</div>';
      
        var infowindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 200
        });

        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });

        markers.push(marker);

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }

        index++; // this global index increments so I can set unique id's for each place

      });

      // add empty cells to list for spacing
      // addEmptyLi();

      // automatically zooms out the map to show all the places found
      // map.fitBounds(bounds);

    });
  }

  
  // var addEmptyLi = function() { // change this into a loading cell
  //   // add empty cell to list for spacing purposes
  //   var ul = document.getElementById("list-ul");
  //   var empty_li = document.createElement("li");
  //   empty_li.className = 'empty-li';

  //   // set the height of the last cell to a bigger width to clear the bottom scroll gradient
  //   var vph = $(window).height()*0.45;
  //   setTimeout(function(){
  //     $('.empty-li').css({'height':vph+'px'});
  //   }, 1000);
  //   ul.appendChild(empty_li);
  // }





  // Take places from Google Maps and insert into list using DOM manipulation
  // to do: Add NUMBER OF RATINGS as well... just as important as the rating itself
  // MAKE A PLAN FOR UNDEFINED RATINGS... can solve with if statement later
  var addToList = function(place) { // pass place from google to this function

    // get price level data from google
    var dollars = place.price_level;
    
    // create container for the dollars signifying price level
    var dollar_container = document.createElement('div');
    dollar_container.className = 'dollar-container'; // for css
    
    // add a dollar sign for each price level
    for (var i = 0; i < dollars; i++) {
      var dollar = document.createTextNode('$');
      dollar_container.appendChild(dollar);
    }




    // first part of this function focuses on the first div in each list item
    // which is the rating of the place (out of five stars)

    // create outer span which will always hold five grey stars
    // (secretly one grey star with repeating background for 5 stars' pixels width)
    var outer_span = document.createElement("span");

    // outer span uses class since they will all look the same
    outer_span.className = "outer-span";

    // Create inner span for custom yellow stars
    var inner_span = document.createElement("span");
    
    /* we will create unique id for each inner span because need to set a custom
     * width of the span with the repeating background of yellow stars to only cover
     * up the span with five grey stars to a certain length and without jquery we used
     * document.getElementById which requires a unique id
     *
     * formula below creates unique ID like inner-span-0, inner-span-1, etc.
     */
    var id = "inner-span-" + index.toString(); // 
    inner_span.id = id;

    // make the inner span with yellow stars the child of the outer span with grey stars
    // (so that the inner span is nested in the outer span and they occupy the same space)
    outer_span.appendChild(inner_span);

    // Create <div> to hold all the stars
    var rating_div = document.createElement("div");
    rating_div.className = "rating-div";

    rating_div.appendChild(outer_span);







    // now we create the div that simply shows the places' NAME
    var name_div = document.createElement("div");
    name_div.className = "name-div";
    
    var name = document.createTextNode(place.name);
    
    name_div.appendChild(name);





    var address = place.formatted_address;
    var comma = address.indexOf(",");
    var add = address.substring(0, comma);
    

    var add_div = document.createElement("div");
    add_div.className = "add-div";

    var addNode = document.createTextNode(add);

    add_div.appendChild(addNode);




    // Create <li> item to hold all the <div>'s we just created
    var place_li = document.createElement("li");
    place_li.appendChild(rating_div);
    place_li.appendChild(dollar_container);
    place_li.appendChild(name_div);
    place_li.appendChild(add_div);

    place_li.className = 'place-li';

    // find the <ul> in the document by its identifier and make <li> and
    // all the <div>'s part of the document
    var ul = document.getElementById("list-ul");             
    ul.appendChild(place_li);



    // Now we can alter width of span holding the yellow stars because it is part of
    // the document, so we can manipulate it with document.getElementById.style.width=?px

    // ensure rating is a float
    var val = parseFloat(place.rating); 
    
    // ensure rating is between 0 and 5 and multiply by the width of the star.png
    var size = Math.max(0, (Math.min(5, val))) * 16; 

    // wasted two hours until I figured out... add +"px" to the end!!
    document.getElementById(id).style.width=size+"px";
  
  }






  var addMapListeners = function(map) {



    // when you move the map viewport, do something
    // in this case, we want to enable the user to 'scavenge' even easier
    // by bringing up new tweets / pictures just by moving the map around
    map.addListener('bounds_changed', function() {
      
      console.log('bounds changed');

    })

    map.addListener('zoom_changed', function() {

      console.log('zoom changed');
      
      // var that = this;

      // // reset map zoom
      // setTimeout(function(){
      //   that.setZoom(16);
      // },10000)
      

      // var zoom_window = document.getElementById()
      // zoom_window.setContent('Zoom: ' + map.getZoom());

    });

  }














  return my;
}(MODULE || {}));