'use strict';

var url = require('url');
var http = require('http');
var https = require('https');
var objToStr = Object.prototype.toString;

module.exports = function reverseUrlShortener(shortenedUrl, callback) {
    if (objToStr.call(shortenedUrl) !== '[object String]') {
        throw new TypeError('URL is not set or is not a string.');
    }

    if (objToStr.call(callback) !== '[object Function]') {
        throw new TypeError('Callback is not set or is not a function.');
    }

    function getHeaderLocation(res) {
        if (res.headers && res.headers.location && res.statusCode === 301) {
            return callback(null, res.headers.location);
        }

        return callback('Couldn\'t reverse the url');
    }

    function onError(error) {
        return callback(error);
    }

    var req;
    if (url.parse(shortenedUrl).protocol === 'https:') {
        req = https.get(shortenedUrl, getHeaderLocation).on('error', onError);
    } else {
        req = http.get(shortenedUrl, getHeaderLocation).on('error', onError);
    }

    req.end();
};
