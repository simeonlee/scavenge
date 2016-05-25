var MODULE = (function (my) {

	// initialize grid with jquery
	$('.grid').masonry({
	  // set itemSelector so .grid-sizer is not used in layout
    itemSelector: '.grid-item',
	  // use element for option
	  columnWidth: '.grid-sizer',
	  percentPosition: true
	})

  var image_arr = [];

	// Display images in grid form (will also use masonry)
	my.showImagesOnGrid = function(data) {

    var index = 0;

		var tweets = data;

		tweets.forEach(function(tweet){
			// var tweet = tweets[index];

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

        // Link to the tweeter's profile
        var userURL = 'https://www.twitter.com/'+handle;
        
        // Direct link to the tweet
        var tweetURL = 'https://www.twitter.com/'+handle+'/status/'+tweetID;
        
        // Twitter 'user' object comes with a url to the img of the profile photo
        var profileImageURL = user.profile_image_url;


        var grid_item_id = 'grid-item-'+index;
        var grid_image_id = 'grid-image-'+index;

				var $grid_item = $('<div>', {id: 'grid_item_id', class: 'grid-item'});
				var $image_link = $('<a>', {href: external_link, target: '_blank'});
        var $image = $('<div>', {id: 'grid_image_id', class: 'grid-image'});

        image_arr.push($image);
        
				$image_link.append($image);
				$grid_item.append($image_link);
				$('.grid').append($grid_item);
        
        $image.css({
          'width': '100%',
          'height': '100%',
          'background': 'url("' + thumbnail_url + '") 100% 100% no-repeat',
          'background-position': 'center center',
          'background-size': 'cover'
        });
        
        // size height to match width
        var image_width = $image.width();
        $image.css({'height': image_width+'px'});



        // set center of map on coordinates of image
        $grid_item.mouseover(function(event){
          my.google_map.setCenter(latLng);
        })




        index++;

        // var iwContent = '<div class="iw-container">'+
        
        //   '<div class="iw-tweet iw-external-img-div">'+
        //   '<a href="'+external_link+'" target="_blank" >'+ // sometimes this errors out and surrounds the image with broken stuff
        //   '<img src="'+thumbnail_url+'" alt="'+external_link+'" class="iw-external-img">'+
        //   '</a>'+
        //   '</div>'+

        //   '<div class="iw-body">'+
        //   '<div class="iw-username-div"><a href="'+userURL+'" target="_blank" class="iw-username">'+username+'</a></div>'+
        //   '<div class="iw-tweet"><a href="'+tweetURL+'" target="_blank" >'+text+'</a></div>'+
        //   '</div>'+

        //   '<p class="iw-time">'+time_and_distance+'</p>'+
        //   '<img src="../images/instagramlogo.png" class="iw-ig-camera">'+
        //   '<img src="../images/twitterbird.png" class="iw-tw-bird">'+

        //   '</div>'
      }
		});
	}

  my.clearGrid = function() {
    $('.grid').empty();
  }

  window.onresize = function() {
    // resize grid image heights upon window resize
    $('.grid-image').each(function(){
      var image_width = $(this).width();
      $(this).css({'height': image_width+'px'});
    })

    // keep the map centered upon window resize
    my.google_map.setCenter(my.pos);
  }

  return my;
}(MODULE || {}));