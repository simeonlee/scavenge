'use strict';

var assert = require('assert');
var reverse = require('../src/reverse');

describe('reverse url shortener', function() {
    it('should return the original url', function(done) {
        reverse('http://ow.ly/W7oOu', function(err, url) {
            if (err) {
                throw new Error(err);
            }

            assert.equal(url, 'http://bjarneo.codes/');

            done();
        });
    });

    it('should work with https also', function(done) {
        reverse('https://bit.ly/1QRMTvp', function(err, url) {
            if (err) {
                throw new Error(err);
            }

            assert.equal(url, 'http://bjarneo.codes/');

            done();
        });
    });

    it('should return an error since the url is not shortened', function(done) {
        reverse('http://bjarneo.codes/', function(err, url) {
            if (err) {
                throw new Error(err);
            }

            // redirects to https
            assert.equal(url, 'https://bjarneo.codes/');

            done();
        });
    });
});
