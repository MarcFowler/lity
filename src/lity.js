(function(window, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
            return factory(window, $);
        });
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(window, require('jquery'));
    } else {
        window.rvlb = factory(window, window.jQuery || window.Zepto);
    }
}(window, function(window, $) {
    'use strict';

    var document = window.document;

    var _win = $(window);

    var _imageRegexp = /\.(png|jpg|jpeg|gif|tiff|bmp)(\?\S*)?$/i;
    var _youtubeIdRegex = /v=([^&]+)/;
    var _vimeoIdRegex = /\/([^\?&]+)$/;

    var _defaultHandlers = {
        image: imageHandler,
        inline: inlineHandler,
        iframe: iframeHandler
    };

    var _defaultOptions = {
        esc: true
    };

    var transitionEndEvent = (function() {
        var el = document.createElement('div');

        var transEndEventNames = {
            WebkitTransition : 'webkitTransitionEnd',
            MozTransition : 'transitionend',
            OTransition : 'oTransitionEnd otransitionend',
            transition : 'transitionend'
        };

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return transEndEventNames[name];
            }
        }

        return false;
    })();

    function transitionEnd(element) {
        var deferred = $.Deferred();

        if (!transitionEndEvent) {
            deferred.resolve();
        } else {
            element.one(transitionEndEvent, deferred.resolve);
            setTimeout(deferred.reject, 500);
        }

        return deferred.promise();
    }

    var _html = '\
<div class="rv-lb rv-lb-loading" tabindex="-1">\
    <div class="rv-lb-wrap" data-rv-lb-close>\
        <div class="rv-lb-loader">Loading...</div>\
        <div class="rv-lb-container">\
            <div class="rv-lb-content"></div>\
            <button class="rv-lb-close" type="button" title="Close (Esc)" data-rv-lb-close>×</button>\
        </div>\
    </div>\
</div>';

    function settings(settings, key, value) {
        if (arguments.length === 1) {
            return $.extend({}, settings);
        }

        if (typeof key === 'string') {
            if (typeof value === 'undefined') {
                return typeof settings[key] === 'undefined' ?
                    null :
                    settings[key];
            }
            settings[key] = value;
        } else {
            $.extend(settings, key);
        }

        return this;
    }

    function protocol() {
        return 'file:' === window.location.protocol ? 'http:' : '';
    }

    function error(msg) {
        return $('<span class="rv-lb-error"/>').append(msg);
    }

    function imageHandler(target) {
        if (!_imageRegexp.test(target)) {
            return false;
        }

        var img = $('<img src="' + target + '">');
        var deferred = $.Deferred();
        var failed = function() {
            deferred.reject(error('Failed loading image'));
        };

        img
            .on('load', function() {
                if (this.naturalWidth === 0) {
                    return failed();
                }

                deferred.resolve(img);
            })
            .on('error', failed)
        ;

        return deferred.promise();
    }

    function inlineHandler(target) {
        try {
            var el = $(target);
        } catch (e) {
            return false;
        }

        var placeholder = $('<span style="display:none !important" class="rv-lb-inline-placeholder"/>');

        return el
            .after(placeholder)
            .on('rv-lb:ready', function(e, instance) {
                instance.one('rv-lb:close', function() {
                    placeholder
                        .before(el.addClass('rv-lb-hide'))
                        .remove()
                    ;
                });
            })
            ;
    }

    function iframeHandler(target) {
        var id;

        if (target.indexOf('youtube.') > -1 && target.indexOf('/embed') < 0) {
            id = _youtubeIdRegex.exec(target)[1];
            target = protocol() + '//www.youtube.com/embed/' + id + '?autoplay=1';
        }

        if (target.indexOf('vimeo.') > -1 && target.indexOf('player.vimeo.') < 0) {
            id = _vimeoIdRegex.exec(target.split('//')[1])[1];
            target = protocol() + '//player.vimeo.com/video/' + id + '?autoplay=1';
        }

        if (target.indexOf('//maps.google.') > -1 && target.indexOf('output=embed') < 0) {
            target += '&output=embed';
        }

        return '<div class="rv-lb-iframe-container"><iframe frameborder="0" allowfullscreen src="'+target+'"></iframe></div>';
    }

    function rvlb(options) {
        var _options = $.extend({}, _defaultOptions),
            _handlers = $.extend({}, _defaultHandlers),
            _instance,
            _content,
            _ready = $.Deferred().resolve();

        function keyup(e) {
            if (e.keyCode === 27) {
                close()
            }
        }

        function resize() {
            var height = document.documentElement.clientHeight ? document.documentElement.clientHeight : Math.round(_win.height());

            _content
                .css('max-height', Math.floor(height) + 'px')
                .trigger('rv-lb:resize', [_instance, popup])
            ;
        }

        function ready(content) {
            if (!_instance) {
                return;
            }

            _content = $(content);

            _win.on('resize', resize);
            resize();

            _instance
                .find('.rv-lb-loader')
                .each(function() {
                    var el = $(this);
                    transitionEnd(el).always(function() {
                        el.remove();
                    });
                })
            ;

            _instance
                .removeClass('rv-lb-loading')
                .find('.rv-lb-content')
                .empty()
                .append(_content)
            ;

            _content
                .removeClass('rv-lb-hide')
                .trigger('rv-lb:ready', [_instance, popup])
            ;

            _ready.resolve();
        }

        function init(handler, content, options) {
            _instance = $(_html).appendTo('body');

            if (!!options.esc) {
                _win.one('keyup', keyup);
            }

            setTimeout(function() {
                _instance
                    .addClass('rv-lb-opened rv-lb-' + handler)
                    .on('click', '[data-rv-lb-close]', function(e) {
                        $(e.target).is('[data-rv-lb-close]') && close();
                    })
                    .trigger('rv-lb:open', [_instance, popup])
                ;

                $.when(content).always(ready);
            }, 0);
        }

        function open(target, options) {
            var handler, content;

            if (options.handler && _handlers[options.handler]) {
                content = _handlers[options.handler](target, instance, popup);
                handler = options.handler;
            } else {
                var handlers = $.extend({}, _handlers), lateHandlers = {};

                // Run inline and iframe handlers after all other handlers
                $.each(['inline', 'iframe'], function(i, name) {
                    if (handlers[name]) {
                        lateHandlers[name] = handlers[name];
                    }

                    delete handlers[name];
                });

                var call = function(name, callback) {
                    // Handler might be "removed" by setting callback to null
                    if (!callback) {
                        return true;
                    }

                    content = callback(target, popup);

                    if (!!content) {
                        handler = name;
                        return false;
                    }
                };

                $.each(handlers, call);
                !handler && $.each(lateHandlers, call);
            }

            if (content) {
                _ready = $.Deferred();
                $.when(close()).done($.proxy(init, null, handler, content, options));
            }

            return !!content;
        }

        function close() {
            if (!_instance) {
                return;
            }

            var deferred = $.Deferred();

            _ready.done(function() {
                _win
                    .off('resize', resize)
                    .off('keyup', keyup)
                ;

                _content && _content
                    .trigger('rv-lb:close', [_instance, popup])
                ;

                _instance
                    .removeClass('rv-lb-opened')
                    .addClass('rv-lb-closed')
                ;

                var instance = _instance;
                _instance = null;
                _content = null;

                transitionEnd(instance).always(function() {
                    instance.remove();
                    deferred.resolve();
                });
            });

            return deferred.promise();
        }

        function popup(event) {
            // If not an event, act as alias of popup.open
            if (!event.preventDefault) {
                return popup.open(event);
            }

            var el = $(this);
            var target = el.data('rv-lb-target') || el.attr('href') || el.attr('src');

            if (!target) {
                return;
            }

            var options = $.extend(
                {},
                _options,
                el.data('rv-lb-options') || el.data('rv-lb')
            );

            open(target, options) && event.preventDefault();
        }

        popup.handlers = $.proxy(settings, popup, _handlers);
        popup.options = $.proxy(settings, popup, _options);

        popup.open = function(target) {
            open(target, _options);
            return popup;
        };

        popup.close = function() {
            close();
            return popup;
        };

        return popup.options(options);
    }

    rv-lb.version = '@VERSION';
    rv-lb.handlers = $.proxy(settings, rv-lb, _defaultHandlers);
    rv-lb.options = $.proxy(settings, rv-lb, _defaultOptions);

    $(document).on('click', '[data-rv-lb]', rv-lb());

    return rv-lb;
}));
