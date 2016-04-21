/* Modularized the javascript files to make cross-file work possible
 *
 * Resources:
 * http://stackoverflow.com/questions/8752627/how-can-i-split-a-javascript-application-into-multiple-files
 * http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
 */ 
var MODULE = (function (my) {
   
	var socket = io.connect('http://local.simeon86.com:3000');
	socket.on('news', function (data) {
	   	console.log(data);
	});
	setTimeout(function(){
   		socket.emit('my geolocation', my.pos);
   	},5000);

  return my;
}(MODULE || {}));