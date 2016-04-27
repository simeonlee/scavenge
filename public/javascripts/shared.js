/* Modularized the javascript files to make cross-file work possible
 *
 * Resources:
 * http://stackoverflow.com/questions/8752627/how-can-i-split-a-javascript-application-into-multiple-files
 * http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
 */ 
var MODULE = (function (my) {
   

// var addInstaImgURL = function(dataJSON) {
  
//   for (var i = 0; i < dataJSON.length; i++) {

//     // extract individual tweet status object
//     var status = dataJSON.statuses[i];
    
//     // extract text of tweet including t.co url
//     var tweetText = status.text;



//     // add instagram thumbnail url to datajson object before transmittal to client
//     status.instaImgURL = returnInstaImgURL(tweetText);

//     console.log(status.instaImgURL);

//   }

//   return dataJSON;
// }




// var returnInstaImgURL = function(text) {

//     // find the link in the text that starts with 'https://t.co/xxx'
//     var expression = /https?:\/\/t\.[a-z]{2,6}\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
//     var regex = new RegExp(expression);
    
//     if (text.match(regex)) {
      
//       // set innerURL to that link in the text that links to some content
//       var innerURL = text.match(regex);
    
//       // var innerURL is now a t.co url - need to transform using ajax call to 
//       // www.linkexpander.com/?url=https://t.co/xxx to find instagram url
//       var instaURL = my.expandT_coURL(innerURL,my.extractInstaURL);
//       console.log(instaURL);

//       return instaURL;

//     } else {
      
//       var innerURL = null;
      
//       var instaURL = null;
//       return null;

//     }
    
//   }


my.expandT_coURL = function(innerURL,extractInstaURL) {
  $.ajax({
    type: 'GET',
    url: 'http://www.linkexpander.com/?url='+innerURL,
    cache: false,
    dataType: 'json',
    jsonp: false,
    success: function (data) {
      try {
        var expandedURL = data;
        console.log(expandedURL);
        var instaURL = extractInstaURL(expandedURL);
        console.log(instaURL);
        return instaURL;
      } catch (err) {
        console.log(err);
        return null;
      }
    }

  })

}




my.extractInstaURL = function(expandedURL) {
  // extract instagram pic from twitter shortlink
  $.ajax({
    type: 'GET',
    url: 'http://api.instagram.com/oembed?callback=&url='+expandedURL,
    cache: false,
    dataType: 'json',
    jsonp: false,
    success: function (data) {
      try {
          var thumbnailURL = data.thumbnail_url;
          console.log(thumbnailURL);
          return thumbnailURL;
      } catch (err) {
          console.log(err);
          return null;
      }
    }
  });
}



  return my;
}(MODULE || {}));