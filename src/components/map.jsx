import React from 'react';
import mapStyle from '../styles/light-map';
// import io from 'socket.io';

// DON'T FORGET TO RUN 'NPM RUN DEV'

const instagram_logo_path = '../images/instagramlogo.png';
const twitter_logo_path = '../images/twitterbird.png';

export default class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previousUserLocation: {lat:0,lng:0},
      userMarker: null,
      tweets: [],
      tweetMarkers: []
    }
    this.socket = io.connect('https://www.scavenge.io');
    // this.socket = io.connect('127.0.0.1:8080');

  }

  setCenter() {
    this.map && this.map.setCenter(this.props.userLocation);
  }

  addUserMarker() {
    // Create marker for user position
    var position = {
      lat: this.props.userLocation.lat,
      lng: this.props.userLocation.lng
    };
    var icon_img_src = require('../images/homeicon@2x.png');
    var icon_dim = {
      width: 55,
      height: 62
    }
    var marker_title = 'you';
    this.createMapMarker(position, icon_img_src, icon_dim, marker_title);
  }

  componentDidUpdate() {
    if (this.props.userLocation !== this.state.previousUserLocation) {
      console.log('previousUserLocation',this.props.previousUserLocation);
      console.log('userLocation',this.props.userLocation);
      this.setCenter();
      this.addUserMarker();
    }
    // update our previous state for current state
    this.state.previousUserLocation = this.props.userLocation;
  }

  componentWillMount() {
    this.socket.on('userLocationServerConfirmation', function(data) {
      console.log(data);
    });
    // this.socket.on('newTweets', function(data) {
    this.socket.on('newTweet', (tweet) => {
      console.log('We have received some tweets from the server');
      console.log(tweet);
      // this.handleTweets(data);
      // this.setState({ tweets: data });
      this.addTweetMarkerToMap(tweet);
    });
    // After we have sent our parameters to app.js, the server will make a Twitter API Call
    // and return tweets and related data to the client via socket below
    // this.geolocate();
  }

  componentDidMount() {
    this.initializeMap();
  }

  handleTweets(data) {
    // Start displaying data that we received from server on our map
    this.addTweetMarkerToMap();
    // this.addToGrid(data);
  }

  addTweetMarkerToMap(tweet) {
    var latLng = tweet.latLng;
    if (latLng){
      var icon_img_src = '../images/scavengebird@2x.png';
      var icon_dim = {
        width: 30,
        height: 30
      }
      var marker_title = 'scavenged';
      var marker = this.createMapMarker(latLng, icon_img_src, icon_dim, marker_title, tweet);
    }
  }

  initializeMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {

      // Make map center the default location until the geolocation function finishes finding user
      center: this.props.userLocation,
      
      // Zoom the map to neighborhood level of detail
      zoom: 15,
      
      // No terrain view or satellite view
      mapTypeId: google.maps.MapTypeId.ROADMAP,

      // Change the style of the map to light / dark
      styles: mapStyle,

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

    // Set up Google Places API autocomplete to search for new locations to get more content
    // https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete
    var input = document.getElementById('google-search');
    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bias results to the bounds of the viewport
    autocomplete.bindTo('bounds', this.map);

    // Do the following when the place value is changed...
    autocomplete.addListener('place_changed', function() {
      
      var place = autocomplete.getPlace();

      // 'place' hopefully has geometry-related information
      // Geometry-related info includes location (lat,lng) and preferred viewport on map
      // Viewport specified as two lat,lng values defining southwest and
      // northeast corner of viewport bounding box - frames the result(s)

      // Geocoding is process of converting addresses into geographic coordinates

      // if (!place.geometry) {
        // window.alert("Autocomplete's returned place contains no geometry");
        // return;
      // }

      // If the place has a geometry, then present it on a map.
      // if (place.geometry.viewport) {

      //   map.fitBounds(place.geometry.viewport);

      // } else {

      this.map.setCenter(place.geometry.location);
      this.map.setZoom(15);

      // }

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
      this.createMapMarker(new_location, icon_img_src, icon_dim, marker_title);

      // console.log(new_location);
      
      // save new_location to my.pos variable to persist user's new location across files
      // my.pos = new_location;

      // Attach user geolocation data and twitter query terms to a data object
      // that we will send to the server to make API calls with based on user context
      // my.setAndSendDataToServer(new_location, search_radius, my.twitterQueryTerms);
      // need to update app.jsx with new location
      this.props.setAndSendDataToServer(place.geometry.location);
  

    }.bind(this));
  }

 

  createMapMarker(pos_lat_lng, icon_img_src, icon_dim, marker_title, tweet) {
    var icon_width = icon_dim.width;
    var icon_height = icon_dim.height;
    var marker_icon = new google.maps.MarkerImage(icon_img_src, null, null, null, new google.maps.Size(icon_width,icon_height));
    var marker = new google.maps.Marker({
      position: pos_lat_lng,
      icon: marker_icon,
      title: marker_title,
      animation: google.maps.Animation.DROP
    });
    marker.setMap(this.map);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this.addMarkerFunctionality(marker, this.customizeMarkerAnimation.bind(this), marker_title, tweet);
    return marker;
  }

  addMarkerFunctionality(marker, callback, marker_title, tweet) {
    // Toggles animation
    marker.toggleBounce = function(){
      if (this.getAnimation() !== null) {
        this.setAnimation(null);
      } else {
        this.setAnimation(google.maps.Animation.BOUNCE);
      }
    }

    // Stops animation
    marker.stopAnimation = function() {
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

  customizeMarkerAnimation(marker, marker_title, tweet) {

    // user geolocation
    if (marker_title === 'you' || marker_title === 'new location') { 

      marker.setAnimationTimeout(10);
      marker.addListener('click', function() {
        this.map.setZoom(15);
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
      var infowindow = this.createInfowindow(external_link, thumbnail_url, marker);

    // yelp
    } else if (marker_title === 'place') { 

      marker.setAnimationTimeout(5);
      marker.addListener('click', marker.toggleBounce);

    }
  }

  createInfowindow(external_link, thumbnail_url, marker) {
    var iwContent = '<div class="iw">'+
      '<a href="'+external_link+'" target="_blank">'+
      '<img src="'+thumbnail_url+'" alt="'+external_link+'" class="iw">'+
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
      iwBackground.children(':nth-child(1)').css({'display': 'none'});

      // Move the arrow 76px to the left margin 
      // iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

      // Change color of tail outline
      // The outline of the tail is composed of two descendants of <div> which contains the tail
      // The .find('div').children() method refers to all the <div> which are direct descendants of the previous <div>
      iwBackground.children(':nth-child(3)').find('div').children().css({'display': 'none'});
      // iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(140, 140, 140, 0.6) 0px 1px 6px', 'z-index' : '1'});
      // iwBackground.children(':nth-child(3)').find('div').children().css({
      //   'box-shadow': 'none !important',
      //   'background': 'none !important',
      //   'z-index' : '1'
      // });

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

  render() {
    return (
  	  <div id="map">
  	    <div>Google Map</div>
  	  </div>
  	);
  }
}