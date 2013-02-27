define(
    'common/mockup',
    function() {
        var mapping = {};

        var ajax = require('er/ajax');
        ajax.request = function(options) {
            if (!mapping[options.url]) {
                return null;
            }

            var data = mapping[options.url](options);
            var Deferred = require('er/Deferred');
            return Deferred.resolved(data);
        };

        return {
            add: function(url, handler) {
                mapping[url] = handler;
            }
        };
    }
);