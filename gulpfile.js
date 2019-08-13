const { series, parallel, src, dest } = require('gulp');
const del = require('del');
const uglify = require('gulp-uglify-es').default;
const htmlmin = require('gulp-htmlmin');
const cssmin = require('gulp-clean-css');
const zip = require('gulp-zip');
const checkFileSize = require('gulp-check-filesize');

const paths = {
    root: '.',
    src: {
        html: 'public/**/*.html',
        css: 'public/**/*.css',
        js: 'public/**/*.js',
        images: 'public/images/**'
    },
    dist: {
        dir: 'build',
        images: 'build/images',
        all: 'build/**/*'
    },
    zip: 'build.zip'
};
const jsOptions = {
    mangle: { toplevel: true, }
};
const htmlOptions = { collapseWhitespace: true }

function cleanTask() {
    return del([paths.dist.dir, paths.zip]);
}

function buildJsTask() {
    return src(paths.src.js)
        .pipe(uglify(jsOptions))
        .pipe(dest(paths.dist.dir));
}

function buildHtmlTask() {
    return src(paths.src.html)
        .pipe(htmlmin(htmlOptions))
        .pipe(dest(paths.dist.dir));
}

function buildCssTask() {
    return src(paths.src.css)
        .pipe(cssmin())
        .pipe(dest(paths.dist.dir));
}

// TODO: optimize images if applicable

function zipTask() {
    const thirteenKb = 13 * 1024;
    return src(paths.dist.all)
        .pipe(zip(paths.zip))
        .pipe(dest(paths.root))
        .pipe(checkFileSize({ fileSizeLimit: thirteenKb }));
}

exports.build = series(
    cleanTask,
    parallel(buildJsTask, buildHtmlTask, buildCssTask),
    zipTask
);
