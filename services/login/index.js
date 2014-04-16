'use strict';

var models = require('bicycle').models[require('../../config').appName];
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var util = require('util');
var bicycle = require('bicycle');
var loginAttempts = bicycle.get('loginAttempts');

var fs = require('fs');
var path = require('path');

var emailTextTpl = fs.readFileSync(path.join(__dirname, 'email-text.tpl'));
var emailHtmlTpl = fs.readFileSync(path.join(__dirname, 'email-html.tpl'));


var getReturnUrl = function(req) {
  var returnUrl = req.user.defaultReturnUrl();
  if (req.session.returnUrl) {
    returnUrl = req.session.returnUrl;
    delete req.session.returnUrl;
  }
  return returnUrl;
};

exports.login = function(req, res, workflowFunc){
  var workflow = workflowFunc(req, res);
  logger.debug('login: ', util.inspect(req.body));

  workflow.on('validate', function() {
    logger.debug('login validate');
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('abuseFilter');
  });

  workflow.on('abuseFilter', function() {
    logger.debug('login abuse filter');
    var getIpCount = function(done) {
      var conditions = { ip: req.ip };
      models.LoginAttempt.count(conditions, function(err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var getIpUserCount = function(done) {
      var conditions = { ip: req.ip, user: req.body.username };
      models.LoginAttempt.count(conditions, function(err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var asyncFinally = function(err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (results.ip >= loginAttempts.forIp || results.ipUser >= loginAttempts.forIpAndUser) {
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      }
      else {
        workflow.emit('attemptLogin');
      }
    };

    require('async').parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
  });

  workflow.on('attemptLogin', function() {
    logger.debug('login attempt login');
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        var fieldsToSet = { ip: req.ip, user: req.body.username };
        models.LoginAttempt.create(fieldsToSet, function(err, doc) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.errors.push('Username / email and password combination not found or your account is inactive.');
          return workflow.emit('response');
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }
          workflow.outcome.user = {
            id: user.id,
            nickname: user.nickname,
            username: user.username,
            avatar: user.avatar
          };
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.loginTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'twitter.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Twitter account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'github.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your GitHub account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'facebook.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Facebook account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGoogle = function(req, res, next){
  req._passport.instance.authenticate('google', { callbackURL: '/login/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'google.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Google account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};


exports.loginQQ = function(req, res, workflowFunc, next){
  var workflow = workflowFunc(req, res);
  req._passport.instance.authenticate('qq', { callbackURL: '/login/qq/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      workflow.outcome.errors.push('Failed to login.');
      workflow.emit('response');
      return;
    }

    req.app.db.models.User.findOne({ 'qq.id': info.profile.id }, function(err, user) {
      if (err) {
        workflow.outcome.errors.push('Failed to find user.');
        workflow.emit('response');
        return;
      }

      if (!user) {
        // auto registrition
      }

      // auto login
      req.login(user, function(err) {
        if (err) {
          return next(err);
        }

        res.redirect(getReturnUrl(req));
      });

    });
  })(req, res, next);
};

exports.loginWeibo = function(req, res, workflowFunc, next){
  var workflow = workflowFunc(req, res);
  req._passport.instance.authenticate('sina', { callbackURL: '/login/qq/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      workflow.outcome.errors.push('Failed to login.');
      workflow.emit('response');
      return;
    }

    req.app.db.models.User.findOne({ 'sina.uid': info.profile.uid }, function(err, user) {
      if (err) {
        workflow.outcome.errors.push('Failed to find user.');
        workflow.emit('response');
        return;
      }

      if (!user) {
        // auto registrition
      }

      // auto login
      req.login(user, function(err) {
        if (err) {
          return next(err);
        }

        res.redirect(getReturnUrl(req));
      });

    });
  })(req, res, next);
};

exports.forgot = function(req, res, workflowFunc, next){
  var workflow = workflowFunc(req, res);

  workflow.on('validate', function() {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
      return workflow.emit('response');
    }

    workflow.emit('generateToken');
  });

  workflow.on('generateToken', function() {
    var crypto = require('crypto');
    crypto.randomBytes(21, function(err, buf) {
      if (err) {
        return next(err);
      }

      var token = buf.toString('hex');
      models.User.encryptPassword(token, function(err, hash) {
        if (err) {
          return next(err);
        }

        workflow.emit('patchUser', token, hash);
      });
    });
  });

  workflow.on('patchUser', function(token, hash) {
    var conditions = { email: req.body.email.toLowerCase() };
    var fieldsToSet = {
      resetPasswordToken: hash,
      resetPasswordExpires: Date.now() + 10000000
    };
    models.User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        return workflow.emit('response');
      }

      workflow.emit('sendEmail', token, user);
    });
  });

  workflow.on('sendEmail', function(token, user) {
    bicycle.utility.sendmail(req, res, {
      from: bicycle.get('smtp').from.name +' <'+ bicycle.get('smtp').from.address +'>',
      to: user.email,
      subject: 'Reset your '+ bicycle.get('projectName') +' password',
      textTpl: emailTextTpl,
      htmlTpl: emailHtmlTpl,
      locals: {
        username: user.username,
        //TODO: need to design a web page to reset user password.
        resetLink: req.protocol +'://'+ req.headers.host +'/views/login/reset.html?email='+ user.email +'&token='+ token +'',
        projectName: bicycle.get('projectName')
      },
      success: function(message) {
        if(process.env.ENV == 'test') {
          workflow.outcome.token = token;
        }
        workflow.emit('response');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending: '+ err);
        workflow.emit('response');
      }
    });
  });

  workflow.emit('validate');
};

exports.reset = function(req, res, workflowFunc){
  var workflow = workflowFunc(req, res);
  logger.debug('reset user password request: body=%s, params=%s',
    util.inspect(req.body), util.inspect(req.params));

  workflow.on('validate', function() {
    logger.debug('validate password');
    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (!req.body.confirm) {
      workflow.outcome.errfor.confirm = 'required';
    }

    if (req.body.password !== req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('findUser');
  });

  workflow.on('findUser', function() {
    logger.debug('find user to reset password');
    var conditions = {
      email: req.params.email,
      resetPasswordExpires: { $gt: Date.now() }
    };
    models.User.findOne(conditions, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Invalid request.');
        return workflow.emit('response');
      }

      models.User.validatePassword(req.params.token, user.resetPasswordToken, function(err, isValid) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (!isValid) {
          workflow.outcome.errors.push('Invalid request.');
          return workflow.emit('response');
        }

        workflow.emit('patchUser', user);
      });
    });
  });

  workflow.on('patchUser', function(user) {
    logger.debug('patch user password');
    models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = { password: hash, resetPasswordToken: '' };
      models.User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};
