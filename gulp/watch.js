module.exports = (GULP, GULP_PLUGINS, REVISION) => {

    return function (callback) {

        var NODE_MODULES = {
            merge: require('merge-stream')
        };

        let options = {
            read: false,
            readDelay: 250
        };

        let stylesheets = GULP_PLUGINS.watch([
            process.env.HARBOR_SRC + '/**/stylesheets/**/*.scss',
            process.env.HARBOR_PACKAGES + '/**/stylesheets/**/*.scss',
        ], options, function(events, done) {
            return GULP.start('stylesheets');
        });

        return NODE_MODULES.merge(
            stylesheets
        );
    };
};