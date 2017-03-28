var gulp        = require('gulp');
var sass        = require('gulp-sass');
var cssnano     = require('gulp-cssnano');


gulp.task('watch', function() {
    gulp.watch("src/sass/**/*.sass", ['sass'])
});

gulp.task('sass', function() {
    return gulp.src("src/sass/style.sass")
        .pipe(sass())
        .pipe(cssnano())
        .pipe(gulp.dest("public/css"))
});

gulp.task('build', ['sass']);