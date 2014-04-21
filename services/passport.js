'use strict';

var userservice = require('bicycle').models['bicycle-admin'].User;
var util = require('util');
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);


exports = module.exports = function(app, passport) {
  var config = app.bicycle.config;
  var LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  GitHubStrategy = require('passport-github').Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  qqStrategy = require('passport-qq').Strategy,
  weiboStrategy = require('passport-sina').Strategy;

  passport.use(new LocalStrategy(
    function(username, password, done) {
      var conditions = { isActive: 'yes' };
      if (username.indexOf('@') === -1) {
        conditions.username = username;
      }
      else {
        conditions.email = username;
      }
      logger.debug('find user: ', util.inspect(conditions));
      userservice.findOne(conditions, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }

        userservice.validatePassword(password, user.password, function(err, isValid) {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            return done(null, false, { message: 'Invalid password' });
          }

          return done(null, user);
        });
      });
    }
    ));

  if (config.oauth.twitter && config.oauth.twitter.key) {
    passport.use(new TwitterStrategy({
      consumerKey: config.oauth.twitter.key,
      consumerSecret: config.oauth.twitter.secret
    },
    function(token, tokenSecret, profile, done) {
      done(null, false, {
        token: token,
        tokenSecret: tokenSecret,
        profile: profile
      });
    }
    ));
  }

  if (config.oauth.github && config.oauth.github.key) {
    passport.use(new GitHubStrategy({
      clientID: config.oauth.github.key,
      clientSecret: config.oauth.github.secret,
      customHeaders: { "User-Agent": config.projectName }
    },
    function(accessToken, refreshToken, profile, done) {
      done(null, false, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
      });
    }
    ));
  }

  if (config.oauth.facebook && config.oauth.facebook.key) {
    passport.use(new FacebookStrategy({
      clientID: config.oauth.facebook.key,
      clientSecret: config.oauth.facebook.secret
    },
    function(accessToken, refreshToken, profile, done) {
      done(null, false, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
      });
    }
    ));
  }

  if (config.oauth.google && config.oauth.google.key) {
    passport.use(new GoogleStrategy({
      clientID: config.oauth.google.key,
      clientSecret: config.oauth.google.secret
    },
    function(accessToken, refreshToken, profile, done) {
      done(null, false, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
      });
    }
    ));
  }

  if (config.oauth.qq && config.oauth.qq.key) {
    passport.use(new qqStrategy({
        clientID: config.oauth.qq.key,
        clientSecret: config.oauth.qq.secret
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (config.oauth.weibo && config.oauth.weibo.key) {
    passport.use(new weiboStrategy({
        clientID: config.oauth.weibo.key,
        clientSecret: config.oauth.weibo.secret
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    userservice.findOne({ _id: id }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (user.roles && user.roles.admin) {
        user.roles.admin.populate("groups", function(err, admin) {
          done(err, user);
        });
      }
      else {
        done(err, user);
      }
    });
  });
};
