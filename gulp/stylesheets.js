module.exports = (GULP, GULP_PLUGINS) => {

    return function (callback) {

        var NODE_MODULES = {
            merge: require('merge-stream'),
            sassGlobImporter: require('node-sass-glob-importer'),
            stylelint: require('stylelint'),
            reporter: require('postcss-reporter')
        };

        var sources = [
            {
                input: [
                    process.env.HARBOR_SRC + '/**/main/stylesheets/*.scss',
                    process.env.HARBOR_SRC + '/**/partials/**/stylesheets/**.scss',
                    process.env.HARBOR_SRC + '/**/pages/**/stylesheets/**.scss',
                ],
                output: process.env.HARBOR_DIST
            }
        ];

        // Enable multiple streams for our Gulp task
        var streams = [];

        // Default processors we use in combination with the postcss package
        const postcss_processors = [
            NODE_MODULES.stylelint(),
            NODE_MODULES.reporter({
                clearReportedMessages: true,
                clearAllMessages: true,
            })
        ];

        // Here you can setup extra PostCSS processors
        if (process.env.HARBOR_ENV == 'production') {
            NODE_MODULES['autoprefixer'] = require('autoprefixer');
            NODE_MODULES['cssnano'] = require('cssnano');

            postcss_processors.push(
                NODE_MODULES.autoprefixer(),
                NODE_MODULES.cssnano()
            );
        }

        // Iterate trough each source we have defined within sources
        // Only compile modified Sass files
        for(var source in sources) {
            source = sources[source];

            var stream = GULP.src(source.input)
            .pipe(GULP_PLUGINS.newer(source.output))
            .pipe(GULP_PLUGINS.sourcemaps.init())
            .pipe(GULP_PLUGINS.sass({
                outputStyle: 'expanded',
                includePaths: [
                    require('node-normalize-scss').includePaths,
                    process.env.HARBOR_SRC,
                    process.env.HARBOR_PACKAGES
                ],
                importer: [
                    NODE_MODULES.sassGlobImporter()
                ]
            }).on('error', GULP_PLUGINS.sass.logError))
            .pipe(GULP_PLUGINS.sourcemaps.write('./'))
            .pipe(GULP.dest(source.output))
            .pipe(GULP_PLUGINS.filter('**/*.css'))
            .pipe(GULP_PLUGINS.postcss(postcss_processors))
            .pipe(GULP_PLUGINS.rename({ extname: '.min.css' }))
            .pipe(GULP_PLUGINS.sourcemaps.write('./'))
            .pipe(GULP.dest(source.output));

            streams.push(stream);
        }

        return NODE_MODULES.merge(streams);
    };
};