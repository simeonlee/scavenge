// Functionality in this script deals with user management of the Twitter query terms / parameters
// that the app.js API call will use and presentation of the returned Twitter results on the page

var MODULE = (function (my) {

  // Holds the tweets the client gets back from the server
  my.tweets = [];
  
  // Holds the markers that mark the geolocation of each tweet
  var tweetMarkers = [];

  // To set unique identities for each downloaded tweet, we'll increment 'id'
  var id = 0;

  var instagram_logo_path = '../images/instagramlogo.png';
  var twitter_logo_path = '../images/twitterbird.png';

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
      $('#list-ul').empty();

      // put cursor automatically in query search bar so you can start adding new terms immediately
      $('#query-search-bar').focus();

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
    // query_add_button.onclick = function(){

    //   addTermAndResetSearch(query_search_bar);

    // }
    
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
    dislike_img.id = term+"-dislike-img";


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
    console.log(data);
    my.tweets = data;
    for (var i = 0; i < my.tweets.length; i++) {
      (function(i){
        var tweet = my.tweets[i];
        var latLng = tweet.latLng;
        if (latLng){
          var icon_img_src = '../images/scavengebird@2x.png';
          var icon_dim = {
            width: 30,
            height: 30
          }
          var marker_title = 'scavenged';
          var marker = my.createMapMarker(latLng, icon_img_src, icon_dim, marker_title, tweet);

          // Add the marker variable to the master my.tweets array for later manipulation
          my.tweets[i].marker = marker;
        }
      })(i);
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








  /*// The main text of the tweet
  var text = tweet.text;

  // Twitter user data
  var user = tweet.user;
  var username = user.name;
  var handle = user.screen_name;

  // Unique ID that Twitter assigns to each tweet
  var tweetID = tweet.tweetID;

  // Calculate the time since each tweet using our calculateSince function
  var timestamp = tweet.timestamp;
  var timeSince = my.calculateSince(timestamp);

  // Query metadata
  var query = tweet.query;

  // Should match my.twitterQueryTerms... I imagine this could be used for
  // security later on so that bad people aren't injecting spam results
  var queryArr = query.split('+OR+');*/









  return my;
}(MODULE || {}));