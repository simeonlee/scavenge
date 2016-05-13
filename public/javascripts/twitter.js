var MODULE = (function (my) {

  my.tweets = [];
  var tweetMarkers = [];
  var map = my.google_map;

  
  // search for nearby healthy eating
  my.twitterQueryTerms = [

    'instagram', // search for all instagram pics

    'paleo',
    'healthy',
    'keto',
    'ketogenic',
    'avocado',
    'juice',
    'juicepress',
    'smoothies',
    'chia',
    'salad',
    'salmon',
    'organic',
    'usdaorganic',
    'vegan',
    'raw',
    'glutenfree',
    'noGMO',
    'eatclean',
    'wholefoods',
    'kale',
    'broccoli',
    'cucumber',
    'ginger',
    'protein',
    'fiber'



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




  // display twitter query terms on DOM so user can customize search
  var listQueryTerm = function(term) { // pass place from google to this function

    var term_div = document.createElement("div");
    term_div.className = "term-div";
    
    var term_text = document.createTextNode("#"+term);
    term_text.className = "term-text";

    term_div.appendChild(term_text);




    var dislike_img = document.createElement("img");
    dislike_img.setAttribute("src", "../images/dislike.png");
    dislike_img.className = "query-dislike-img";
    dislike_img.id = term+"-dislike-img"      




    // Create <li> item to hold the <div> we just created
    var term_li = document.createElement("li");
    term_li.className = "term-li";

    term_li.appendChild(term_div);
    term_li.appendChild(dislike_img);



    // find the <ul> in the document by its identifier and add <li> to document
    var ul = document.getElementById("list-ul");
    ul.appendChild(term_li);

    

    // when you press dislike, remove from list and from my.twitterqueryterms
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
      
    }
    
  }







  function addTwitterQueryTerm(term) {
    // my.twitterQueryTerms = ['paleo', ...]; 
    my.twitterQueryTerms.push(term);



    // print for review
    console.log(my.twitterQueryTerms);
    console.log("User entered new term: "+term);
  }

  // remove from our search terms list
  function removeTwitterQueryTerm(term) {
    // my.twitterQueryTerms = ['paleo', ...];
    var termIndex = my.twitterQueryTerms.indexOf(term);
    my.twitterQueryTerms.splice(termIndex,1)

    // print for review
    console.log(my.twitterQueryTerms);
  }

  // clear all search terms for clean slate
  function removeAllTwitterQueryTerms() {
    my.twitterQueryTerms = [];
    console.log("Twitter search terms array now empty");
  }


  // set up list of query terms and prepare add/remove query term functions upon DOM load
  document.addEventListener("DOMContentLoaded", function() {
    
    for (var i = 0; i < my.twitterQueryTerms.length; i++) {
      listQueryTerm(my.twitterQueryTerms[i]);
    }



    // clear twitter search terms with one click
    document.getElementById('remove-all').onclick=function(){

      // clear list in DOM
      $("#list-ul").empty();

      // clear array
      removeAllTwitterQueryTerms();

    }

    // add query terms
    document.getElementById('query-search-bar').onkeypress = function(e) {
      if (!e) e = window.event;
      var keyCode = e.keyCode || e.which;
      if (keyCode == '13') {

        // get the value that user entered
        var new_query_term = this.value;

        // add to query terms array
        addTwitterQueryTerm(new_query_term);

        // display on DOM list
        listQueryTerm(new_query_term);
      
        return false;
      }
      
    }
    
  });







  // to set unique identities for each tweet, we'll increment 'id'
  var id = 0;

  // url of site
  // var scavengeurl = 'http://local.simeon86.com:3000'



  // $.get('http://local.simeon86.com:3000/data', {}, function(data){
  // 	console.log(data)
  // });

  // var request = new XMLHttpRequest();
  // request.open('GET', scavengeurl+'/data', true);
  // // request.open('GET', 'http://local.simeon86.com:3000/data');

  // // request.addEventListener("load", reqListener);

  // request.onload = function() {
  //   if (request.status >= 200 && request.status < 400) {
      
  //     // success
  //     var data = JSON.parse(request.responseText);

  //     // console.log(data);

  //     // extract tweets and push to my.tweets
  //     // extractTweets(data);



  //   } else {
  //     // we reached target server but it returned an error
  //   }
  // };

  // request.onerror = function() {
  //   // connection error of some sort
  // };

  // request.send();

   

  
  // currently NOT BEING CALLED - moved this functionality to the server
  my.extractTweets = function(data) {

    // show what the query was that resulted in this tweet selection
    var query = data.search_metadata.query;
    query = decodeURIComponent(query);
    console.log(query);
    
    var statuses = data.statuses;
    console.log(statuses);

    for (var i = 0; i < statuses.length; i++) {
      var status = statuses[i];

      var text = status.text;
      var coord = status.coordinates;
      var user = status.user;
      var timestamp = status.created_at;
      var tweetID = status.id_str;
      
    
      
      if (coord) {
        var ll = coord.coordinates;
        var lat = ll[1];
        var lng = ll[0];
        var latLng = {
          lat: lat,
          lng: lng
        }
      } else {
        var latLng = null;
      }

      
      


      // find the link in the text that starts with 'https://t.co/xxx'
      var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
      var regex = new RegExp(expression);
      
      if (text.match(regex)) {
        // set innerURL to that link in the text that links to some content
        var innerURL = text.match(regex);
      } else {
        var innerURL = null;
        // console.log("No match");
      }

      var indexOfInnerURL = text.indexOf(innerURL);

      // remove the inner URL from the text so we can do better things with the url
      // ideally somehow show the contents of the webpage beyond the url in the card itself...
      // for example, if it is a link to instagram just display the pic...
      text = text.slice(0,indexOfInnerURL);

      my.tweets.push({
        text: text,
        innerURL: innerURL,
        timestamp: timestamp,
        user: user,
        tweetID: tweetID,
        latLng: latLng,
        query: query
      })

    }

    // mark location of tweets
    my.markTweets(data, my.google_map);
  }









  my.markTweets = function(data, map) {
    
    // select data from twitter api
    my.tweets = data;

    var tweets = my.tweets;
  
    for (var i = 0; i < tweets.length; i++) {
      
      var tweet = tweets[i];

      var text = tweet.text;
      var external_link = tweet.external_link;

      
      // check if error occured in external_link handling - happened sometimes during development
      if (external_link && external_link.indexOf('!DOCTYPE') > -1) {
        external_link = '#'; // replace with dummy link
      }


      var user = tweet.user;
      var username = user.name;
      var handle = user.screen_name;

      var tweetID = tweet.tweetID;

      var timestamp = tweet.timestamp;
      var timeSince = calculateSince(timestamp);

      if (tweet.latLng) {
        var distance = calculateDistance(my.pos.lat, my.pos.lng, tweet.latLng.lat, tweet.latLng.lng);
      }

      var latLng = tweet.latLng;

      // try..catch used as lazy way to filter for tweets with instagram links
      // and extract instagram thumbnail
      try {
        var thumbnail_url = tweet.instagram_data.thumbnail_url;
      }
      catch(err) {
        // don't need to log since we are purposefully filtering for this anyways
        // console.log(err);
      }

      var query = tweet.query;
      var queryArr = query.split('+OR+');
      
      // extract first letter of query type for map markers
      // used in scavenge v1.0
      // var firstLetter = queryMatch(text, queryArr);
      
      // add a marker for each tweet with a geotag
      if (latLng){
        
        // create marker variable
        var marker = new google.maps.Marker({
          position: latLng,
          icon: '../images/scavengebird.png',
          animation: google.maps.Animation.DROP
        });





        // add the tweet marker to the map
        marker.setMap(map);
        // marker.setMap(null) to remove the marker


        
        // show how long ago and how far away the tweet was
        if (distance) {
          
          // mile v. miles
          if (Math.round(10*distance) === 10) {
            var distance_phrase = Math.round(10*distance)/10 + ' mile away'
          } else {
            var distance_phrase = Math.round(10*distance)/10 + ' miles away'
          }

          var time_and_distance = timeSince + ' ' + distance_phrase

        } else {
          var time_and_distance = timeSince
        }
        

        // add the marker variable to the master my.tweets array for later manipulation
        // and to keep all the data related to that specific tweet in a singular object
        my.tweets[i].marker = marker;


        // link to the tweeter's profile
        var userURL = 'https://www.twitter.com/'+handle;
        
        // direct link to the tweet
        var tweetURL = 'https://www.twitter.com/'+handle+'/status/'+tweetID;
        
        // twitter user object comes with a url to the image of the profile photo
        var profileImageURL = user.profile_image_url;

        var iwContent = '<div class="iw-container">'+
        
          // '<a href="'+userURL+'" target="_blank" >'+
          // '<img src="'+profileImageURL+'" alt="image" class="iw-profile-img">'+
          // '</a>'+

          '<div class="iw-tweet iw-external-img-div">'+
          '<a href="'+external_link+'" target="_blank" >'+ // sometimes this errors out and surrounds the image with broken stuff
          '<img src="'+thumbnail_url+'" alt="'+external_link+'" class="iw-external-img">'+
          '</a>'+
          '</div>'+

          '<div class="iw-body">'+
          '<div class="iw-username-div"><a href="'+userURL+'" target="_blank" class="iw-username">'+username+'</a></div>'+
          '<div class="iw-tweet"><a href="'+tweetURL+'" target="_blank" >'+text+'</a></div>'+
          '</div>'+

          '<p class="iw-time">'+time_and_distance+'</p>'+
          '<img src="../images/twitterbird.png" class="iw-tw-bird">'+
          '<img src="../images/instagramlogo.png" class="iw-ig-camera">'+

          // '<div class="iw-choices">'+
          
          // '<a href="#" target="_blank" >'+
          // '<div class="iw-dislike">'+
          // '<img src="../images/dislike.png" alt="dislike" class="iw-dislike-img">'+
          // '</div>'+
          // '</a>'+

          // '<a href="#" target="_blank" >'+
          // '<div class="iw-like">'+
          // '<img src="../images/heart.png" alt="like" class="iw-like-img">'+
          // '</div>'+
          // '</a>'+

          // '</div>'+

          '</div>'

        var infowindow = new google.maps.InfoWindow({
          content: iwContent,
          disableAutoPan: true, // prevent map from moving around to each infowindow - spastic motion
          maxWidth: 175 // width of the card - also change .gm-style-iw width in css
        });

        marker.infowindow = infowindow;
        marker.infowindow.open(map, marker);
        marker.infowindow.state = true; // mark state as open

        // have the markers be bouncing upon load to signal that they are ripe for discovery
        // doing some action like 'liking' them or clicking on the marker will stop the bouncing
        marker.setAnimation(google.maps.Animation.BOUNCE);
        
        // have the marker stop bouncing automatically after 10 seconds
        // too much ongoing animation can ruin UX and bother user
        // !! use 'that' = 'this' to have 'this' set to correct scope in regards to setTimeout
        // otherwise 'this' will point to global scope
        marker.stopBouncing = function(){
          var that = this;
          setTimeout(function(){
            that.setAnimation(null);
          },10000)
        }
        // marker.stopBouncing(); // chose not to call it

        // use 'this' instead of 'marker' in this function to point to the right marker
        // http://you.arenot.me/2010/06/29/google-maps-api-v3-0-multiple-markers-multiple-infowindows/
        marker.addListener('click', function() {
        
          if (this.infowindow.state) { // if infowindow is currently open
            console.log('closing infowindow');
            this.infowindow.close();
            this.infowindow.state = false; // currently not open
          } else {
            console.log('opening infowindow');
            this.infowindow.open(map, this);
            this.infowindow.state = true; // currently open

            // center the map on the marker only when you are opening it
            my.google_map.setCenter(this.getPosition());
          }

          if (this.getAnimation() !== null) {
            this.setAnimation(null);
          } else {
            this.setAnimation(google.maps.Animation.BOUNCE);
            var that = this;
            setTimeout(function(){
              that.setAnimation(null);
            },10000)
          }
          
        });

        // add tweet to left side scrolling list
        addToList(tweet);

        /*
         * The google.maps.event.addListener() event waits for
         * the creation of the infowindow HTML structure 'domready'
         * and before the opening of the infowindow defined styles
         * are applied.
         */
        google.maps.event.addListener(infowindow, 'domready', function() {

          // Reference to the DIV which receives the contents of the infowindow using jQuery
          var iwOuter = $('.gm-style-iw');

          /* The DIV we want to change is above the .gm-style-iw DIV.
           * So, we use jQuery and create a iwBackground variable,
           * and took advantage of the existing reference to .gm-style-iw for the previous DIV with .prev().
           */
          var iwBackground = iwOuter.prev();

          // Remove the background shadow DIV
          iwBackground.children(':nth-child(2)').css({'display' : 'none'});

          // Remove the white background DIV
          iwBackground.children(':nth-child(4)').css({'display' : 'none'});

          // Moves the infowindow to the right.
          // iwOuter.parent().parent().css({left: '25px'});

          // Moves the shadow of the arrow 76px to the left margin 
          // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

          // Moves the arrow 76px to the left margin 
          // iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: -25px !important;'});

          // Changes the desired color for the tail outline.
          // The outline of the tail is composed of two descendants of div which contains the tail.
          // The .find('div').children() method refers to all the div which are direct descendants of the previous div. 
          iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(140, 140, 140, 0.6) 0px 1px 6px', 'z-index' : '1'});


          // Taking advantage of the already established reference to
          // div .gm-style-iw with iwOuter variable.
          // You must set a new variable iwCloseBtn.
          // Using the .next() method of JQuery you reference the following div to .gm-style-iw.
          // Is this div that groups the close button elements.
          var iwCloseBtn = iwOuter.next();

          // Apply the desired effect to the close button
          iwCloseBtn.css({
            opacity: '1.0', // by default the close button has an opacity of 0.7
            position: 'absolute',
            right: '54px', top: '24px', // button repositioning
            content: 'url("../images/closebutton.png")',
            height: '15px', width: '15px'
          });

          // The API automatically applies 0.7 opacity to the button after the mouseout event.
          // This function reverses this event to the desired value.
          iwCloseBtn.mouseout(function(){
            $(this).css({opacity: '1.0'});
          });

          // can remove the Google Maps infowindow close button applying the following CSS rule: iwCloseBtn.css({'display': 'none'});




          // function toggleBounce() {
          //   if (this.getAnimation() != null) {
          //     this.setAnimation(null);
          //   } 
          //   else {
          //     this.setAnimation(google.maps.Animation.BOUNCE);
          //   }
          // }

          // var addMarkerEventListener = function (my) {
          // for (var i = 0; i < my.tweets.length; i++) {
          //   var marker = my.tweets[i].marker;
            

          //   // Add mouseover listener to marker for toggle bounce
          //   google.maps.event.addListener(marker, 'mouseover', function () {
          //       toggleBounce();
          //       // infowindow.open(map, marker);
          //       setTimeout(toggleBounce, 1500);
          //   });

          //   // google.maps.event.addListener(marker,'click',function());  
          
          //   }
          // }

          // setTimeout(function(){
          //   addMarkerEventListener(my);
          // },2000);

        });


    
       



      }
    }

    

    // setTimeout(function(){
    //   // document.getElementsByTagName('iw-bird').style.float='right';
    //   $('.iw-bird').css('float','right');
    //   setTimeout(function(){
    //     $('.iw-time').css('float','right');
    //   },3000);
    // },3000);
    
  }

  // // make the twitter logo bounce
  // function toggleBounce (marker) {
  //     if (marker.getAnimation() != null) {
  //         marker.setAnimation(null);
  //     } else {
  //         marker.setAnimation(google.maps.Animation.BOUNCE);
  //     }
  // }


  var queryMatch = function(text, queryArr) {
    for (var i = 0; i < queryArr.length; i++) {
      var queryWord = queryArr[i];
      if (text.toLowerCase().indexOf(queryWord) != -1) {
        return firstLetter = queryWord[0].toUpperCase();
      }
    }
  }

  
  // Calculates the Twitter time since the tweet was created   
  function calculateSince(datetime)
  {
      var tTime=new Date(datetime);
      var cTime=new Date();
      var sinceMin=Math.round((cTime-tTime)/60000);
      if(sinceMin==0)
      {
          var sinceSec=Math.round((cTime-tTime)/1000);
          if(sinceSec<10)
            var since='less than 10 seconds ago';
          else if(sinceSec<20)
            var since='less than 20 seconds ago';
          else
            var since='half a minute ago';
      }
      else if(sinceMin==1)
      {
          var sinceSec=Math.round((cTime-tTime)/1000);
          if(sinceSec==30)
            var since='half a minute ago';
          else if(sinceSec<60)
            var since='less than a minute ago';
          else
            var since='1 minute ago';
      }
      else if(sinceMin<45)
          var since=sinceMin+' minutes ago';
      else if(sinceMin>44&&sinceMin<60)
          var since='about 1 hour ago';
      else if(sinceMin<1440){
          var sinceHr=Math.round(sinceMin/60);
      if(sinceHr==1)
        var since='about 1 hour ago';
      else
        var since='about '+sinceHr+' hours ago';
      }
      else if(sinceMin>1439&&sinceMin<2880)
          var since='1 day ago';
      else
      {
          var sinceDay=Math.round(sinceMin/1440);
          var since=sinceDay+' days ago';
      }
      return since;
  };
















var calculateDistance = function(lat1, lng1, lat2, lng2, unit) {
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












  var listIndex = 0;
  var listArr = [];

  var addToList = function(tweet) { // pass place from google to this function

    var user = tweet.user;
    var profileImageURL = user.profile_image_url;
    var username = user.name;
    var handle = user.screen_name;
    var text = tweet.text;
    var external_link = tweet.external_link;
    var timestamp = tweet.timestamp;
    var timeSince = calculateSince(timestamp);
    
    var distance = calculateDistance(my.pos.lat, my.pos.lng, tweet.latLng.lat, tweet.latLng.lng);
    









    var tweetID = tweet.tweetID;
    var latLng = tweet.latLng;
    


    // link to the tweeter's profile
    var userURL = 'https://www.twitter.com/'+handle;

    // direct link to the tweet
    var tweetURL = 'https://www.twitter.com/'+handle+'/status/'+tweetID;
        
    // twitter user object comes with a url to the image of the profile photo
    var profileImageURL = user.profile_image_url;



    if (tweet.instagram_data) {
      
      var thumbnail_url = tweet.instagram_data.thumbnail_url;

      // set thumbnail image
      var tw_thumbnail_img = document.createElement('img');
      tw_thumbnail_img.className = 'tw-thumbnail-img';
      tw_thumbnail_img.setAttribute('src', thumbnail_url);

      // set profile image link wrapper to profile
      var tw_thumbnail_a = document.createElement('a');
      tw_thumbnail_a.className = 'tw-thumbnail-a';
      tw_thumbnail_a.setAttribute('href', external_link);
      tw_thumbnail_a.setAttribute('target', '_blank');
      tw_thumbnail_a.appendChild(tw_thumbnail_img);

    }




    // set profile image div
    var tw_profileimage_img = document.createElement('img');
    tw_profileimage_img.className = 'tw-profileimage-img';
    tw_profileimage_img.setAttribute('src', profileImageURL);

    // set profile image link wrapper to profile
    var tw_profileimage_a = document.createElement('a');
    tw_profileimage_a.className = 'tw-profileimage-a';
    tw_profileimage_a.setAttribute('href', userURL);
    tw_profileimage_a.setAttribute('target', '_blank');
    tw_profileimage_a.appendChild(tw_profileimage_img);

    // twitter user name link wrapper to profile
    var tw_username_a = document.createElement('a');
    tw_username_a.className = 'tw-a tw-username-a';
    tw_username_a.setAttribute('href', userURL);
    tw_username_a.setAttribute('target', '_blank');
    
    var tw_username = document.createTextNode(username);
    tw_username_a.appendChild(tw_username);

    // twitter user name div
    var tw_username_div = document.createElement("div");
    tw_username_div.className = "tw-username-div";
    tw_username_div.appendChild(tw_username_a);

    // @handle link wrapper to profile
    var tw_handle_a = document.createElement('a');
    tw_handle_a.className = 'tw-a tw-handle-a';
    tw_handle_a.setAttribute('href', userURL);
    tw_handle_a.setAttribute('target', '_blank');
    
    var tw_handle = document.createTextNode('@'+handle);
    tw_handle_a.appendChild(tw_handle);

    // @handle div
    var tw_handle_div = document.createElement("div");
    tw_handle_div.className = "tw-handle-div";
    tw_handle_div.appendChild(tw_handle_a);

    // tweet text link wrapper to tweet
    var tw_text_a = document.createElement('a');
    tw_text_a.className = 'tw-a tw-text-a';
    tw_text_a.setAttribute('href', tweetURL);
    tw_text_a.setAttribute('target', '_blank');
    
    var tw_text = document.createTextNode(text);
    tw_text_a.appendChild(tw_text);

    // tweet text div
    var tw_text_div = document.createElement("div");
    tw_text_div.className = "tw-text-div";
    tw_text_div.appendChild(tw_text_a);



    // tweet external_link link wrapper to target url
    var tw_external_link_a = document.createElement('a');
    tw_external_link_a.className = 'tw-a tw-external-link-a';
    tw_external_link_a.setAttribute('href', external_link);
    tw_external_link_a.setAttribute('target', '_blank');
    
    var tw_external_link = document.createTextNode(external_link);
    tw_external_link_a.appendChild(tw_external_link);

    // tweet external_link div
    var tw_external_link_div = document.createElement("div");
    tw_external_link_div.className = "tw-external-link-div";
    
    tw_external_link_div.appendChild(tw_external_link_a);
    
    // timesince tweet
    var tw_timesince_div = document.createElement("div");
    tw_timesince_div.className = "tw-timesince-div";
    


    var tw_twitter_bird = document.createElement('img');
    tw_twitter_bird.className = 'tw-twitter-bird';
    tw_twitter_bird.setAttribute('src', '../images/twitterbirdsmall.png');

    
    // make twitter bird appear next to timesince text
    setTimeout(function(){
      tw_timesince_div.appendChild(tw_twitter_bird);
    },500);

    // var tw_twitter_bird_div = document.createElement('div');
    // tw_twitter_bird_div.className = 'tw-twitter-bird-div';
    // tw_twitter_bird_div.appendChild(tw_twitter_bird);

    
    var tw_timesince_text = document.createElement('div');
    tw_timesince_text.className = 'tw-timesince-text';

    // show text like 'about 1 hr ago 3 mi away'
    var tw_timesince = document.createTextNode(timeSince + ' ' + Math.round(10*distance)/10 + ' mi away');
    tw_timesince_text.appendChild(tw_timesince);


    
    tw_timesince_div.appendChild(tw_timesince_text);

    var emptyheart = document.createElement('div');
    // emptyheart.setAttribute('src','../images/emptyheart.png');
    emptyheart.className = 'emptyheart';
    
    // tw_li.appendChild(tw_profileimage_a);
    
    var tw_div = document.createElement('div');
    tw_div.className = ('tw-div');
    
    if (tw_thumbnail_a) {
      tw_div.appendChild(tw_thumbnail_a);
    }


    tw_div.appendChild(tw_username_div);
    // tw_div.appendChild(tw_handle_div); // just use their screen name, no handle necessary
    tw_div.appendChild(tw_text_div);
    // tw_div.appendChild(tw_external_link_div); // don't need since the instagram photo links to the link
    tw_div.appendChild(tw_twitter_bird);
    tw_div.appendChild(tw_timesince_div);
    tw_div.appendChild(emptyheart);


    // Create <li> item to hold all the <div>'s we just created
    var tw_li = document.createElement("li");
    tw_li.className = 'tw-li';

    

    tw_li.appendChild(tw_div);

    // find the <ul> in the document by its identifier and make <li> and
    // all the <div>'s part of the document
    var ul = document.getElementById("list-ul");             
    // ul.appendChild(tw_li);

    // create virtual list of tweet divs for better manipulation and assign unique IDs
    tw_div.id = 'list-div-no-'+listIndex;
    listIndex++;
    listArr.push(tw_div);

    // document.getElementById(tw_div.id).onmousedown = function(){
    //   console.log('User clicked on tweet '+tweetID);
    //   console.log('Tweet located at ' + latLng.lat + ', ' +latLng.lng);
    //   my.google_map.setCenter(latLng);
    // };

  }









  return my;
}(MODULE || {}));