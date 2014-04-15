'use strict';

var resp = require('./response');

function onresponseDefault() {
  this.outcome.success = !this.hasErrors();
  resp.sendResult(this.outcome, this.res);
}


exports = module.exports = function(onresponse) {
  return function(req, res) {
    var workflow = new (require('events').EventEmitter)();
    workflow.req = req;
    workflow.res = res;

    workflow.outcome = {
      success: false,
      errors: [],
      errfor: {}
    };

    workflow.hasErrors = function() {
      return Object.keys(workflow.outcome.errfor).length !== 0 || workflow.outcome.errors.length !== 0;
    };
    workflow.on('exception', function(err) {
      workflow.outcome.errors.push('Exception: '+ err);
      return workflow.emit('response');
    });

    if(!onresponse) {
      onresponse = onresponseDefault;
    }
    workflow.on('response', onresponse.bind(workflow));

    return workflow;
  }
};
