'use strict';

exports = module.exports = function(app, mongoose) {
  var statusLogSchema = new mongoose.Schema({
    id: { type: String, ref: 'bicycle_admin_Status' },
    name: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  return statusLogSchema;
};
