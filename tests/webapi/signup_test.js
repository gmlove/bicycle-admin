process.env.ENV = 'test';

var request = require('supertest')
  , assert = require('assert')
  , app = require('../../app1');

describe('Signup API Test', function() {
  describe('GET /signup/', function() {
    it('should return json data', function(done) {
      request(app)
      .get('/webapi/signup/signup/')
      .set('Content-Type', 'application/json')
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });
  });
  describe('POST /signup/', function() {
    it('should return json data', function(done) {
      this.timeout(60000);
      request(app)
      .post('/webapi/signup/signup/')
      .send({username: 'xx', password: 'xx', email: '415890537@qq.com'})
      .expect(function(res) {
        console.log(res.body);
      })
      .expect('Content-Type', /json/)
      .expect(200, done);
    });
  });

});