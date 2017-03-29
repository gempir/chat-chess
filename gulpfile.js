const gulp        = require('gulp');
const sass        = require('gulp-sass');
const cssnano     = require('gulp-cssnano');
const babel       = require('gulp-babel');
const concat      = require('gulp-concat');
const uglify      = require('gulp-uglify');

gulp.task('watch', function() {
    gulp.watch("src/sass/**/*.sass", ['sass'])
    gulp.watch("src/js/**/*.js", ['transpile'])
});

gulp.task('sass', function() {
    return gulp.src("src/sass/style.sass")
        .pipe(sass())
        .pipe(cssnano())
        .pipe(gulp.dest("public/css"))
});



gulp.task('transpile', function() {
    gulp.src('src/js/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/js/'));
});



gulp.task('build', ['sass','transpile']);