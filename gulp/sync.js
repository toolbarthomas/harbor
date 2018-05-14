module.exports = (GULP, GULP_PLUGINS) => {
    return function (callback) {

        var NODE_MODULES = {
            merge: require('merge-stream')
        };

        var ignores = [
            'handlebars',
            'twig',
            'md',
            'json'
        ];

        var src = GULP.src([
            process.env.HARBOR_SRC + '/**/images/**',
            process.env.HARBOR_SRC + '/**/webfonts/**',
            '!' + process.env.HARBOR_SRC + '/**/*.{' + ignores + '}',
        ], {
            buffer: false,
            nodir: false
        })
        .pipe(GULP_PLUGINS.newer(process.env.HARBOR_DIST))
        .pipe(GULP.dest(process.env.HARBOR_DIST));

        return NODE_MODULES.merge(src);
    };
};