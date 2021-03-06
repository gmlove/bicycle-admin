'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    name: {
      first: { type: String, default: '' },
      middle: { type: String, default: '' },
      last: { type: String, default: '' },
      full: { type: String, default: '' }
    },
    company: { type: String, default: '' },
    phone: { type: String, default: '' },
    zip: { type: String, default: '' },
    status: {
      id: { type: String, ref: 'bicycle_admin_Status' },
      name: { type: String, default: '' },
      userCreated: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_User' },
        name: { type: String, default: '' },
        time: { type: Date, default: Date.now }
      }
    },
    statusLog: [{ type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_StatusLog' }],
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_Note' }],
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'bicycle_admin_User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
    search: [String]
  });
  accountSchema.plugin(require('./plugins/pagedFind'));
  accountSchema.index({ user: 1 });
  accountSchema.index({ 'status.id': 1 });
  accountSchema.index({ search: 1 });
  accountSchema.set('autoIndex', (app.get('env') === 'development'));
  return accountSchema;
};
