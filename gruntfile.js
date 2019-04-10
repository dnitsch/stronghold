module.exports = function(grunt) {

  grunt.config.set('mochaTest', {
      test: {
          options: {
              timeout:           6000,
              reporter:          'mocha-sonarqube-reporter',
              //reporter:          'spec',
              quiet:             false,
              clearRequireCache: true
          },
          src:     ["test/*.test.js"]
      }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
};
