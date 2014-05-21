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

function loginUserKey(req, res, workflowFunc) {
  var workflow = workflowFunc(req, res);
  logger.debug('loginUserKey');
}

exports.login = function(req, res, workflowFunc){
  var workflow = workflowFunc(req, res);
  logger.debug('login: ', util.inspect(req.body));

  workflow.on('validateSign', function() {
    var username = req.body.username;
    var pubkey = req.body.pubkey;
    var sign = req.body.sign;
    if(!pubkey || !sign || !check_sign(username, pubkey, sign)) {
      workflow.outcome.errors.push('sign verification failed');
      workflow.on('response');
      return;
    }
    workflow.emit('abuseFilter');
  });


  workflow.on('validate', function() {
    logger.debug('login validate');
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.emit('validateSign');
      return;
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
    var authCallback = function(err, user, info) {
      if (err) {
        logger.error('login error: ', err);
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
        if(req.body.pubkey) {
          var foundKey = false;
          for (var i = user.pubkey.length - 1; i >= 0; i--) {
            if(user.pubkey[i] ==req.body.pubkey) {
              foundKey = true;
              break;
            }
          };
          if (!foundKey) {
            workflow.outcome.errors.push('unknown pubkey');
            workflow.emit('response');
            return;
          }
        }
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
    }
    if(req.body.pubkey && !req.body.password) {
      models.User.findOne({username: req.body.username}, function(err, user) {
        authCallback(err, user);
      });
    } else {
      req._passport.instance.authenticate('local', authCallback)(req, res);
    }
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
  var authFunc = req._passport.instance.authenticate('qq', function(err, user, info) {
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
  });
  authFunc(req, res, next);
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

function check_sign(strToSign, pubkey, sign) {
  return true;
}

exports.apiLogin = function(provider, req, res, workflowFunc, next){
  logger.debug('apiLogin: provider=%s, req.body=', provider, req.body);
  var workflow = workflowFunc(req, res);
  workflow.on('validate', function() {
    var accessToken = req.body.access_token;
    var pubkey = req.body.pubkey;
    var sign = req.body.sign;
    if (!check_sign(accessToken, pubkey, sign)) {
      workflow.outcome.errors.push('sign verification failed.');
      workflow.emit('response');
      return;
    }
    if (!accessToken) {
      workflow.outcome.errors.push('no accessToken found');
      workflow.emit('response');
      return;
    }
    req._passport.instance._strategy(provider).userProfile(accessToken, function(err, profile) {
      if(err || !profile){
        logger.error('apiLogin error: ', err);
        workflow.outcome.errors.push('invalid accessToken');
        workflow.emit('response');
        return;
      }
      workflow.emit('register', profile);
    })
  });

  workflow.on('register', function(profile){
    logger.debug('register');
    var filter = {};
    filter[provider + '.id'] = profile.id
    models.User.findOne(filter, function(err, user) {
      if(err) {
        logger.error('apiLogin error: ', err);
        workflow.emit('exception', err);
        return;
      }
      if (!user) {
        workflow.emit('createUser', profile);
      } else {
        var fieldsToUpdate = {$addToSet: {pubkey: req.body.pubkey}};
        models.User.update({_id:user._id}, fieldsToUpdate, function(err) {
          if (err) {
            logger.error('apiLogin error: ', err);
            workflow.emit('exception', err);
            return;
          }
          workflow.user = user;
          workflow.emit('logUserIn', profile);
        });
      }
    })
  });

  workflow.on('createUser', function(profile) {
    logger.debug('createUser');
    var fieldsToSet = {
      isActive: 'yes',
      username: profile.id,
      nickname: profile.nickname || profile.screen_name  || profile.name,
      avatar: profile._json.figureurl_2 || profile.avatar_hd,
      search: [
        profile.nickname || profile.screen_name || profile.name
      ],
      pubkey: [
        req.body.pubkey
      ]
    };
    fieldsToSet[provider] = profile;
    logger.debug('fieldsToSet: ', fieldsToSet);

    models.User.create(fieldsToSet, function(err, user) {
      if (err) {
        logger.error('apiLogin error: ', err);
        return workflow.emit('exception', err);
      }

      workflow.user = user;
      workflow.emit('createAccount', profile);
    });
  });

  workflow.on('createAccount', function(profile) {
    logger.debug('createAccount:', profile);
    var displayName = profile.nickname || '';
    var nameParts = displayName.split(' ');
    var fieldsToSet = {
      isVerified: 'yes',
      'name.first': nameParts[0],
      'name.last': nameParts[1] || '',
      'name.full': displayName,
      user: {
        id: workflow.user._id,
        name: workflow.user.username
      },
      search: [
        nameParts[0],
        nameParts[1] || ''
      ]
    };
    models.Account.create(fieldsToSet, function(err, account) {
      if (err) {
        logger.error('apiLogin error: ', err);
        return workflow.emit('exception', err);
      }

      //update user with account
      workflow.user.roles.account = account._id;
      workflow.user.save(function(err, user) {
        if (err) {
          logger.error('apiLogin error: ', err);
          return workflow.emit('exception', err);
        }

        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    logger.debug('sendWelcomeEmail');
    var email = workflow.user.email;
    if(!email) {
      logger.info('user has no email, will not send welcome email: username=', workflow.user.username);
      workflow.emit('logUserIn');
      return;
    }
    req.app.utility.sendmail(req, res, {
      from: req.app.get('smtp-from-name') +' <'+ req.app.get('smtp-from-address') +'>',
      to: email,
      subject: 'Your '+ req.app.get('project-name') +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: workflow.user.username,
        email: email,
        loginURL: 'http://'+ req.headers.host +'/login/',
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        workflow.emit('logUserIn');
      },
      error: function(err) {
        logger.error('Error Sending Welcome Email: ', err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function() {
    logger.debug('logUserIn: ');
    req.login(workflow.user, function(err) {
      if (err) {
        logger.error('login user error: ', err);
        return workflow.emit('exception', err);
      }
      workflow.outcome.user = workflow.user;
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.apiLoginWeibo = function(req, res, workflowFunc, next){
  exports.apiLogin('sina', req, res, workflowFunc, next);
};

exports.apiLoginQQ = function(req, res, workflowFunc, next) {
  exports.apiLogin('qq', req, res, workflowFunc, next);
}


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
