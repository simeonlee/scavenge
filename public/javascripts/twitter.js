var MODULE = (function (my) {

  my.tweets = [];
  var tweetMarkers = [];

  
  // to set unique identities for each tweet, we'll increment 'id'
  var id = 0;




  // $.get('http://local.simeon86.com:3000/data', {}, function(data){
  // 	console.log(data)
  // });

  var request = new XMLHttpRequest();
  request.open('GET', 'http://local.simeon86.com:3000/data', true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      
      // success
      var data = JSON.parse(request.responseText);

      console.log(data);

      // extract tweets and push to my.tweets
      extractTweets(data);



    } else {
      // we reached target server but it returned an error
    }
  };

  request.onerror = function() {
    // connection error of some sort
  };

  request.send();








  var extractTweets = function(data) {
    
    // show what the query was that resulted in this tweet selection
    var query = data.search_metadata.query;
    query = decodeURIComponent(query);
    console.log(query);
    
    var statuses = data.statuses;
    console.log(statuses);

    for (var i = 0; i < statuses.length; i++) {  
      var status = statuses[i];

      var tweet = status.text;
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

      my.tweets.push({
        tweet: tweet,
        timestamp: timestamp,
        user: user,
        tweetID: tweetID,
        latLng: latLng,
        query: query
      })
    }
  }









  my.markTweets = function(map) {
  
    var tweets = my.tweets;
  
    for (var i = 0; i < tweets.length; i++) {
      
      var tweet = tweets[i];

      var text = tweet.tweet;

      // find the link in the text that starts with 'https://t.co/xxx'
      var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
      var regex = new RegExp(expression);
      
      if (text.match(regex)) {
        // set innerURL to that link in the text that links to some content
        var innerURL = text.match(regex);
        console.log(innerURL);
      } else {
        var innerURL = null;
        console.log("No match");
      }

      var indexOfInnerURL = text.indexOf(innerURL);

      // remove the inner URL from the text so we can do better things with the url
      // ideally somehow show the contents of the webpage beyond the url in the card itself...
      // for example, if it is a link to instagram just display the pic...
      text = text.slice(0,indexOfInnerURL);
      

      var user = tweet.user;
      var username = user.name;
      var screenname = user.screen_name;

      var tweetID = tweet.tweetID;

      var timestamp = tweet.timestamp;
      var timeSince = calculateSince(timestamp);
      
      var latLng = tweet.latLng;

      var query = tweet.query;
      var queryArr = query.split('+OR+');
      var firstLetter = queryMatch(text, queryArr);
      
      // add a marker for each tweet with a geotag
      if (latLng){
        
        // create marker variable
        var marker = new google.maps.Marker({
          position: latLng,
          icon: '../images/twitterbird.png',
          // label: firstLetter, // for example, 'P' for #paleo
          animation: google.maps.Animation.DROP,
          title: 'hot tip'
        });


     
     

        // add the tweet marker to the map
        marker.setMap(map);
        // marker.setMap(null) to remove the marker



        
        

        // add the marker variable to the master my.tweets array for later manipulation
        // and to keep all the data related to that specific tweet in a singular object
        my.tweets[i].marker = marker;


        // link to the tweeter's profile
        var userURL = 'https://www.twitter.com/'+screenname;
        
        // direct link to the tweet
        var tweetURL = 'https://www.twitter.com/'+screenname+'/status/'+tweetID;
        
        // twitter user object comes with a url to the image of the profile photo
        var profileImageURL = user.profile_image_url;

        var scene1URL = '../images/scenes/scene1.png'; // change to actual related twitter pics
        var scene2URL = '../images/scenes/scene2.png';
        var scene3URL = '../images/scenes/scene3.png';
        var scene4URL = '../images/scenes/scene4.png';

        var iwContent = '<div class="iw-container">'+
        
        '<div class="iw-header">'+
        
        '<a href="'+userURL+'" target="_blank" >'+
        '<img src="'+profileImageURL+'" alt="image" class="iw-profile-img">'+
        '</a>'+

        '<div class="iw-profile-names">'+
        '<div class="iw-username-div"><a href="'+userURL+'" target="_blank" class="iw-username">'+username+'</a></div>'+
        '<div class="iw-screenname-div"><a href="'+userURL+'" target="_blank" class="iw-screenname">@'+screenname+'</a></div>'+
        '</div>'+

        '</div>'+

        '<div class="iw-body">'+
        '<div class="iw-tweet"><a href="'+tweetURL+'" target="_blank" >'+text+'</a></div>'+
        '<div class="iw-tweet iw-inner-URL"><a href="'+innerURL+'" target="_blank" >'+innerURL+'</a></div>'+
        '<p class="iw-time">'+timeSince+'</p>'+        
        '</div>'+

        '<div class="iw-body-img-container">'+
        '<img src="'+scene1URL+'" alt="image" class="iw-body-img">'+
        '<img src="'+scene2URL+'" alt="image" class="iw-body-img">'+
        '<img src="'+scene3URL+'" alt="image" class="iw-body-img">'+
        '<img src="'+scene4URL+'" alt="image" class="iw-body-img">'+
        '</div>'+

        '<div class="iw-choices">'+
        
        '<a href="#" target="_blank" >'+
        '<div class="iw-dislike">'+
        '<img src="../images/dislike.png" alt="dislike" class="iw-dislike-img">'+
        '</div>'+
        '</a>'+

        '<a href="#" target="_blank" >'+
        '<div class="iw-like">'+
        '<img src="../images/heart.png" alt="like" class="iw-like-img">'+
        '</div>'+
        '</a>'+

        '</div>'+

        // '<div class="iw-bottom-gradient"></div>'+

        '</div>'

        var infowindow = new google.maps.InfoWindow({
          content: iwContent,
          maxWidth: 175 // width of the card - also change .gm-style-iw width in css
        });

        // marker.addListener('mouseover', function() {  
          // infowindow.open(map, marker);
        // });

        // setTimeout(function(){
          infowindow.open(map, marker);
        // },500);
        


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

          // Moves the infowindow 115px to the right.
          // iwOuter.parent().parent().css({left: '115px'});

          // Moves the shadow of the arrow 76px to the left margin 
          // iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 76px !important;'});

          // Moves the arrow 76px to the left margin 
          // iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;'});

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
            right: '58px', top: '22px', // button repositioning
            // border: '1px solid rgba(0, 172, 237, 0.6)', // increasing button border and new color
            'border-radius': '13px', // circular effect
            // 'box-shadow': '0 0 5px #3990B9' // 3D effect to highlight the button
            // 'background-color': 'rgba(0, 172, 237, 0.6)'

            'content': 'url("../images/closesymbol.png")',
            'height': '15px',
            'width': '15px'
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

    console.log(my.tweets);

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








  return my;
}(MODULE || {}));