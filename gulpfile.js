const {src, dest, series} = require("gulp");
const zip = require("gulp-zip");
const modifyFile = require('gulp-modify-file');
const jsonModify = require('gulp-json-modify')
const path = require('path')

function zipRequest() {
    return src([
        './ViewerRequest/**/*.js',
        '!./ViewerRequest/node_modules/**',
        '!./ViewerRequest/test/**'
    ])
        .pipe(zip('ViewerRequest.zip'))
        .pipe(dest('./dist'));
}

function zipResponse() {
    return src([
        './ViewerResponse/**/*.js',
        '!./ViewerResponse/node_modules/**',
        '!./ViewerResponse/test/**'
    ])
        .pipe(zip('ViewerResponse.zip'))
        .pipe(dest('./dist'));
}

function prepare() {
    return src([
        'ViewerRequest/sdk/*.js'
    ])
        .pipe(dest('dist/ViewerRequest/sdk'));
}

exports.stripPackage = () => {
    return src(['./package.json'])
        .pipe(jsonModify({key: 'devDependencies', value: {}}))
        .pipe(jsonModify({key: 'scripts', value: {}}))
        .pipe(dest('./'))
}

exports.prepare = prepare;
exports.buildArtifacts = series(prepare, zipRequest, zipResponse);
exports.default = exports.buildArtifacts;