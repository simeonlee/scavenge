var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;
var Q = require('q');

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  salt: String
});

UserSchema.methods.comparePasswords = function(attempt) {
  var saved = this.password;
  return Q.promise(function(resolve, reject) {
    bcrypt.compare(attempt, saved, function(err, matched) {
      if (err) {
        reject(err);
      } else {
        resolve(matched);
      }
    })
  })
}

UserSchema.pre('save', function(next) {
  var user = this;

  // hash when password is modified or new
  if (!user.isModified('password')) {
    return next();
  }

  // generate salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      return next(err);
    }

    // hash password + salt
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) {
        return next(err);
      }

      // override plaintext password with hash
      user.password = hash;
      user.salt = salt;
      next();
    })
  })
})

module.exports = mongoose.model('users', UserSchema);

// var PUser = mongoose.model('PowerUsers', userSchema);

// // Creating one user.
// var simeon = new PUser({
//   name: {
//     first: 'Simeon',
//     last: 'Lee'
//   },
//   age: 24
// });

// simeon.save(function(err) {
//   if (err) {
//     console.log('Error on save!');
//   }
// });