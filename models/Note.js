'use strict';

exports = module.exports = function(app, mongoose) {
  var noteSchema = new mongoose.Schema({
    data: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  return noteSchema;
};
