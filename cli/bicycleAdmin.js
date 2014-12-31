#!/usr/bin/env node

var logger = console;
var async = require('async');
var program = require('commander');
var version = require('../config').version;
var util = require('util');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

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

program.command('createapp')
    .description('create an application with bicycle admin supported.')
    .option('-p, --path <directory_path>', 'path to your project root directory')
    .option('-n, --name <project_name>', 'name of your project.')
    .action(function(opts){
        createapp(opts.directory_path, opts.project_name);
    });

program.command('*')
    .action(function() {
        console.log(COMMAND_ERROR);
    });

program.parse(process.argv);



function initdb() {
    var app = require(process.cwd() + '/app');
    var bicycle = require('bicycle').bicycle;
    var models = bicycle.models[require('../config').appName];

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
    var app = require(process.cwd() + '/app');
    var bicycle = require('bicycle').bicycle;
    var models = bicycle.models[require('../config').appName];

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
            models.Admin.findOne({'name.full':'Root Admin', groups:{$in:['root']}}, '_id', cb);
        },
        function(admin, cb) {
            if(!admin) {
                logger.error('no admin role found, you should do initdb first.');
                return cb(new error('no adin role found'));
            }
            user.roles.admin = admin._id;
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

function createapp(projPath, projName) {
    if(!projPath) {
        projPath = './';
    }
    if(!projName) {
        projName = 'bicycle-demo';
    }
    var templPath = path.join(__dirname, 'templates/proj-templ');
    var templProjName = 'proj-templ';
    var projPath = path.join(projPath, projName);
    copy(templPath, projPath, [[templProjName, projName]]);
}

function filterContent (content, replaces) {
    for (var i = 0; i < replaces.length; i++) {
        content = content.replace(new RegExp(replaces[i][0], "g"), replaces[i][1]);
    }
    return content;
}

/**
 * Copy template files to project.
 *
 * @param {String} origin
 * @param {String} target
 * @param {String} replaces
 */
function copy(origin, target, replaces) {
  if(!fs.existsSync(origin)) {
    abort(origin + 'does not exist.');
  }
  if(!fs.existsSync(target)) {
    mkdir(target);
    console.log('   create : ' + target);
  }
  fs.readdir(origin, function(err, datalist) {
    if(err) {
      abort(FILEREAD_ERROR);
    }
    for(var i = 0; i < datalist.length; i++) {
      var oCurrent = path.resolve(origin, datalist[i]);
      var tCurrent = path.resolve(target, datalist[i]);
      if(fs.statSync(oCurrent).isFile()) {
        fs.writeFileSync(tCurrent, filterContent(fs.readFileSync(oCurrent, '') + '', replaces), '');
        console.log('   create : ' + tCurrent);
      } else if(fs.statSync(oCurrent).isDirectory()) {
        copy(oCurrent, tCurrent, replaces);
      }
    }
  });
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if(err) {
      throw err;
    }
    console.log('   create : ' + path);
    if(typeof fn === 'function') {
      fn();
    }
  });
}

