'use strict';

var models = require('bicycle').models[require('../../config').appName];
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var util = require('util');
var bicycle = require('bicycle');
var fs = require('fs');
var path = require('path');

var emailTextTpl = fs.readFileSync(path.join(__dirname, 'email-text.tpl'));
var emailHtmlTpl = fs.readFileSync(path.join(__dirname, 'email-html.tpl'));

exports.signup = function(req, res, workflowFunc){
  var workflow = workflowFunc(req, res);
  logger.debug('signup: ', util.inspect(req.body));

  workflow.on('validate', function() {
    logger.debug('validate signup info');
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }

    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    logger.debug('duplicate username check');
    models.User.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    logger.debug('duplicate email check');
    models.User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    logger.debug('create user');
    models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = {
        isActive: 'yes',
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        password: hash,
        search: [
          req.body.username,
          req.body.email
        ]
      };
      models.User.create(fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.user = user;
        workflow.emit('createAccount');
      });
    });
  });

  workflow.on('createAccount', function() {
    logger.debug('create account');
    var fieldsToSet = {
      isVerified: req.app.get('require-account-verification') ? 'no' : 'yes',
      'name.full': workflow.user.username,
      user: {
        id: workflow.user._id,
        name: workflow.user.username
      },
      search: [
        workflow.user.username
      ]
    };

    models.Account.create(fieldsToSet, function(err, account) {
      if (err) {
        return workflow.emit('exception', err);
      }

      //update user with account
      workflow.user.roles.account = account._id;
      workflow.user.save(function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    logger.debug('send welcome email');
    bicycle.utility.sendmail(req, res, {
      from: bicycle.get('smtp').from.name +' <'+ bicycle.get('smtp').from.address +'>',
      to: req.body.email,
      subject: 'Your '+ bicycle.get('projectName') +' Account',
      textTpl: emailTextTpl,
      htmlTpl: emailHtmlTpl,
      locals: {
        username: req.body.username,
        email: req.body.email,
        loginURL: 'http://'+ req.headers.host +'/login/',
        projectName: bicycle.get('projectName')
      },
      success: function(message) {
        logger.info('send welcome email success.');
      },
      error: function(err) {
        console.log('Error Sending Welcome Email: '+ err);
      }
    });
    workflow.emit('logUserIn');
  });

  workflow.on('logUserIn', function() {
    logger.debug('log user in');
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.signupTwitter = function(req, res, next) {
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    models.User.findOne({ 'twitter.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Twitter account.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
    });
  })(req, res, next);
};

exports.signupGitHub = function(req, res, next) {
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    models.User.findOne({ 'github.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your GitHub account.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
    });
  })(req, res, next);
};

exports.signupFacebook = function(req, res, next) {
  req._passport.instance.authenticate('facebook', { callbackURL: '/signup/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    models.User.findOne({ 'facebook.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Facebook account.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
    });
  })(req, res, next);
};

exports.signupGoogle = function(req, res, next) {
  req._passport.instance.authenticate('google', { callbackURL: '/signup/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    models.User.findOne({ 'google.id': info.profile._json.id }, function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Google account.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key'),
          oauthGoogle: !!req.app.get('google-oauth-key')
        });
      }
    });
  })(req, res, next);
};

exports.signupSocial = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    workflow.username = req.session.socialProfile.username || req.session.socialProfile.id;
    if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
      workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    }

    models.User.findOne({ username: workflow.username }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.username = workflow.username + req.session.socialProfile.id;
      }
      else {
        workflow.username = workflow.username;
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    models.User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    var fieldsToSet = {
      isActive: 'yes',
      username: workflow.username,
      email: req.body.email.toLowerCase(),
      search: [
        workflow.username,
        req.body.email
      ]
    };
    fieldsToSet[req.session.socialProfile.provider] = req.session.socialProfile._json;

    models.User.create(fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.user = user;
      workflow.emit('createAccount');
    });
  });

  workflow.on('createAccount', function() {
    var displayName = req.session.socialProfile.displayName || '';
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
        return workflow.emit('exception', err);
      }

      //update user with account
      workflow.user.roles.account = account._id;
      workflow.user.save(function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    req.app.utility.sendmail(req, res, {
      from: req.app.get('smtp-from-name') +' <'+ req.app.get('smtp-from-address') +'>',
      to: req.body.email,
      subject: 'Your '+ req.app.get('project-name') +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: workflow.user.username,
        email: req.body.email,
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
    req.login(workflow.user, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }

      delete req.session.socialProfile;
      workflow.outcome.defaultReturnUrl = workflow.user.defaultReturnUrl();
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};