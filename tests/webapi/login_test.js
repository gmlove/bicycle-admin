process.env.ENV = 'test';

var request = require('supertest')
  , assert = require('assert')
  , app = require('../../app1');

var models = require('bicycle').models[require('../../config').appName];
var basePath = '/webapi/';

// must use signup test to create a user first.

describe('Login API Test', function(done) {

  before(function(done) {
    this.timeout(120000);
    models.User.remove({}, function(err) {
      if (err) done(err);
      models.Account.remove({}, function(err) {
        models.LoginAttempt.remove({}, done);
      });
    });
  });

  describe('Signup user', function () {
    it('should signup a user', function(done) {
      this.timeout(60000);
      //signup
      request(app)
      .post(basePath + 'signup/signup/')
      .send({username: 'xx', password: 'xx', email: '415890537@qq.com'})
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    })
  });

  describe('GET /login/', function() {
    it('should return json data', function(done) {
      request(app)
      .get(basePath + 'login/login/')
      .set('Content-Type', 'application/json')
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });
  });

  describe('POST /login/', function() {
    it('should return json data', function(done) {
      this.timeout(60000);
      request(app)
      .post(basePath + 'login/login/')
      .send({username: 'xx', password: 'xx'})
      .expect(function(res) {
        console.log(res.body);
        if(!res.body.data.success) {
          done(new Error('should login success.'));
        }
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });
    it('should return json data', function(done) {
      this.timeout(60000);
      request(app)
      .post(basePath + 'login/login/')
      .send({username: '415890537@qq.com', password: 'xx'})
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });
  });

  describe('forgot reset.json reset', function() {
    var token = null;
    it('should send email and return json data', function(done) {
      this.timeout(60000);
      request(app)
      .post(basePath + 'login/forgot/')
      .send({email: '415890537@qq.com'})
      .expect(function(res) {
        console.log(res.body);
        token = res.body.data.token;
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });

    it('should return json data', function(done) {
      this.timeout(60000);
      request(app)
      .get(basePath + 'login/reset.json')
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });

    it('should reset user password', function(done) {
      models.User.findOne({email: '415890537@qq.com'}, function(err, user) {
        if (err) done(err);
        var data = {
          password: 'xx1',
          confirm: 'xx1'
        };
        request(app)
        .post(basePath + 'login/reset/415890537@qq.com/' + token + '/')
        .send(data)
        .expect(function(res) {
          console.log(res.body);
        })
        .expect('Content-Type', /json/)
        .expect(200, done);
      })
    });

    it('should login failed', function(done) {
      this.timeout(60000);
      request(app)
      .post(basePath + 'login/login/')
      .send({username: '415890537@qq.com', password: 'xx'})
      .expect(function(res) {
        console.log(res.body);
        if(res.body.data.success) {
          done(new Error('should fail to login'));
        }
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });

    it('should login success', function(done) {
      this.timeout(60000);
      request(app)
      .post(basePath + 'login/login/')
      .send({username: '415890537@qq.com', password: 'xx1'})
      .expect(function(res) {
        console.log(res.body);
        if(!res.body.data.success) {
          done(new Error('should login success'));
        }
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });

  });

});