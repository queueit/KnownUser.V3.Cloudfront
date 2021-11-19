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


function addExports(content) {
    content = "var exportObject = {};\n" + content;
    content += `
var Utils = exportObject.Utils;
var KnownUser = exportObject.KnownUser;
export { KnownUser, Utils };`;
    const lastPropertyDefinition = content.lastIndexOf('Object.defineProperty(');
    const newLine = content.indexOf('\n', lastPropertyDefinition);
    const firstPart = content.substring(0, newLine);
    const secondPart = content.substring(newLine + 1);
    return firstPart + `
        exportObject.KnownUser = KnownUser_1.KnownUser;
        exportObject.Utils = QueueITHelpers_1.Utils;
    ` + secondPart;
}

function prepare(){
    return src([
        'ViewerRequest/sdk/*.js'
    ])
        .pipe(modifyFile((content, filePath, _) => {
            let filename = path.basename(filePath);
            if (filename !== 'queueit-knownuserv3-sdk.js') {
                return content;
            }
            content = addExports(content);
            return content;
        }))
        .pipe(dest('dist/ViewerRequest/sdk'));
}

exports.stripPackage = () => {
    return src(['./package.json'])
        .pipe(jsonModify({ key: 'devDependencies', value: {}}))
        .pipe(jsonModify({ key: 'scripts', value: {}}))
        .pipe(dest('./'))
}

exports.prepare = prepare;
exports.buildArtifacts = series(prepare, zipRequest, zipResponse);
exports.default = exports.buildArtifacts;