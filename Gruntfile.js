'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        clean: {
            css: ['dist/*.css'],
            js: ['dist/*.js']
        },
        less: {
            options: {
                banner: '<%= banner %>'
            },
            src: {
                src: 'src/lity.less',
                dest: 'dist/<%= pkg.name %>.css'
            },
            min: {
                options: {
                    compress: true
                },
                src: 'src/lity.less',
                dest: 'dist/<%= pkg.name %>.min.css'
            }
        },
        autoprefixer: {
            options: {
                browsers: [
                    'Android 2.3',
                    'Android >= 4',
                    'Chrome >= 20',
                    'Firefox >= 24',
                    'Explorer >= 8',
                    'iOS >= 6',
                    'Opera >= 12',
                    'Safari >= 6'
                ]
            },
            src: {
                expand: true,
                flatten: true,
                src: ['dist/*.css', '!dist/*.min.css'],
                dest: 'dist/'
            },
            min: {
                options: {
                    cascade: false
                },
                expand: true,
                flatten: true,
                src: 'dist/*.min.css',
                dest: 'dist/'
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            src: {
                separator: ';\n',
                src: ['src/header.js', 'vendor/zepto.js', 'src/loadCSS.js', 'src/pre.js', 'src/lity.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            min: {
                src: 'dist/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        replace: {
            dist: {
                options: {
                    variables: {
                        VERSION: '<%= pkg.version %>',
                        DATE: '<%= grunt.template.today("yyyy-mm-dd") %>'
                    },
                    prefix: '@'
                },
                files: [
                    {
                        src: ['dist/*.js'],
                        dest: './'
                    }
                ]
            }
        },
        watch: {
            css: {
                files: 'src/*.less',
                tasks: ['dist-css']
            },
            js: {
                files: 'src/*.js',
                tasks: ['dist-js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('dist-css', ['clean:css', 'less', 'autoprefixer']);
    grunt.registerTask('dist-js', ['clean:js', 'concat', 'uglify', 'replace']);
    grunt.registerTask('default', ['dist-css', 'dist-js']);
};
