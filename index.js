'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

/*
 Load filenames of types from component.json with base path
 */
function loadFilenamesFromComponent (component, types, base) {
    var files = [];
    // Iterate over all given file types (e.g. scripts, styles)
    for (var t in types) {
        var type = types[t];
        // Check if file type exists in component config
        if (component[type]) {
            // Iterate over all files in type
            for (var f in component[type]) {
                var filename = component[type][f];
                // Add full path of file to array
                files.push( path.join(base, filename) );
            }
        }
    }
    return files;
}

module.exports = function (options) {
    if (typeof options !== 'object') {
        options = {};
    }
    if (!options.types) {
        options.types = ['scripts', 'styles'];
    }

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-component-loader', 'Streaming not supported'));
            return cb();
        }

        try {
            var componentConfig = JSON.parse(file.contents.toString());
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-component-loader', err));
        }

        // load files by type from component.json
        var componentSources = loadFilenamesFromComponent(componentConfig, options.types, file.base);
        var originalStream = this;

        if (componentSources.length > 0) {
            // create new pipe with sources
            gulp.src(componentSources)
                .pipe(through.obj(function (file2, enc2, cb2) {
                    // set base to component base
                    file2.base = file.base;
                    // pipe sources into original stream
                    originalStream.push(file2);
                    cb2();
                }).on('data', function (data) {
                    // call original callback on end
                })
                .on('end', function () {
                    // call original callback on end
                    cb();
                }))
                ;
        } else {
            cb();
        }

    });
};