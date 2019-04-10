var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    util = require('gulp-util'),
    sonar = require('gulp-sonar'),
    sonarqubeScanner = require('sonarqube-scanner');


gulp.task('mocha', function() {
    return gulp.src(['test/**/*test.js'], {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .on('error', util.log)
        .pipe(sonarqubeScanner({
            serverUrl: "https://controlplane.sharedservices.${org}.${base_url}:8890",
            token: "##########",
            options: {}
          })
        );
});


// gulp.task('sonar', function () {
//     var options = {
//         sonar: {
//             host: {
//                 url: 'https://controlplane.sharedservices.${org}.${base_url}:8890'
//             },
//             jdbc: {
//                 url: 'jdbc:postgresql://########.######.eu-west-1.rds.amazonaws.com/sonar',
//                 username: 'infraxdev',
//                 password: '\######\'
//             },
//             projectKey: 'sonar:stronghold:1.0.0',
//             projectName: 'Stronghold',
//             projectVersion: '1.0.0',
//             // comma-delimited string of source directories
//             sources: './*.js',
//             language: 'js',
//             sourceEncoding: 'UTF-8',
//             javascript: {
//                 lcov: {
//                     reportPath: 'test/sonar_report/lcov.info'
//                 }
//             },
//             exec: {
//                 // All these properties will be send to the child_process.exec method (see: https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback )
//                 // Increase the amount of data allowed on stdout or stderr (if this value is exceeded then the child process is killed, and the gulp-sonar will fail).
//                 maxBuffer : 1024*1024
//             }
//         }
//     };

//     // gulp source doesn't matter, all files are referenced in options object above
//     return gulp.src('thisFileDoesNotExist.js', { read: false })
//         .pipe(sonar(options))
//         .on('error', util.log);
// });
