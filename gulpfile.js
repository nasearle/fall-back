const { series, parallel, src, dest } = require('gulp');
const del = require('del');
const uglify = require('gulp-uglify-es').default;
const htmlmin = require('gulp-htmlmin');
const cssmin = require('gulp-clean-css');
const zip = require('gulp-zip');
const include = require('gulp-include');

const paths = {
    root: '.',
    src: {
        base: 'dev',
        html: `dev/**/*.html`,
        css: `dev/**/*.css`,
        js: `dev/**/*.js`,
        assets: `dev/assets/**`,
        lib: `dev/lib/**/*`
    },
    dist: {
        base: 'public',
        dir: `public`,
        assets: `public/assets`,
        all: `public/**/*`
    },
    zip: `public.zip`
};
const jsOptions = {
    mangle: {
        toplevel: true, // mangles top level names
        reserved: ['kontra'] // don't mangle var=kontra, expected in client.js
    },
    nameCache: {}, // prevents mangled-name conflicts across files
};
const htmlOptions = { collapseWhitespace: true }

function cleanTask() {
    return del([paths.dist.dir, paths.zip]);
}

function buildJsTask() {
    return src(paths.src.js, { ignore: paths.src.lib })
        .pipe(include()) // inserts lib files into server.js
        /* Uglification makes debugging hard during dev. TODO: restore closer to production */
        // .pipe(uglify(jsOptions))
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
function buildAssetsTask() {
    return src(paths.src.assets)
        .pipe(dest(paths.dist.assets));
}

function zipTask() {
    return src(paths.dist.all)
        .pipe(zip(paths.zip))
        .pipe(dest(paths.root))
}

exports.build = series(
    cleanTask,
    parallel(buildJsTask, buildHtmlTask, buildCssTask, buildAssetsTask),
    zipTask
);
