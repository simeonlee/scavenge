// Authentication stuffs for Twitter and Yelp API
var oauthSignature = require('oauth-signature');
var n = require('nonce')();
var request = require('request');
var qs = require('querystring');
var _ = require('lodash');

/* 
 * -------------
 * Yelp API call
 * -------------
 * set_parameters: object with params to search
 * callback: callback(error, response, body)
 */

var yelpCallback = function(error, response, body) {
  var yelp_response_data = JSON.parse(body);
  io.sockets.emit('yelp_response_data', yelp_response_data);
}

var requestYelp = function(set_parameters, pos, callback) {

  /* The type of request */
  var httpMethod = 'GET';

  /* The url we are using for the request */
  var url = 'http://api.yelp.com/v2/search';

  var lat = pos.lat;
  var lng = pos.lng;
  var yelpLatLng = lat+','+lng;

  /* We can setup default parameters here */
  var default_parameters = {
    ll: yelpLatLng,
    sort: '1' // 0=Best matched (default), 1=Distance, 2=Highest Rated
  };

  /* We set the require parameters here */
  var required_parameters = {
    oauth_consumer_key : process.env.YELP_CONSUMERKEY,
    oauth_token : process.env.YELP_TOKEN,
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  /* We combine all the parameters in order of importance */ 
  var parameters = _.assign(default_parameters, set_parameters, required_parameters);

  /* We set our secrets here */
  var consumerSecret = process.env.YELP_CONSUMERSECRET;
  var tokenSecret = process.env.YELP_TOKENSECRET;

  /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
  /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
  var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});

  /* We add the signature to the list of paramters */
  parameters.oauth_signature = signature;

  /* Then we turn the paramters object, to a query string */
  var paramURL = qs.stringify(parameters);

  /* Add the query string to the url */
  var apiURL = url+'?'+paramURL;

  /* Then we use request to send make the API Request */
  request(apiURL, function(error, response, body){
    return callback(error, response, body);
  });

};