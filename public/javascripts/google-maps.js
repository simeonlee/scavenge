/* Modularized the javascript files to make cross-file work possible
 *
 * Resources:
 * http://stackoverflow.com/questions/8752627/how-can-i-split-a-javascript-application-into-multiple-files
 * http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
 */ 
var MODULE = (function (my) {

  // url of site
  // var scavengeurl = 'http://local.simeon86.com:3000'
  var scavengeurl = 'https://infinite-inlet-93119.herokuapp.com/'
  

  // google map
  var map;

  // user position
  var pos;

  my.twitterQueryTerms = ['paleo','healthy','keto','ketogenic','avocado','juice','chia','salad'];

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




  // load upon HTML loaded
  document.addEventListener("DOMContentLoaded", function() {
    
    setUpGoogleMap();
    
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

    console.log('in initmap');

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

      // change the style of the map to futuristic white
      styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
    
    });

    // set the map as a property of my to make it and its functions accessible to other scripts
    my.google_map = map;

    // to demonstrate that we can access our Google Maps functions in the Twitter API script file
    // my.loadMapIntoTwitterAPIScript();

    // assess user position
    initGeolocate(map);

    setTimeout(function(){
      // searchPlaces();
    },4000);
    
    // add results to list
    // initAutocomplete(map);

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

    var infowindow = new google.maps.InfoWindow({map: map});

    console.log('in initgeolocate');

    // Try HTML5 geolocation
    if (navigator.geolocation) {
      
      navigator.geolocation.getCurrentPosition(function(position) {        
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        console.log('Client communicating ' + pos.lat + ', ' + pos.lng);

        // set infowindow
        // infowindow.setPosition(pos);
        // infowindow.setContent('Here you are - time to scavenge!');
        // setTimeout(function(){
        //   infowindow.close();
        // }, 10000);
        
        // mark user location - 'the nest'
        var marker = new google.maps.Marker({
          position: pos,
          icon: '../images/homeicon.png',
          animation: google.maps.Animation.DROP,
          title: 'you'
        });



        marker.setMap(map);

        marker.addListener('click', function() {
          
          // reset the zoom to starting 16
          map.setZoom(16);

          // set the position to be center of map
          map.setCenter(marker.getPosition());

          // bounce (on/off)
          if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          }
        });


        var clientToServer = {
          pos: pos,
          twitterQueryTerms: my.twitterQueryTerms
        };

        // type of data to emit
        var mygeo = 'my geolocation';

        // call function to emit geolocation data to server
        socketEmit(mygeo, clientToServer);

        // set map to center on position
        map.setCenter(pos);

      }, function() {

        handleLocationError(true, infowindow, map.getCenter());
        console.log('error');

      });

    } else {

      // Browser doesn't support Geolocation
      handleLocationError(false, infowindow, map.getCenter());

    }

  };



  var socketEmit = function(type, data) {
    var socket = io.connect(scavengeurl);
    
    // socket prefers json over objects
    var jsonData = JSON.stringify(data);
    socket.emit(type, jsonData);
  };





 




  function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos);
    infowindow.setContent(browserHasGeolocation ?
      'The Geolocation service failed.' :
      'Your browser doesn\'t support geolocation.');
  }


  // Search returns places and predicted search terms
  function initAutocomplete(map) {

    // create the search box and link it to the UI element
    // want to make auto-search upon page load
    input = document.getElementById('nav-search-bar');
    searchBox = new google.maps.places.SearchBox(input);

    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // this previously pushed the search bar into the Google Maps pane...
    // I've left this here so I can delve later into how the controls work

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

  
    
  var socket = io.connect(scavengeurl);
  socket.on('retrieved tweets', function (data) {
    console.log(data);
    my.extractTweets(data);
    // mark locations of tweets
    // my.markTweets(map);
  });

  // socket.on('test emit', function(data) {
  //   console.log(data);
  // });


  return my;
}(MODULE || {}));