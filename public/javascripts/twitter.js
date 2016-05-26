// Functionality in this script deals with user management of the Twitter query terms / parameters
// that the app.js API call will use and presentation of the returned Twitter results on the page

var MODULE = (function (my) {

  // Holds the tweets the client gets back from the server
  my.tweets = [];
  
  // Holds the markers that mark the geolocation of each tweet
  var tweetMarkers = [];

  // To set unique identities for each downloaded tweet, we'll increment 'id'
  var id = 0;

  // When the user dislikes a query term, they have the option to remove it
  // from their search parameters by pressing the 'x' button next to the term
  // When they press that 'x', the client will send a request to the server to do a new API call
  // But if they press the 'x' five times, we don't want five API calls! API calls are expensive
  // So we have a timeout for 5 seconds when they press the 'x' and we save the timeout to 'dislike_timeout'
  // And if they press a second 'x', it resets the saved timeout and starts counting to 5 again
  // (used in listQueryTerm function)
  var dislike_timeout;

  // Set up list of query terms and prepare add/remove query term functions upon DOM load
  document.addEventListener("DOMContentLoaded", function() {
    
    // Present the query terms on the page to the user
    // We have already baked in query terms in 'scavenge.js' upon initial load
    for (var i = 0; i < my.twitterQueryTerms.length; i++) {
      listQueryTerm(my.twitterQueryTerms[i], false);
    }

    // Clear Twitter search terms with one click
    document.getElementById('remove-all').onclick=function(){

      // Clear list in DOM using jQuery
      $("#list-ul").empty();

      // Call a function that clears our my.twitterQueryTerms array
      removeAllTwitterQueryTerms();

    }

    var query_search_bar = document.getElementById('query-search-bar');
    var query_add_button = document.getElementById('query-add-button');

    // Add query terms by pressing 'Enter' key while browser focus is within the search bar
    query_search_bar.onkeypress = function(e) {
      if (!e) e = window.event;
      var keyCode = e.keyCode || e.which;
      if (keyCode == '13') { 
        // 13 = Enter

        addTermAndResetSearch(query_search_bar);

        // 'return false' necessary for this onkeypress event
        return false;
      }
      
    }

    // Same functionality so that user can add query terms by pressing the blue 'plus' button
    query_add_button.onclick = function(){

      addTermAndResetSearch(query_search_bar);

    }    
    
  });


  // This function displays the twitter query terms left side of the app so user can customize search
  // The 'prepend_bool' parameter is a contextual boolean so that after the DOM is loaded for
  // the first time, whenever we add a new query term, it adds to the top of list, not bottom
  // This is so the user can see the immediate addition of their term to the list instead of having
  // to scroll down to the bottom of the list to see the impact of their addition
  var listQueryTerm = function(term, prepend_bool) { 

    // Query terms include words like 'salad', 'healthy', 'fitspo', etc.

    // Although we have a hashtag in front of the displayed query term, the API
    // doesn't just search for hashtags... it searches the entire tweet for the word
    // The hashtag is symbolic so the user immediately knows the query-ish context of the word
    var term_text = document.createTextNode("#"+term);
    term_text.className = "term-text";

    var term_div = document.createElement("div");
    term_div.className = "term-div";
    term_div.appendChild(term_text);


    // This is just a red 'x' that user can click to remove the query term from the next API call
    var dislike_img = document.createElement("img");
    dislike_img.setAttribute("src", "../images/dislike@2x.png");
    dislike_img.className = "query-dislike-img";
    dislike_img.id = term+"-dislike-img"      


    // Create <li> item to hold the <div> we just created so we can attach to the <ul> on index.html
    var term_li = document.createElement("li");
    term_li.className = "term-li";
    term_li.appendChild(term_div);
    term_li.appendChild(dislike_img);


    // Find the <ul> in the document by its identifier and add <li> to document
    var ul = document.getElementById("list-ul");
    

    // Logic dictating where in the list we should put the dom elements
    if (prepend_bool) {
      // If we are adding terms one at a time, add to top of list so
      // user can see the immediate impact of adding a term
      ul.insertBefore(term_li, ul.childNodes[0])
    } else {
      // If we are loading the list for the first time, load in order of array
      ul.appendChild(term_li);
    }


    // When you press 'dislike' (represented by 'x'), remove from list and from my.twitterQueryTerms array
    document.getElementById(term+"-dislike-img").onclick=function(){
      
      var $this = $(this);

      // find the parent list element
      var list_element = $this.parent('.term-li');

      // use jquery to find the cousin text module
      var this_search_term = list_element.children('.term-div').text();
      
      // remove '#'
      this_search_term = this_search_term.slice(this_search_term.indexOf('#')+1)

      // remove from internal query terms list
      removeTwitterQueryTerm(this_search_term);

      // hide the list element from DOM
      list_element.remove();

      console.log("Removed "+this_search_term);


      // Set a timer so that once you modify the list, we call data from Twitter API in 5 seconds
      // Also we reset the timer everytime we click an additional 'x' so that we only 
      // do one additional API call instead of an API call every time we modify the list
      if (dislike_timeout) {
        console.log('Resetting timeout!');
        clearTimeout(dislike_timeout);
      };
      
      console.log('Setting timeout!');
      dislike_timeout = setTimeout(function(){
        my.setAndSendDataToServer(my.pos, my.search_radius, my.twitterQueryTerms);
        console.log('Timeout finished! Sending data to server!');
      },5000);
      
    }
    
  }


  // Adding the query term to the list and initiate a new Twitter API call
  var addTermAndResetSearch = function(query_search_bar) {

    // Capture the value that user entered
    var new_query_term = query_search_bar.value;

    // Clear the field for the next input upon pressing 'Enter' or pressing the 'plus' button
    query_search_bar.value = '';

    // Add to my.twitterQueryTerms
    addTwitterQueryTerm(new_query_term);

    // Initiate a new request to the server to ask for data from the Twitter API with our new query set
    my.setAndSendDataToServer(my.pos, my.search_radius, my.twitterQueryTerms);

  }


  // Add the new query term that user inputted into our my.twitterQueryTerms array
  function addTwitterQueryTerm(term) {
    
    // Display on DOM list with 'prepend_bool' argument of 'true' so that
    // the new term is presented on the site at the top of the left-hand list
    // so user sees immediate addition of the new term addition, no matter how long
    // the API call takes
    listQueryTerm(term, true);

    // Add to front of array in keeping with our site presentation
    my.twitterQueryTerms.unshift(term);

    // Print for review
    console.log(my.twitterQueryTerms);
    console.log("User entered new term:  "+term);

  }


  // Remove from our search terms list
  function removeTwitterQueryTerm(term) {

    // Simple splice to remove
    var termIndex = my.twitterQueryTerms.indexOf(term);
    my.twitterQueryTerms.splice(termIndex,1)

    // Print for review
    console.log(my.twitterQueryTerms);
  }


  // Clear all search terms for clean slate
  function removeAllTwitterQueryTerms() {
    my.twitterQueryTerms = [];
    console.log("Twitter search terms array now empty");
  }

  
  // Present our tweets on the map with markers and infowindows
  my.markTweets = function(data, map) {
    
    // Twitter API data set
    my.tweets = data;
    var tweets = my.tweets;
  
    for (var i = 0; i < tweets.length; i++) {  
      var tweet = tweets[i];

      // The main text of the tweet
      var text = tweet.text;
      
      // Link to sites external to Twitter... for example, a link to an instagram photo
      var external_link = tweet.external_link;

      // Twitter user data
      var user = tweet.user;
      var username = user.name;
      var handle = user.screen_name;

      // Unique ID that Twitter assigns to each tweet
      var tweetID = tweet.tweetID;

      // Calculate the time since each tweet using our calculateSince function
      var timestamp = tweet.timestamp;
      var timeSince = my.calculateSince(timestamp);

      // If there is a geolocation associated with the tweet (usually there is for Twitter API), calculate distance
      if (tweet.latLng) {
        var distance = my.calculateDistance(my.pos.lat, my.pos.lng, tweet.latLng.lat, tweet.latLng.lng);
      }

      var latLng = tweet.latLng;

      // Try to extract the url to an Instagram photo's url
      try {
        var thumbnail_url = tweet.instagram_data.thumbnail_url;
      }
      catch(err) {

      }

      // Query metadata
      var query = tweet.query;

      // Should match my.twitterQueryTerms... I imagine this could be used for
      // security later on so that bad people aren't injecting spam results
      var queryArr = query.split('+OR+');
      
      // Add a marker for each geotagged tweet
      if (latLng){
        
        // Our pretty scavenge bird logo
        var scavenge_bird_marker_icon = new google.maps.MarkerImage("../images/scavengebird@2x.png", null, null, null, new google.maps.Size(30,30));

        // Create marker that signifies location of each tweet
        var marker = new google.maps.Marker({
          position: latLng,
          icon: scavenge_bird_marker_icon,
          animation: google.maps.Animation.DROP
        });

        // Add the tweet marker to the map
        marker.setMap(map);

        // Show how long ago and how far away the tweet was
        if (distance) {
          
          // Mile vs. Miles
          if (Math.round(10*distance) === 10) {
            var distance_phrase = Math.round(10*distance)/10 + ' mile away'
          } else {
            var distance_phrase = Math.round(10*distance)/10 + ' miles away'
          }

          var time_and_distance = timeSince + ', ' + distance_phrase

        } else {
          var time_and_distance = timeSince
        }
        
        // Add the marker variable to the master my.tweets array for later manipulation
        my.tweets[i].marker = marker;

        // Link to the tweeter's profile
        var userURL = 'https://www.twitter.com/'+handle;
        
        // Direct link to the tweet
        var tweetURL = 'https://www.twitter.com/'+handle+'/status/'+tweetID;
        
        // Twitter 'user' object comes with a url to the img of the profile photo
        var profileImageURL = user.profile_image_url;

        // This is the HTML content we will be injecting into our Google infowindow
        var iwContent = '<div class="iw-container">'+
        
          '<div class="iw-tweet iw-external-img-div">'+
          '<a href="'+external_link+'" target="_blank" >'+ // sometimes this errors out and surrounds the image with broken stuff
          '<img src="'+thumbnail_url+'" alt="'+external_link+'" class="iw-external-img">'+
          '</a>'+
          '</div>'+

          '<div class="iw-body">'+

          '<div class="iw-username-div"><a href="'+userURL+'" target="_blank" class="iw-username">'+username+'</a></div>'+
          '<div class="iw-tweet"><a href="'+tweetURL+'" target="_blank" >'+text+'</a></div>'+

          '<p class="iw-time">'+time_and_distance+'</p>'+
          '<img src="../images/instagramlogo.png" class="iw-ig-camera">'+
          '<img src="../images/twitterbird.png" class="iw-tw-bird">'+

          '</div>'+

          '</div>'

        // Create Google infowindow object
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

        // Have the markers be bouncing upon load to signal that they are pending discovery
        // Doing some action like 'liking' them or clicking on the marker will stop the bouncing
        marker.setAnimation(google.maps.Animation.BOUNCE);

        /* 
         * Use 'this' instead of 'marker' in this function to point to the right marker
         *
         * Use 'that' = 'this' to have 'this' set to correct scope in regards to setTimeout
         * Otherwise 'this' will point to global scope
         */

        // Have the marker stop bouncing automatically after 10 seconds
        // (currently not using)
        marker.setBounceTimeout = function(){
          var that = this;
          setTimeout(function(){
            that.setAnimation(null);
          },10000)
        }

        // Toggles animation
        marker.toggleBounce = function(){
          console.log('Toggling marker bounce animation!');
          if (this.getAnimation() !== null) {
            this.setAnimation(null);
          } else {
            this.setAnimation(google.maps.Animation.BOUNCE);
          }
        }

        // Stops animation
        marker.stopBounce = function(){
          console.log('Stopping marker bounce animation!');
          if (this.getAnimation() !== null) {
            this.setAnimation(null);
          }
        }

        // Add a listener to marker's infowindow so that when you
        // close the infowindow, the associated marker stops its animation
        marker.infowindowCloseClick = function(){
          var that = this; 
          google.maps.event.addListener(marker.infowindow,'closeclick',function(){
            console.log('Closed infowindow!');
            that.stopBounce(); // referring to 'marker'
            this.state = false; // referring to 'infowindow'
          });
        }

        // Add listener
        marker.infowindowCloseClick();
        
        // When you click on the marker, toggle the bounce animation on/off
        marker.addListener('click', function() {
          if (this.infowindow.state) { // if infowindow is currently open
            console.log('closing infowindow');
            this.infowindow.close();
            this.infowindow.state = false; // currently not open
          } else {
            console.log('opening infowindow');
            this.infowindow.open(map, this);
            this.infowindow.state = true; // currently open
          }
          this.toggleBounce();
        });

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
          iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(140, 140, 140, 0.6) 0px 1px 6px', 'z-index' : '1'});

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
          // iwCloseBtn.css({'display': 'none'});

        });
      }
    }
  }


  // Calculates the time since the tweet was created
  my.calculateSince = function(datetime) {
      
      var tTime = new Date(datetime);
      var cTime = new Date();
      var sinceMin = Math.round((cTime-tTime)/60000);
      
      if (sinceMin == 0) {
        var sinceSec = Math.round((cTime-tTime)/1000);
        if (sinceSec < 10) {
          var since = 'less than 10 seconds ago';
        } else if (sinceSec < 20) {
          var since = 'less than 20 seconds ago';
        } else {
          var since = 'half a minute ago';
        }
      } else if (sinceMin == 1) {
        var sinceSec = Math.round((cTime-tTime)/1000);
        if (sinceSec == 30) {
          var since = 'half a minute ago';
        } else if (sinceSec < 60) {
          var since = 'less than a minute ago';
        } else {
          var since = '1 minute ago';
        }
      } else if (sinceMin < 45) {
        var since = sinceMin + ' minutes ago';
      } else if (sinceMin > 44 && sinceMin < 60) {
        var since = 'about 1 hour ago';
      } else if (sinceMin < 1440) {
        var sinceHr = Math.round(sinceMin/60);
        if (sinceHr == 1) {
          var since = 'about 1 hour ago';
        } else {
          var since = 'about ' + sinceHr + ' hours ago';
        }
      } else if (sinceMin > 1439 && sinceMin < 2880) {
        var since = '1 day ago';
      } else {
        var sinceDay = Math.round(sinceMin/1440);
        var since = sinceDay + ' days ago';
      }
      return since;
  };


  // Calculates the distance between the user's geolocation and the tweet's geolocation
  my.calculateDistance = function(lat1, lng1, lat2, lng2, unit) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = lng1-lng2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
  }


  return my;
}(MODULE || {}));