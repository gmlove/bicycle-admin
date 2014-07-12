var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'bower_components/bootstrap/dist/',
            src: ['js/**', 'css/**'], dest: 'public/vendor/bootstrap/'
          },
          {
            expand: true, cwd: 'bower_components/jquery/',
            src: ['jquery.js'], dest: 'public/vendor/jquery/'
          },
          {
            expand: true, cwd: 'bower_components/async/lib/',
            src: ['*.js'], dest: 'public/vendor/async/'
          },
          {
            expand: true, cwd: 'bower_components/kendo-ui/src/',
            src: [
              'js/kendo.web.js',
              'js/cultures/kendo.culture.zh.js',
              'styles/web/kendo.bootstrap.css',
              'styles/web/kendo.common-bootstrap.css',
              'styles/web/kendo.default.css',
              'styles/web/Bootstrap/**',
              'styles/web/kendo.rtl.css'
            ],
            dest: 'public/vendor/kendo-ui/'
          },
          {
            expand: true, cwd: 'bower_components/dustjs-linkedin/dist/',
            src: ['dust-*.js'], dest: 'public/vendor/dustjs-linkedin/'
          }
        ]
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'node-inspector'],
        options: {
          logConcurrentOutput: true
        }
      },
      debug: {
        tasks: ['nodemon:dev', 'node-inspector'],
        options: {
          logConcurrentOutput: true
        }
      },
      "debug-test": {
        tasks: ['nodemon:debug-test', 'node-inspector', 'watch:testsJS'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      'debug-test': {
        script: '/usr/local/lib/node_modules/mocha/bin/_mocha',
        options: {
          nodeArgs: ['--debug=31001', '--debug-brk'],
          args: ['tests/compiler_test.js'],
          watch: ['tests'],
          ext: 'js',
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
            // opens browser on initial server start
            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:31010/debug?port=31001');
              }, 1000);
            });
          }
        }
      },
      dev: {
        script: 'app.js',
        options: {
          nodeArgs: ['--debug=31001'],
          env: {
            PORT: '31000'
          },
          ignore: [
            'public/**'
          ],
          watch: ['node_modules/**/*.js', 'views/**/*.js', 'services/**/*.js', '*.js', 'models/**/*.js'],
          ext: 'js',
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
            // opens browser on initial server start
            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('open')('http://localhost:31010/debug?port=31001');
              }, 1000);
            });
            // refreshes browser when server reboots
            nodemon.on('restart', function () {
              // Delay before server listens on port
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 1000);
            });
          }
        }
      }
    },
    'node-inspector': {
      custom: {
        options: {
          'web-port': 31010,
          'web-host': 'localhost',
          'debug-port': 31001,
          'save-live-edit': true,
          'no-preload': false,
          'stack-trace-limit': 100
        }
      }
    },
    watch: {
      clientJS: {
         files: [
          'public/layouts/**/*.js', '!public/layouts/**/*.min.js',
          'public/views/**/*.js', '!public/views/**/*.min.js'
         ],
         tasks: ['newer:uglify', 'newer:jshint:client']
      },
      serverJS: {
         files: ['views/**/*.js', 'services/**/*.js', '*.js', 'models/**/*.js'],
         tasks: ['newer:jshint:server']
      },
      testsJS: {
        files: ['.rebooted'],
        options: {
          livereload: true
        }
      },
      clientLess: {
         files: [
          'public/layouts/**/*.less',
          'public/views/**/*.less',
          'public/less/**/*.less'
         ],
         tasks: ['newer:less']
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: function(filePath) {
          return filePath + '.map';
        }
      },
      layouts: {
        files: {
          'public/layouts/core.min.js': [
            'public/vendor/jquery/jquery.js',
            'public/vendor/bootstrap/js/affix.js',
            'public/vendor/bootstrap/js/alert.js',
            'public/vendor/bootstrap/js/button.js',
            'public/vendor/bootstrap/js/carousel.js',
            'public/vendor/bootstrap/js/collapse.js',
            'public/vendor/bootstrap/js/dropdown.js',
            'public/vendor/bootstrap/js/modal.js',
            'public/vendor/bootstrap/js/tooltip.js',
            'public/vendor/bootstrap/js/popover.js',
            'public/vendor/bootstrap/js/scrollspy.js',
            'public/vendor/bootstrap/js/tab.js',
            'public/vendor/bootstrap/js/transition.js',
            'public/vendor/kendo-ui/js/kendo.web.js',
            'public/vendor/kendo-ui/js/culture/kendo.culture.zh.js',
            'public/layouts/core.js'
          ]
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'public/views/',
          ext: '.min.js'
        }]
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'public/views/**/*.min.js',
            'public/views/**/*.dust.js'
          ]
        },
        src: [
          'public/layouts/**/*.js',
          'public/views/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'models/**/*.js',
          'views/**/*.js',
          'services/**/*.js',
          'webapi/**/*.js'
        ]
      }
    },
    less: {
      options: {
        compress: true
      },
      layouts: {
        files: {
          'public/layouts/core.min.css': [
            'public/less/bootstrap-build.less',
            'public/layouts/core.less'
          ],
          'public/layouts/admin.min.css': ['public/layouts/admin.less']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.less'],
          dest: 'public/views/',
          ext: '.min.css'
        }]
      }
    },
    clean: {
      js: {
        src: [
          'public/layouts/**/*.min.js',
          'public/layouts/**/*.min.js.map',
          'public/views/**/*.min.js',
          'public/views/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'public/layouts/**/*.min.css',
          'public/views/**/*.min.css'
        ]
      },
      vendor: {
        src: ['public/vendor/**']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');

  grunt.registerTask('default', ['copy:vendor', 'newer:uglify', 'newer:less', 'concurrent']);
  grunt.registerTask('build', ['copy:vendor', 'uglify', 'less']);
  grunt.registerTask('lint', ['jshint']);
};
