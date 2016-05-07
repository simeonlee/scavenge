'use strict';

var reverse = require('./reverse');

if (!process.argv[2]) {
    return false;
}

reverse(process.argv[2], function(err, url) {
    if (err) {
        console.log(err);

        process.exit(1);
    }

    console.log('>> %s is %s', process.argv[2], url);
});
