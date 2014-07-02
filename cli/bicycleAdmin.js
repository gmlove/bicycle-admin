var app = require('../app');
var bicycle = require('bicycle').bicycle;
var models = bicycle.models[require('../config').appName];
var logger = require('bicycle/logger').getLogger('crawler', __filename);
var async = require('async');
var program = require('commander');
var version = require('../config').version;
var util = require('util');

var COMMAND_ERROR = 'Illegal command format. Use `bicycleAdmin --help` to get more info.\n'.red;

program.version(version);

program.command('initdb')
    .description('init database')
    .action(function() {
        initdb();
    });

program.command('createsuperuser')
    .description('create an admin user, db must be init first.')
    .option('-u, --username <username>', 'user name')
    .option('-p, --password <password>', 'password')
    .option('-e, --email <email>', 'email')
    .action(function(opts){
        createsuperuser(opts.username, opts.password, opts.email);
    });

program.command('*')
    .action(function() {
        console.log(COMMAND_ERROR);
    });

program.parse(process.argv);


function initdb() {
    var admingroup = {
        _id: 'root',
        name: 'Root',
    };
    var admin = {
        name: {first: 'Root', last: 'Admin', full: 'Root Admin'},
        groups: ['root']
    };
    async.waterfall([
        function(cb) {
            models.AdminGroup.findById('root', cb);
        },
        function(_admingroup, cb) {
            if(!_admingroup) {
                return models.AdminGroup.create(admingroup, cb);
            }
            return cb(null, _admingroup);
        },
        function(admingroup, cb) {
            models.Admin.findOne({'name.full':'Root Admin', groups:{$in:['root']}}, cb);
        },
        function(_admin, cb) {
            if(!_admin) {
                return models.Admin.create(admin, cb);
            }
            return cb(null, _admin);
        }
    ], function(err, user) {
        if(err) {
            logger.error('error occured: ', err);
            process.exit(1);
        } else {
            logger.info('initdb success.');
            process.exit(0);
        }
    });
}


function createsuperuser(username, password, email) {
    var user = {
        username: username,
        password: password,
        isActive: 'yes',
        email: email,
        roles: {admin: null},
        isActive: 'yes',
        search: [
          username,
          email
        ]
    };
    async.waterfall([
        function(cb) {
            models.Admin.find({'name.full':'Root Admin', groups:{$in:['root']}}, '_id', cb);
        },
        function(admin, cb) {
            if(!admin) {
                logger.error('no admin role found, you should do initdb first.');
                return cb(new error('no adin role found'));
            }
            user.roles.admin = admin.id;
            models.User.encryptPassword(user.password, cb);
        },
        function(hash, cb) {
            user.password = hash;
            models.User.create(user, cb);
        }
    ], function(err, user) {
        if(err) {
            logger.error('error occured: ', err);
            process.exit(1);
            return;
        }
        logger.info('user created.');
        process.exit(0);
    });
}




