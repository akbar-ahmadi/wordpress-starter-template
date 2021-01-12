import gulp from "gulp";
import yargs from "yargs";
import sass from "gulp-sass";
import cleanCSS from "gulp-clean-css";
import gulpif from "gulp-if";
import sourcemaps from "gulp-sourcemaps";
import imagemin from "gulp-imagemin";
import del from "del";
import webpack from "webpack-stream";
import uglify from "gulp-uglify";
import named from "vinyl-named";
import browserSync from "browser-sync";
import zip from "gulp-zip";

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();

const paths = {
    styles: {
        src: [
            'src/scss/bundle.scss'],
        dest: 'dist/css'
    },
    scripts: {
        src: [
            'node_modules/bootstrap/dist/js/bootstrap.min.js',
            'src/js/bundle.js'
        ],
        dest: 'dist/js'
    },
    images: {
        src: 'src/images/**/*.{png,svg,jpeg,jpg,gif}',
        dest: 'dist/images'
    },
    other: {
        src: ['src/**/*', '!src/assets/{images,js,scss}', '!src/assets/{images,js,scss}/**/*'],
        dest: 'dist'
    },
    // html: {
    //     src: ['src/html/**/*'],
    //     dest: 'dist'
    // },
    package: {
        src: ['**/*', '!.vscode', '!node_modules{,/**}', '!packaged{,/**}', '!src{,/**}', '!.babelrc', '!.gitignore',
            '!gulpfile.babel.js', '!package.json', '!package-lock.json'],
        dest: 'packaged'
    }
}
export const serve = (done) => {
    server.init({
        server: "."
    });
    done();
}

export const reload = (done) => {
    server.reload();
    done();
}
export const compress = () => {
    return gulp.src(paths.package.src)
        .pipe(zip('theme.zip'))
        .pipe(gulp.dest(paths.package.dest))
}
export const clean = () => {
    return del(['dest']);
}

export const styles = () => {
    return gulp.src(paths.styles.src)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, cleanCSS({compatibility: 'ie8'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(gulp.dest(paths.styles.dest));
}
export const images = () => {
    return gulp.src(paths.images.src)
        .pipe(gulpif(PRODUCTION, imagemin()))
        .pipe(gulp.dest(paths.images.dest));
}
export const scripts = () => {
    return gulp.src(paths.scripts.src)
        .pipe(named())
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        }
                    }
                ]
            },
            output: {
                filename: '[name].js'
            },
            devtool: !PRODUCTION ? 'inline-source-map' : false
        }))
        .pipe(gulpif(PRODUCTION, uglify()))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(server.stream());
}
export const watch = () => {
    gulp.watch('src/scss/**/*.scss', gulp.series([styles, reload]));
    gulp.watch('src/js/**/*.js', gulp.series([scripts, reload]));
    gulp.watch('**/*.php', reload);
    gulp.watch(paths.images.src, images);
}

export const copy = () => {
    return gulp.src(paths.other.src)
        .pipe(gulp.dest(paths.other.dest));
}
// export const copyHtml = () => {
//     return gulp.src(paths.html.src)
//         .pipe(gulp.dest(paths.html.dest));
// }
export const dev = gulp.series(clean, gulp.parallel(styles, scripts, images,copy), serve, watch);
export const build = gulp.series(clean, gulp.parallel(styles, scripts, images,copy));
export const bundle = gulp.series(build, compress);

export default dev;
